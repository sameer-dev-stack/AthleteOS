"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { MINIMUM_PAYOUT_CENTS } from "@/lib/constants";

export type BalanceSummary = {
  earned: number;
  pending: number;
  available: number;
  withdrawn: number;
  connected: boolean;
  onboardingComplete: boolean;
};

export type PayoutRecord = {
  id: string;
  amount: number;
  status: string;
  arrivalDate: string | null;
  createdAt: string;
};

type AdminClient = any;

async function getEarnedAndWithdrawn(admin: AdminClient, userId: string): Promise<{
  earned: number;
  withdrawn: number;
  pending: number;
}> {
  const [tipsRes, payoutsRes] = await Promise.all([
    admin
      .from("tips")
      .select("net_amount")
      .eq("athlete_id", userId)
      .eq("status", "succeeded"),
    admin
      .from("payouts")
      .select("amount, status")
      .eq("athlete_id", userId),
  ]);

  const tips = (tipsRes.data as Array<{ net_amount: number }> | null) || [];
  const payouts = (payoutsRes.data as Array<{ amount: number; status: string }> | null) || [];

  const earned = tips.reduce((sum: number, t) => sum + (t.net_amount ?? 0), 0);
  const withdrawn = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum: number, p) => sum + (p.amount ?? 0), 0);
  const pending = payouts
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((sum: number, p) => sum + (p.amount ?? 0), 0);

  return { earned, withdrawn, pending };
}

export async function getBalanceSummary(): Promise<{
  ok: boolean;
  data?: BalanceSummary;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("payout_method, payout_settings")
    .eq("id", user.id)
    .single();

  const hasPayoutMethod = profile?.payout_method === "paypal" && !!profile?.payout_settings?.email;

  const { earned, withdrawn, pending } = await getEarnedAndWithdrawn(admin, user.id);
  const available = Math.max(0, earned - withdrawn - pending);

  return {
    ok: true,
    data: {
      earned,
      pending,
      available,
      withdrawn,
      connected: hasPayoutMethod,
      onboardingComplete: hasPayoutMethod,
    },
  };
}

export async function getPayoutHistory(): Promise<{
  ok: boolean;
  data?: PayoutRecord[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await admin
      .from("payouts")
      .select("id, amount, status, arrival_date, created_at")
      .eq("athlete_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return { ok: false, error: error.message };

    return {
      ok: true,
      data: (data || []).map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        arrivalDate: p.arrival_date,
        createdAt: p.created_at,
      })),
    };
  } catch (err) {
    console.error("[balance] getPayoutHistory error:", err);
    return { ok: false, error: "Failed to load payout history" };
  }
}

/**
 * Create a withdrawal request. Money is NOT moved here — AthleteOS reviews
 * pending requests and sends the funds to the athlete's payout method
 * within 48 hours.
 */
export async function createPayout(): Promise<{
  ok: boolean;
  data?: { payoutId: string; amount: number };
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("payout_method, payout_settings")
    .eq("id", user.id)
    .single();

  if (profile?.payout_method !== "paypal" || !profile?.payout_settings?.email) {
    return { ok: false, error: "Tip withdrawals are processed exclusively via PayPal. Connect your PayPal account to request a payout." };
  }

  // Prevent double-withdrawal: block if a withdrawal was requested recently
  const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data: recentPayout } = await admin
    .from("payouts")
    .select("id")
    .eq("athlete_id", user.id)
    .in("status", ["pending", "processing"])
    .gte("created_at", fiveMinAgo)
    .limit(1);
  if (recentPayout && recentPayout.length > 0) {
    return { ok: false, error: "A withdrawal was recently requested. Please wait before trying again." };
  }

  const { earned, withdrawn, pending } = await getEarnedAndWithdrawn(admin, user.id);
  const available = Math.max(0, earned - withdrawn - pending);

  if (available < MINIMUM_PAYOUT_CENTS) {
    return {
      ok: false,
      error: `Minimum withdrawal is $${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)}. You have $${(available / 100).toFixed(2)} available.`,
    };
  }

  const { data: payout, error } = await admin
    .from("payouts")
    .insert({
      athlete_id: user.id,
      amount: available,
      status: "pending",
      payout_method: profile.payout_method,
      payout_destination: profile.payout_settings ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[balance] createPayout insert failed:", error);
    return { ok: false, error: "Failed to request withdrawal. Please try again." };
  }

  // Fire-and-forget: email the athlete confirming their withdrawal request
  try {
    const { sendPayoutRequestedEmail } = await import("./emails");
    const { data: emailProfile } = await admin
      .from("profiles")
      .select("email, full_name, payout_settings")
      .eq("id", user.id)
      .single();
    if (emailProfile?.email) {
      const paypalEmail = (emailProfile.payout_settings as Record<string, string> | null)?.email ?? "";
      sendPayoutRequestedEmail(
        emailProfile.email,
        emailProfile.full_name,
        (available / 100).toFixed(2),
        paypalEmail
      ).catch(() => {});
    }
  } catch { /* non-blocking */ }

  return { ok: true, data: { payoutId: payout.id, amount: available } };
}
