"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { randomInt } from "crypto";
import { REFERRAL_CODE_CHARS } from "@/lib/constants";
import { hashIp } from "@/lib/referral-click";
import { isDisposableEmail, isProfileQualifiedForReferral, getReferralMilestoneStatus } from "@/lib/referral-reward";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app";

function createAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Crypto-secure code generation — Math.random() codes are predictable and
// would let an attacker enumerate another athlete's referral code.
function generateCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += REFERRAL_CODE_CHARS[randomInt(REFERRAL_CODE_CHARS.length)];
  }
  return code;
}

export type ReferralStats = {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  proDaysEarned: number;
  extendedProUntil: string | null;
};

export type ReferralHistoryEntry = {
  id: string;
  referred_name: string | null;
  referred_sport: string | null;
  status: string;
  created_at: string;
};

export type ReferralFunnel = {
  clicks: number;
  conversions: number;
};

export type LeaderboardEntry = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  referrals: number;
};

export async function getOrCreateReferralCode(): Promise<{ code: string; link: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { code: "", link: "" };

    const admin = createAdmin();

    const { data: existing } = await admin
      .from("referral_codes")
      .select("code")
      .eq("user_id", user.id)
      .single();

    if (existing?.code) {
      return { code: existing.code, link: `${SITE_URL}/r/${existing.code}` };
    }

    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const { error: insertErr } = await admin
        .from("referral_codes")
        .insert({ user_id: user.id, code });
      if (!insertErr) break;
      code = generateCode();
      attempts++;
    }

    return { code, link: `${SITE_URL}/r/${code}` };
  } catch (err) {
    console.error("[referrals] getOrCreateReferralCode error:", err);
    return { code: "", link: "" };
  }
}

export async function getReferralStats(): Promise<ReferralStats> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { referralCode: "", referralLink: "", totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, proDaysEarned: 0, extendedProUntil: null };
    }

    const admin = createAdmin();

    const { data: codeRow } = await admin
      .from("referral_codes")
      .select("code")
      .eq("user_id", user.id)
      .single();

    const code = codeRow?.code || "";
    const link = code ? `${SITE_URL}/r/${code}` : "";

    const { count: total } = await admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    const { count: completed } = await admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .eq("status", "completed");

    const { count: pending } = await admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .eq("status", "pending");

    const { data: profile } = await admin
      .from("profiles")
      .select("extended_pro_until")
      .eq("id", user.id)
      .single();

    const completedCount = completed || 0;
    const milestone = getReferralMilestoneStatus(completedCount);
    const proDaysEarned = milestone.totalDaysEarned;

    return {
      referralCode: code,
      referralLink: link,
      totalReferrals: total || 0,
      completedReferrals: completedCount,
      pendingReferrals: pending || 0,
      proDaysEarned,
      extendedProUntil: profile?.extended_pro_until || null,
    };
  } catch (err) {
    console.error("[referrals] getReferralStats error:", err);
    return { referralCode: "", referralLink: "", totalReferrals: 0, completedReferrals: 0, pendingReferrals: 0, proDaysEarned: 0, extendedProUntil: null };
  }
}

export async function recordReferral(code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    // Anti-Cheat: Reject disposable/temp emails
    if (isDisposableEmail(user.email)) {
      return { ok: false, error: "Temporary/disposable email addresses are not allowed." };
    }

    const admin = createAdmin();

    const { data: codeRow, error: codeErr } = await admin
      .from("referral_codes")
      .select("user_id, code")
      .ilike("code", code)
      .eq("is_active", true)
      .single();

    if (codeErr || !codeRow) return { ok: false, error: "Invalid referral code" };
    if (codeRow.user_id === user.id) return { ok: false, error: "Cannot refer yourself" };

    const { data: existingReferral } = await admin
      .from("referrals")
      .select("id")
      .eq("referred_id", user.id)
      .maybeSingle();

    if (existingReferral) return { ok: false, error: "Already referred" };

    // Insert referral in 'pending' status. It completes when referred athlete publishes card.
    const { error: insertErr } = await admin
      .from("referrals")
      .insert({
        referrer_id: codeRow.user_id,
        referred_id: user.id,
        code_used: codeRow.code,
        status: "pending",
        reward_days: 0,
      });

    if (insertErr) {
      console.error("[referrals] insert error:", insertErr);
      return { ok: false, error: `Insert failed: ${insertErr.message}` };
    }

    // Check if profile is already completed & published
    await checkAndRewardReferral(user.id);

    return { ok: true };
  } catch (err) {
    console.error("[referrals] recordReferral error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to record referral" };
  }
}

// Anti-Cheat Reward Qualifier: Evaluates pending referral when referred user publishes card.
export async function checkAndRewardReferral(referredUserId: string): Promise<boolean> {
  try {
    const admin = createAdmin();

    const { data: referral } = await admin
      .from("referrals")
      .select("id, referrer_id, status")
      .eq("referred_id", referredUserId)
      .maybeSingle();

    if (!referral || referral.status === "completed" || referral.status === "rewarded") return false;

    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, avatar_url, bio, stats, profile_published")
      .eq("id", referredUserId)
      .single();

    if (!isProfileQualifiedForReferral(profile)) return false;

    // Referred athlete is qualified! Upgrade referral to 'completed'
    await admin
      .from("referrals")
      .update({
        status: "completed",
        rewarded_at: new Date().toISOString(),
      })
      .eq("id", referral.id);

    // Get updated count of completed referrals for referrer
    const { count: completedCount } = await admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", referral.referrer_id)
      .in("status", ["completed", "rewarded"]);

    const milestoneStatus = getReferralMilestoneStatus(completedCount || 0);

    // Extend referrer's Pro access based on earned milestone days (up to 365 days max cap).
    // Never SHRINK an existing window: take the max of current vs new expiry.
    if (milestoneStatus.totalDaysEarned > 0) {
      const { data: referrerProfile } = await admin
        .from("profiles")
        .select("extended_pro_until")
        .eq("id", referral.referrer_id)
        .single();

      const existingUntil = referrerProfile?.extended_pro_until
        ? new Date(referrerProfile.extended_pro_until).getTime()
        : 0;
      const newUntil = Date.now() + milestoneStatus.totalDaysEarned * 24 * 60 * 60 * 1000;
      const proUntilDate = new Date(Math.max(existingUntil, newUntil)).toISOString();

      await admin
        .from("profiles")
        .update({ extended_pro_until: proUntilDate })
        .eq("id", referral.referrer_id);
    }

    // Grant 30 days Pro bonus to the newly joined athlete as well
    const { data: referredProfile } = await admin
      .from("profiles")
      .select("extended_pro_until")
      .eq("id", referredUserId)
      .single();

    const existingReferredUntil = referredProfile?.extended_pro_until
      ? new Date(referredProfile.extended_pro_until).getTime()
      : 0;
    const welcomeProDate = new Date(
      Math.max(existingReferredUntil, Date.now() + 30 * 24 * 60 * 60 * 1000)
    ).toISOString();
    await admin
      .from("profiles")
      .update({ extended_pro_until: welcomeProDate })
      .eq("id", referredUserId);

    return true;
  } catch (err) {
    console.error("[referrals] checkAndRewardReferral error:", err);
    return false;
  }
}

export async function getReferralFunnel(): Promise<ReferralFunnel> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { clicks: 0, conversions: 0 };

    const admin = createAdmin();

    const { count: clicks } = await admin
      .from("referral_clicks")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    const { count: conversions } = await admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .in("status", ["completed", "rewarded"]);

    return { clicks: clicks || 0, conversions: conversions || 0 };
  } catch (err) {
    console.error("[referrals] getReferralFunnel error:", err);
    return { clicks: 0, conversions: 0 };
  }
}

export async function getReferralLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const admin = createAdmin();

    const { data: referrals } = await admin
      .from("referrals")
      .select("referrer_id")
      .in("status", ["completed", "rewarded"])
      .limit(1000);

    if (!referrals || referrals.length === 0) return [];

    const counts = new Map<string, number>();
    for (const r of referrals) {
      counts.set(r.referrer_id, (counts.get(r.referrer_id) || 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

    const ids = top.map(([id]) => id);
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", ids);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return top.map(([id, count]) => {
      const profile = profileMap.get(id);
      return {
        id,
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        referrals: count,
      };
    });
  } catch (err) {
    console.error("[referrals] getReferralLeaderboard error:", err);
    return [];
  }
}

export async function getReferralHistory(): Promise<ReferralHistoryEntry[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const admin = createAdmin();

    const { data: referrals } = await admin
      .from("referrals")
      .select("id, status, created_at, referred_id")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!referrals || referrals.length === 0) return [];

    const referredIds = referrals.map((r) => r.referred_id);
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, sport")
      .in("id", referredIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return referrals.map((r) => {
      const profile = profileMap.get(r.referred_id);
      return {
        id: r.id,
        referred_name: profile?.full_name || "New athlete",
        referred_sport: profile?.sport || null,
        status: r.status,
        created_at: r.created_at,
      };
    });
  } catch (err) {
    console.error("[referrals] getReferralHistory error:", err);
    return [];
  }
}

export async function trackReferralClick(code: string, ip: string | null, ua: string | null) {
  try {
    const admin = createAdmin();
    const { data: row } = await admin
      .from("referral_codes")
      .select("user_id, code")
      .ilike("code", code)
      .eq("is_active", true)
      .single();
    if (!row) return;
    await admin.from("referral_clicks").insert({
      code: row.code,
      referrer_id: row.user_id,
      ip_hash: hashIp(ip, process.env.ANALYTICS_IP_HASH_SECRET),
      user_agent: ua ?? null,
    });
  } catch (err) {
    console.error("[referrals] trackReferralClick error:", err);
  }
}
