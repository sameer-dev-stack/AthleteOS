"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { REFERRAL_REWARD_DAYS, REFERRAL_CODE_CHARS } from "@/lib/constants";
import { hashIp } from "@/lib/referral-click";
import { usersToReward } from "@/lib/referral-reward";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app";

function createAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += REFERRAL_CODE_CHARS[Math.floor(Math.random() * REFERRAL_CODE_CHARS.length)];
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
    const proDaysEarned = completedCount * REFERRAL_REWARD_DAYS;

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

    const admin = createAdmin();

    const { data: codeRow, error: codeErr } = await admin
      .from("referral_codes")
      .select("user_id, code")
      .ilike("code", code)
      .eq("is_active", true)
      .single();

    if (codeErr || !codeRow) return { ok: false, error: "Invalid referral code" };
    if (codeRow.user_id === user.id) return { ok: false, error: "Cannot refer yourself" };

    const { data: existingReferral, error: existErr } = await admin
      .from("referrals")
      .select("id")
      .eq("referred_id", user.id)
      .maybeSingle();

    if (existingReferral) return { ok: false, error: "Already referred" };

    const { error: insertErr } = await admin
      .from("referrals")
      .insert({
        referrer_id: codeRow.user_id,
        referred_id: user.id,
        code_used: codeRow.code,
        status: "completed",
        reward_days: REFERRAL_REWARD_DAYS,
        rewarded_at: new Date().toISOString(),
      });

    if (insertErr) {
      console.error("[referrals] insert error:", insertErr);
      return { ok: false, error: `Insert failed: ${insertErr.message}` };
    }

    // Two-sided reward: referrer AND referred both earn Pro (standard referral model).
    const rewarded = usersToReward(codeRow.user_id, user.id, codeRow.user_id === user.id, false);
    for (const uid of rewarded) {
      const { error: rpcErr } = await admin.rpc("grant_pro_reward", { referrer_uuid: uid });
      if (rpcErr) console.error("[referrals] grant_pro_reward error:", rpcErr);
    }

    return { ok: true };
  } catch (err) {
    console.error("[referrals] recordReferral error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to record referral" };
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
