import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { PLATFORM_FEE_PERCENT_FREE, PLATFORM_FEE_PERCENT_PRO } from "@/lib/constants";
import { resolvePlan } from "@/lib/referral-reward";

const ALLOWED_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
]);

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, {
    apiVersion: "2026-06-24.dahlia",
  });
}

function getSupabaseServiceRole() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function logWebhookEvent(
  supabase: ReturnType<typeof getSupabaseServiceRole>,
  event: Stripe.Event,
  status: "success" | "error",
  error?: string
) {
  await supabase.from("audit_log").insert({
    admin_id: null,
    action: `webhook:${event.type}`,
    target_type: "stripe",
    target_id: event.id,
    metadata: {
      event_type: event.type,
      status,
      error: error || null,
      livemode: event.livemode,
    },
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set in environment variables");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Read the raw body exactly as Stripe sent it.
  // Do NOT use arrayBuffer → Buffer → toString round-trip; it can alter
  // bytes in the Vercel Edge runtime and break HMAC signature matching.
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] Signature verification FAILED:", errMsg);
    console.error("[webhook] Debug info:", {
      secretSet: true,
      signaturePresent: !!signature,
      bodyLength: body.length,
      bodyType: typeof body,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!ALLOWED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const supabase = getSupabaseServiceRole();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.athleteos_user_id;
        const tier = session.metadata?.tier;
        const athleteId = session.metadata?.athleteos_athlete_id;
        const subscriptionId = session.subscription as string | null;

        console.log("[webhook] checkout.session.completed", {
          userId,
          tier,
          subscriptionId,
          athleteId,
          hasMetadata: !!session.metadata,
          metadataKeys: session.metadata ? Object.keys(session.metadata) : [],
        });

        if (userId && tier) {
          const isPromoTrial = session.metadata?.promo_trial === "launch_500";

          // Authoritative 500-slot cap: claim atomically BEFORE granting the
          // trial. If the promotion is exhausted the user still gets a normal
          // (paying) pro plan — no trial flag, no oversell.
          let slotClaimed = !isPromoTrial;
          if (isPromoTrial) {
            const { claimPromoSlot } = await import("@/lib/launch-promo");
            const claimed = await claimPromoSlot();
            slotClaimed = claimed !== null;
            if (!slotClaimed) {
              console.warn("[webhook] promo slot exhausted — granting paid plan without trial:", { userId });
            }
          }

          const updatePayload: Record<string, unknown> = {
            plan: tier,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          };

          if (isPromoTrial && slotClaimed) {
            updatePayload.has_claimed_promo_trial = true;
          }

          const { error: updateError } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("id", userId);

          if (updateError) {
            console.error("[webhook] checkout.session.completed plan update FAILED:", updateError);
            throw new Error(`Failed to update plan for user ${userId}: ${updateError.message}`);
          }

          console.log("[webhook] checkout.session.completed plan updated:", { userId, tier, subscriptionId, isPromoTrial });
          revalidatePath("/dashboard");
          revalidatePath("/dashboard/billing");

          // Fire-and-forget: send Pro upgrade confirmation email
          try {
            const { sendProUpgradeEmail } = await import("@/lib/actions/emails");
            const { data: upgradedProfile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", userId)
              .single();
            if (upgradedProfile?.email) {
              const interval = session.metadata?.interval || "monthly";
              const intervalLabel =
                interval === "annual" ? "billed annually" :
                interval === "semi_annual" ? "billed every 6 months" :
                "billed monthly";
              sendProUpgradeEmail(upgradedProfile.email, upgradedProfile.full_name, intervalLabel).catch(() => {});
            }
          } catch { /* non-blocking */ }
        } else if (athleteId && session.amount_total) {
          // Platform-collected tip: the full amount lands in AthleteOS's own
          // Stripe account. Compute the platform fee & athlete net ourselves.
          const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
          if (!paymentIntentId) break;
          const amount = session.amount_total ?? 0;

          // Check receiving athlete's plan to determine platform fee (20% for Free, 0% for Pro)
          const { data: athleteProfile } = await supabase
            .from("profiles")
            .select("plan, extended_pro_until, pro_expires_at")
            .eq("id", athleteId)
            .single();

          const isPro = resolvePlan(athleteProfile?.plan, athleteProfile?.extended_pro_until, athleteProfile?.pro_expires_at) === "pro";
          const feePercent = isPro ? PLATFORM_FEE_PERCENT_PRO : PLATFORM_FEE_PERCENT_FREE;
          const platformFee = Math.round(amount * (feePercent / 100));
          const netAmount = amount - platformFee;

          const { data: existingTip } = await supabase
            .from("tips")
            .select("id")
            .eq("stripe_payment_intent_id", paymentIntentId)
            .single();

          if (!existingTip) {
            const { error: insertErr } = await supabase.from("tips").insert({
              athlete_id: athleteId,
              amount,
              platform_fee: platformFee,
              net_amount: netAmount,
              sender_name: session.metadata?.sender_name || null,
              sender_email: session.metadata?.sender_email || null,
              stripe_session_id: session.id,
              stripe_payment_intent_id: paymentIntentId,
              status: "succeeded",
            });

            if (insertErr) {
              if (insertErr.code === "23505") {
                console.log("[webhook] tip already recorded (race):", session.payment_intent);
              } else {
                console.error("[webhook] tip insert failed:", insertErr);
              }
            } else {
              try {
                const { sendTipReceivedEmail } = await import("@/lib/actions/emails");
                const { data: athlete } = await supabase
                  .from("profiles")
                  .select("email, full_name, email_preferences")
                  .eq("id", athleteId)
                  .single();
                if (athlete?.email) {
                  const prefs = athlete.email_preferences as Record<string, boolean> | null;
                  if (prefs?.tips !== false && prefs?.earnings !== false) {
                    const senderName = session.metadata?.sender_name || "Someone";
                    const netDollars = (netAmount / 100).toFixed(2);
                    sendTipReceivedEmail(athlete.email, athlete.full_name || "there", senderName, netDollars).catch(() => {});
                  }
                }
              } catch { /* non-blocking */ }

              try {
                const { checkMilestones } = await import("@/lib/actions/milestones");
                checkMilestones(athleteId);
              } catch { /* non-blocking */ }
            }
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.athleteos_user_id;
        const priceId = subscription.items.data[0]?.price.id;

        console.log(`[webhook] ${event.type}`, {
          userId,
          subscriptionId: subscription.id,
          status: subscription.status,
          priceId,
          priceIdPro: process.env.STRIPE_PRICE_ID_PRO,
          priceIdElite: process.env.STRIPE_PRICE_ID_ELITE,
          priceMatch: priceId === process.env.STRIPE_PRICE_ID_PRO ? "pro" : priceId === process.env.STRIPE_PRICE_ID_ELITE ? "elite" : "none",
        });

        if (userId) {
          const newStatus = subscription.status;
          let newPlan = "free";

          if (newStatus === "active" || newStatus === "trialing") {
            if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
              newPlan = "pro";
            } else if (priceId === process.env.STRIPE_PRICE_ID_ELITE) {
              newPlan = "elite";
            }
          }

          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              plan: newPlan,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (updateError) {
            console.error(`[webhook] ${event.type} plan update FAILED:`, updateError);
            throw new Error(`Failed to update subscription for user ${userId}: ${updateError.message}`);
          }

          console.log(`[webhook] ${event.type} plan updated:`, { userId, newPlan, subscriptionId: subscription.id });
          revalidatePath("/dashboard");
          revalidatePath("/dashboard/billing");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.athleteos_user_id;

        if (userId) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              plan: "free",
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (updateError) {
            console.error("[webhook] subscription.deleted plan downgrade FAILED:", updateError);
            throw new Error(`Failed to downgrade user ${userId}: ${updateError.message}`);
          }

          console.log("[webhook] subscription.deleted plan downgraded:", { userId });
          revalidatePath("/dashboard");
          revalidatePath("/dashboard/billing");
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string;
        };
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (profile) {
            // Don't immediately downgrade — Stripe retries failed invoices.
            // Just send notification so user can update payment method.
            console.log("[webhook] invoice.payment_failed — notification sent, no immediate downgrade:", { userId: profile.id });
            revalidatePath("/dashboard/billing");

            try {
              const { sendPaymentFailedEmail } = await import("@/lib/actions/emails");
              sendPaymentFailedEmail(profile.email, profile.full_name).catch(() => {});
            } catch (emailErr) {
              console.error("[webhook] payment failed email error:", emailErr);
            }
          }
        }
        break;
      }

      }

    await logWebhookEvent(supabase, event, "success");
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook handler error for ${event.type}:`, err);
    await logWebhookEvent(supabase, event, "error", errorMsg);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
