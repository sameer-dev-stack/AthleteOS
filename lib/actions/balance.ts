"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
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
    .select("stripe_account_id, stripe_onboarding_complete, payout_method")
    .eq("id", user.id)
    .single();

  const hasManualPayout = !!profile?.payout_method;

  if (hasManualPayout) {
    const [tipsRes, payoutsRes] = await Promise.all([
      admin
        .from("tips")
        .select("net_amount")
        .eq("athlete_id", user.id)
        .eq("status", "succeeded"),
      admin
        .from("payouts")
        .select("amount")
        .eq("athlete_id", user.id)
        .eq("status", "paid"),
    ]);

    const earned = (tipsRes.data || []).reduce((sum, t) => sum + t.net_amount, 0);
    const withdrawn = (payoutsRes.data || []).reduce((sum, p) => sum + p.amount, 0);
    const available = Math.max(0, earned - withdrawn);

    return {
      ok: true,
      data: {
        earned,
        pending: 0,
        available,
        withdrawn,
        connected: true,
        onboardingComplete: true,
      },
    };
  }

  if (!profile?.stripe_account_id) {
    const { data: tips } = await admin
      .from("tips")
      .select("net_amount")
      .eq("athlete_id", user.id)
      .eq("status", "succeeded");

    const earned = (tips || []).reduce((sum, t) => sum + t.net_amount, 0);
    return {
      ok: true,
      data: { earned, pending: 0, available: 0, withdrawn: 0, connected: false, onboardingComplete: false },
    };
  }

  try {
    const [balanceRes, tipsRes, payoutsRes] = await Promise.all([
      stripe.balance.retrieve({}, { stripeAccount: profile.stripe_account_id }),
      admin
        .from("tips")
        .select("net_amount")
        .eq("athlete_id", user.id)
        .eq("status", "succeeded"),
      admin
        .from("payouts")
        .select("amount")
        .eq("athlete_id", user.id)
        .eq("status", "paid"),
    ]);

    const earned = (tipsRes.data || []).reduce((sum, t) => sum + t.net_amount, 0);
    const available = balanceRes.available.reduce((sum, b) => sum + b.amount, 0);
    const pending = balanceRes.pending.reduce((sum, b) => sum + b.amount, 0);
    const withdrawn = (payoutsRes.data || []).reduce((sum, p) => sum + p.amount, 0);

    return {
      ok: true,
      data: {
        earned,
        pending,
        available,
        withdrawn,
        connected: true,
        onboardingComplete: profile.stripe_onboarding_complete,
      },
    };
  } catch (err) {
    console.error("[balance] getBalanceSummary failed", err);
    return { ok: false, error: "Failed to fetch balance" };
  }
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
    .select("stripe_account_id, stripe_onboarding_complete, payout_method")
    .eq("id", user.id)
    .single();

  const hasManualPayout = !!profile?.payout_method;

  if (hasManualPayout) {
    // Prevent double-withdrawal: check for recent pending payout
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const { data: recentPayout } = await admin
      .from("payouts")
      .select("id")
      .eq("athlete_id", user.id)
      .gte("created_at", fiveMinAgo)
      .limit(1);
    if (recentPayout && recentPayout.length > 0) {
      return { ok: false, error: "A payout was recently initiated. Please wait before trying again." };
    }

    const { data: tips } = await admin
      .from("tips")
      .select("net_amount")
      .eq("athlete_id", user.id)
      .eq("status", "succeeded");
    const { data: payouts } = await admin
      .from("payouts")
      .select("amount")
      .eq("athlete_id", user.id)
      .eq("status", "paid");

    const earned = (tips || []).reduce((sum, t) => sum + t.net_amount, 0);
    const withdrawn = (payouts || []).reduce((sum, p) => sum + p.amount, 0);
    const available = Math.max(0, earned - withdrawn);

    if (available < MINIMUM_PAYOUT_CENTS) {
      return {
        ok: false,
        error: `Minimum withdrawal is $${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)}. You have $${(available / 100).toFixed(2)} available.`,
      };
    }

    await admin.from("payouts").insert({
      athlete_id: user.id,
      amount: available,
      stripe_payout_id: null,
      status: "paid",
      arrival_date: new Date().toISOString().split("T")[0],
    }).select("id").single();

    return { ok: true, data: { payoutId: "manual-" + Date.now(), amount: available } };
  }

  if (!profile?.stripe_account_id || !profile.stripe_onboarding_complete) {
    return { ok: false, error: "Connect your bank account first" };
  }

  try {
    const balance = await stripe.balance.retrieve(
      {},
      { stripeAccount: profile.stripe_account_id }
    );

    const available = balance.available.reduce((sum, b) => sum + b.amount, 0);

    if (available < MINIMUM_PAYOUT_CENTS) {
      return {
        ok: false,
        error: `Minimum withdrawal is $${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)}. You have $${(available / 100).toFixed(2)} available.`,
      };
    }

    const payout = await stripe.payouts.create(
      { amount: available, currency: "usd" },
      { stripeAccount: profile.stripe_account_id }
    );

    await admin.from("payouts").insert({
      athlete_id: user.id,
      amount: available,
      stripe_payout_id: payout.id,
      status: "pending",
      arrival_date: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString().split("T")[0] : null,
    });

    return { ok: true, data: { payoutId: payout.id, amount: available } };
  } catch (err) {
    console.error("[balance] createPayout failed", err);
    return { ok: false, error: "Payout failed. Please try again." };
  }
}
