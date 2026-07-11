"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app";
const REWARD_DAYS = 7;

function createAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
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
    const proDaysEarned = completedCount * REWARD_DAYS;

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

    const { data: codeRow } = await admin
      .from("referral_codes")
      .select("user_id, code")
      .ilike("code", code)
      .eq("is_active", true)
      .single();

    if (!codeRow) return { ok: false, error: "Invalid referral code" };
    if (codeRow.user_id === user.id) return { ok: false, error: "Cannot refer yourself" };

    const { data: existingReferral } = await admin
      .from("referrals")
      .select("id")
      .eq("referred_id", user.id)
      .single();

    if (existingReferral) return { ok: false, error: "Already referred" };

    const { error: insertErr } = await admin
      .from("referrals")
      .insert({
        referrer_id: codeRow.user_id,
        referred_id: user.id,
        code_used: codeRow.code,
        status: "completed",
        reward_days: REWARD_DAYS,
        rewarded_at: new Date().toISOString(),
      });

    if (insertErr) {
      console.error("[referrals] insert error:", insertErr);
      return { ok: false, error: "Failed to record referral" };
    }

    await admin.rpc("grant_pro_reward", { referrer_uuid: codeRow.user_id });

    return { ok: true };
  } catch (err) {
    console.error("[referrals] recordReferral error:", err);
    return { ok: false, error: "Failed to record referral" };
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
