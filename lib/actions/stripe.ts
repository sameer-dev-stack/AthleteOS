"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import { PLATFORM_FEE_PERCENT } from "@/lib/constants";

const TipSchema = z.object({
  athleteId: z.string().uuid(),
  amount: z.number().min(500).max(100000),
  senderEmail: z.string().email().optional(),
  senderName: z.string().max(100).optional(),
});

export type TipResult = {
  ok: boolean;
  url?: string;
  error?: string;
};

export type PayoutBalance = {
  available: number;
  pending: number;
  connected: boolean;
  onboardingComplete: boolean;
};

export async function createTipSession(
  athleteId: string,
  amount: number,
  senderEmail?: string,
  senderName?: string
): Promise<TipResult> {
  const parsed = TipSchema.safeParse({ athleteId, amount, senderEmail, senderName });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: athlete } = await supabase
    .from("profiles")
    .select("id, full_name, username, stripe_account_id, stripe_onboarding_complete")
    .eq("id", athleteId)
    .eq("profile_published", true)
    .single();

  if (!athlete) {
    return { ok: false, error: "Athlete not found" };
  }

  if (athlete.stripe_account_id && !athlete.stripe_onboarding_complete) {
    return { ok: false, error: "This athlete is setting up their payout account. Tipping will be available soon." };
  }

  try {
    let accountId = athlete.stripe_account_id;

    if (!accountId) {
      // Check again in case concurrent request created it
      const { data: fresh } = await supabase
        .from("profiles")
        .select("stripe_account_id")
        .eq("id", athleteId)
        .single();

      if (fresh?.stripe_account_id) {
        accountId = fresh.stripe_account_id;
      } else {
        const account = await stripe.accounts.create({
          type: "express",
          email: athlete.username ? `${athlete.username}@athleteos.app` : undefined,
          metadata: { athleteos_id: athleteId },
          capabilities: { transfers: { requested: true } },
        });
        accountId = account.id;

        const { error: updateErr } = await supabase
          .from("profiles")
          .update({ stripe_account_id: accountId })
          .eq("id", athleteId)
          .is("stripe_account_id", null);

        // If update failed, another request won the race — fetch theirs
        if (updateErr) {
          const { data: race } = await supabase
            .from("profiles")
            .select("stripe_account_id")
            .eq("id", athleteId)
            .single();
          accountId = race?.stripe_account_id || accountId;
        }
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Tip for ${athlete.full_name || athlete.username || "Athlete"}`,
              description: `Support ${athlete.full_name || "this athlete"} on AthleteOS`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: Math.round(amount * (PLATFORM_FEE_PERCENT / 100)),
        transfer_data: { destination: accountId },
        metadata: {
          athleteos_athlete_id: athleteId,
          sender_email: senderEmail || "",
          sender_name: senderName || "",
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app"}/${athlete.username}?tip=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app"}/${athlete.username}?tip=cancelled`,
      metadata: {
        athleteos_athlete_id: athleteId,
        sender_email: senderEmail || "",
        sender_name: senderName || "",
      },
    });

    if (!session.url) {
      return { ok: false, error: "Failed to create checkout session" };
    }

    return { ok: true, url: session.url };
  } catch (err) {
    console.error("[stripe] createTipSession failed", err);
    return { ok: false, error: "Failed to create tip session. Please try again." };
  }
}

export async function createConnectOnboarding(): Promise<{
  ok: boolean;
  url?: string;
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

    const { data: profile } = await admin
      .from("profiles")
      .select("id, username, email, stripe_account_id, stripe_onboarding_complete")
      .eq("id", user.id)
      .single();

    if (!profile) return { ok: false, error: "Profile not found" };

    let accountId = profile.stripe_account_id;

    if (!accountId) {
      const { data: fresh } = await admin
        .from("profiles")
        .select("stripe_account_id")
        .eq("id", user.id)
        .single();

      if (fresh?.stripe_account_id) {
        accountId = fresh.stripe_account_id;
      } else {
        const account = await stripe.accounts.create({
          type: "express",
          email: profile.email || `${profile.username}@athleteos.app`,
          metadata: { athleteos_id: user.id },
          capabilities: { transfers: { requested: true } },
        });
        accountId = account.id;

        const { error: updateErr } = await admin
          .from("profiles")
          .update({ stripe_account_id: accountId })
          .eq("id", user.id)
          .is("stripe_account_id", null);

        if (updateErr) {
          const { data: race } = await admin
            .from("profiles")
            .select("stripe_account_id")
            .eq("id", user.id)
            .single();
          accountId = race?.stripe_account_id || accountId;
        }
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app"}/dashboard`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app"}/dashboard?payouts=connected`,
      type: "account_onboarding",
    });

    return { ok: true, url: accountLink.url };
  } catch (err) {
    console.error("[stripe] createConnectOnboarding failed", err);
    return { ok: false, error: "Failed to create onboarding link. Please try again." };
  }
}

export async function getPayoutBalance(): Promise<{
  ok: boolean;
  data?: PayoutBalance;
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

    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete, payout_method")
      .eq("id", user.id)
      .single();

    if (profile?.payout_method) {
      return {
        ok: true,
        data: { available: 0, pending: 0, connected: true, onboardingComplete: true },
      };
    }

    if (!profile?.stripe_account_id) {
      return {
        ok: true,
        data: { available: 0, pending: 0, connected: false, onboardingComplete: false },
      };
    }

    const balance = await stripe.balance.retrieve(
      {},
      { stripeAccount: profile.stripe_account_id }
    );

    const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
    const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0);

    return {
      ok: true,
      data: {
        available,
        pending,
        connected: true,
        onboardingComplete: profile.stripe_onboarding_complete,
      },
    };
  } catch (err) {
    console.error("[stripe] getPayoutBalance failed", err);
    return {
      ok: false,
      error: "Failed to fetch balance. Please try again.",
    };
  }
}
