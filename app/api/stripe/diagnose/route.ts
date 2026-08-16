import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = isAdmin(user.email);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check env vars (presence only, not values)
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const envCheck = {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID_PRO: !!process.env.STRIPE_PRICE_ID_PRO,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // Check user's profile
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("id, email, plan, stripe_subscription_id, stripe_account_id, stripe_onboarding_complete, updated_at")
    .eq("id", user.id)
    .single();

  // Check recent webhook events in audit_log
  const { data: recentWebhooks } = await serviceClient
    .from("audit_log")
    .select("action, metadata, created_at")
    .like("action", "webhook:%")
    .order("created_at", { ascending: false })
    .limit(10);

  // Check Stripe subscription if ID exists
  let stripeSubscription = null;
  if (profile?.stripe_subscription_id) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-06-24.dahlia",
      });
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      stripeSubscription = {
        id: sub.id,
        status: sub.status,
        priceId: sub.items.data[0]?.price?.id,
        currentPeriodEnd: sub.items.data[0]?.current_period_end,
        metadata: sub.metadata,
      };
    } catch (err) {
      stripeSubscription = { error: "Could not retrieve subscription" };
    }
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    envCheck,
    profile,
    recentWebhooks: recentWebhooks?.map((e) => ({
      action: e.action,
      status: (e.metadata as Record<string, unknown>)?.status,
      error: (e.metadata as Record<string, unknown>)?.error,
      created_at: e.created_at,
    })),
    stripeSubscription,
  });
}
