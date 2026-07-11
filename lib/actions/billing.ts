"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createCheckoutSession,
  createCustomerPortalSession,
  getSubscriptionByUserId,
} from "@/lib/stripe-billing";

export type BillingResult = {
  ok: boolean;
  url?: string;
  error?: string;
};

export type SubscriptionStatus = {
  plan: string;
  status: string | null;
  currentPeriodEnd: number | null;
  aiUsed: number;
  aiLimit: number;
  aiRemaining: number;
  proExpiresAt: string | null;
  paymentMethod: {
    brand: string | null;
    last4: string | null;
    expMonth: number | null;
    expYear: number | null;
  } | null;
  invoices: {
    id: string;
    created: number;
    status: string;
    amount: number;
    currency: string;
    invoiceUrl?: string;
  }[];
};

const CheckoutSchema = z.object({
  tier: z.enum(["pro", "elite"]),
});

export async function createCheckoutSessionAction(
  formData: { tier: string }
): Promise<BillingResult> {
  try {
    const parsed = CheckoutSchema.safeParse(formData);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { url, error } = await createCheckoutSession({
      userId: user.id,
      email: user.email || "",
      tier: parsed.data.tier,
    });

    if (error) return { ok: false, error };
    if (!url) return { ok: false, error: "Failed to create checkout session" };

    return { ok: true, url };
  } catch (err) {
    console.error("[billing] createCheckoutSessionAction error:", err);
    return { ok: false, error: "Failed to create checkout session" };
  }
}

export async function createPortalSessionAction(): Promise<BillingResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const sub = await getSubscriptionByUserId(user.id);
    if (!sub.customerId) {
      return { ok: false, error: "No active subscription to manage." };
    }

    const { url, error } = await createCustomerPortalSession({
      customerId: sub.customerId,
    });

    if (error) return { ok: false, error };
    if (!url) return { ok: false, error: "Failed to create portal session" };

    return { ok: true, url };
  } catch (err) {
    console.error("[billing] createPortalSessionAction error:", err);
    return { ok: false, error: "Failed to create portal session" };
  }
}

export async function cancelSubscriptionAction(): Promise<BillingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const sub = await getSubscriptionByUserId(user.id);
  if (!sub.subscriptionId) {
    return { ok: false, error: "No active subscription to cancel." };
  }

  try {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();

    await stripe.subscriptions.update(sub.subscriptionId, {
      cancel_at_period_end: true,
    });

    revalidatePath("/dashboard/billing");
    return { ok: true };
  } catch (err) {
    console.error("[billing] cancelSubscription failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to cancel subscription" };
  }
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      plan: "free",
      status: null,
      currentPeriodEnd: null,
      aiUsed: 0,
      aiLimit: 5,
      aiRemaining: 5,
      proExpiresAt: null,
      paymentMethod: null,
      invoices: [],
    };
  }

  const { checkProExpiry } = await import("@/lib/actions/first-500-pro");
  const { expired } = await checkProExpiry();

  let sub = await getSubscriptionByUserId(user.id);

  // If DB shows no subscription but user just returned from checkout, recover from Stripe
  if (!sub.subscriptionId && user.email) {
    const { recoverSubscriptionFromStripe } = await import("@/lib/stripe-billing");
    const { synced } = await recoverSubscriptionFromStripe(user.id, user.email);
    if (synced) {
      sub = await getSubscriptionByUserId(user.id);
    }
  }

  const { getAiQuota } = await import("@/lib/actions/ai-usage");
  const quota = await getAiQuota();

  const { data: profile } = await supabase
    .from("profiles")
    .select("pro_expires_at")
    .eq("id", user.id)
    .single();

  let paymentMethod: SubscriptionStatus["paymentMethod"] = null;
  let invoices: SubscriptionStatus["invoices"] = [];

  if (sub.customerId) {
    try {
      const { getStripe } = await import("@/lib/stripe");
      const stripeClient = getStripe();

      const pm = await stripeClient.paymentMethods.list({
        customer: sub.customerId,
        type: "card",
        limit: 1,
      });
      if (pm.data.length > 0) {
        const card = pm.data[0].card;
        paymentMethod = {
          brand: card?.brand ?? null,
          last4: card?.last4 ?? null,
          expMonth: card?.exp_month ?? null,
          expYear: card?.exp_year ?? null,
        };
      }

      const invoiceList = await stripeClient.invoices.list({
        customer: sub.customerId,
        limit: 12,
      });
      invoices = invoiceList.data.map((inv) => ({
        id: inv.id,
        amount: inv.amount_paid,
        currency: inv.currency,
        status: inv.status ?? "unknown",
        created: inv.created,
        invoiceUrl: inv.hosted_invoice_url ?? undefined,
      }));
    } catch {
      // Non-critical
    }
  }

  return {
    plan: expired ? "free" : sub.tier,
    status: expired ? null : sub.status,
    currentPeriodEnd: expired ? null : sub.currentPeriodEnd,
    aiUsed: quota.used,
    aiLimit: quota.limit,
    aiRemaining: quota.remaining,
    proExpiresAt: profile?.pro_expires_at ?? null,
    paymentMethod,
    invoices,
  };
}
