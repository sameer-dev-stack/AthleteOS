import { stripe } from "@/lib/stripe";

const PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_ID_PRO ?? "",
  elite: process.env.STRIPE_PRICE_ID_ELITE ?? "",
} as const;

type CheckoutTier = "pro" | "elite";
type PlanTier = "free" | "pro" | "elite";

export async function createCheckoutSession({
  userId,
  email,
  tier,
}: {
  userId: string;
  email: string;
  tier: CheckoutTier;
}): Promise<{ url: string | null; error?: string }> {
  const priceId = PRICE_IDS[tier];
  if (!priceId) {
    return { url: null, error: "Invalid tier" };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: {
        athleteos_user_id: userId,
        tier,
      },
    },
    metadata: {
      athleteos_user_id: userId,
      tier,
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app"}/dashboard?upgraded=${tier}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app"}/dashboard?cancelled=true`,
  });

  return { url: session.url };
}

export async function createCustomerPortalSession({
  customerId,
}: {
  customerId: string;
}): Promise<{ url: string | null; error?: string }> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app"}/dashboard`,
  });

  return { url: session.url };
}

/**
 * Webhook recovery: when the webhook fails to update the DB, this function
 * searches Stripe for the user's active subscription and syncs it to the database.
 * Called from the billing page after checkout redirect.
 * @requires Caller must verify auth before invoking this function.
 */
export async function recoverSubscriptionFromStripe(userId: string, userEmail: string): Promise<{
  synced: boolean;
  tier?: PlanTier;
}> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if already synced
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, stripe_subscription_id")
      .eq("id", userId)
      .single();

    if (profile?.stripe_subscription_id) return { synced: false };

    // Search Stripe for customer by email
    const customers = await stripe.customers.list({ email: userEmail, limit: 5 });
    if (customers.data.length === 0) return { synced: false };

    // Check each customer for active subscriptions
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 5,
      });

      for (const sub of subs.data) {
        const priceId = sub.items.data[0]?.price?.id;
        let tier: PlanTier = "free";
        if (priceId === process.env.STRIPE_PRICE_ID_PRO) tier = "pro";
        else if (priceId === process.env.STRIPE_PRICE_ID_ELITE) tier = "elite";
        else continue;

        // Sync to database
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({
            plan: tier,
            stripe_subscription_id: sub.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
          .is("stripe_subscription_id", null);

        if (updateErr) {
          console.error("[billing] recoverSubscriptionFromStripe DB update failed:", updateErr);
          return { synced: false };
        }

        return { synced: true, tier };
      }
    }

    return { synced: false };
  } catch (err) {
    console.error("[billing] recoverSubscriptionFromStripe error:", err);
    return { synced: false };
  }
}

/**
 * Get subscription status for a user by their profile ID.
 * @requires Caller must verify auth before invoking this function.
 */
export async function getSubscriptionByUserId(userId: string): Promise<{
  status: string | null;
  tier: PlanTier;
  currentPeriodEnd: number | null;
  customerId: string | null;
  subscriptionId: string | null;
}> {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, stripe_subscription_id")
    .eq("id", userId)
    .single();

  if (!profile?.stripe_subscription_id) {
    return {
      status: null,
      tier: (profile?.plan as PlanTier) || "free",
      currentPeriodEnd: null,
      customerId: null,
      subscriptionId: null,
    };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    );

    const firstItem = subscription.items.data[0];
    const currentPeriodEnd = firstItem?.current_period_end ?? null;

    // Derive tier from live Stripe price ID — not from DB which may be stale
    let tier: PlanTier = (profile?.plan as PlanTier) || "free";
    if (subscription.status === "active" || subscription.status === "trialing") {
      const priceId = firstItem?.price?.id;
      if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
        tier = "pro";
      } else if (priceId === process.env.STRIPE_PRICE_ID_ELITE) {
        tier = "elite";
      }
    }

    return {
      status: subscription.status,
      tier,
      currentPeriodEnd,
      customerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      subscriptionId: subscription.id,
    };
  } catch {
    return {
      status: null,
      tier: (profile?.plan as PlanTier) || "free",
      currentPeriodEnd: null,
      customerId: null,
      subscriptionId: profile.stripe_subscription_id,
    };
  }
}
