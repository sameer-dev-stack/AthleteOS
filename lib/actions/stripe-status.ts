"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

type WebhookEvent = {
  id: string;
  action: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type StripeStatusResult = {
  ok: boolean;
  data?: {
    webhookConfigured: boolean;
    lastEvent: WebhookEvent | null;
    recentErrors: WebhookEvent[];
    recentSuccesses: number;
    totalEvents: number;
  };
  error?: string;
};

export async function getStripeStatus(): Promise<StripeStatusResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Not authenticated" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" && !isAdmin(user.email)) {
      return { ok: false, error: "Not authorized" };
    }

    const { data: events, error: eventsError } = await supabase
      .from("audit_log")
      .select("id, action, target_id, metadata, created_at")
      .eq("target_type", "stripe")
      .order("created_at", { ascending: false })
      .limit(50);

    if (eventsError) {
      console.error("[stripe-status] Failed to fetch events:", eventsError);
      return { ok: false, error: "Failed to fetch webhook events" };
    }

    const webhookEvents = (events ?? []) as WebhookEvent[];
    const lastEvent = webhookEvents[0] ?? null;
    const recentErrors = webhookEvents.filter(
      (e) => (e.metadata as Record<string, unknown>).status === "error"
    );
    const recentSuccesses = webhookEvents.filter(
      (e) => (e.metadata as Record<string, unknown>).status === "success"
    ).length;

    return {
      ok: true,
      data: {
        webhookConfigured: webhookEvents.length > 0 || !!process.env.STRIPE_WEBHOOK_SECRET,
        lastEvent,
        recentErrors,
        recentSuccesses,
        totalEvents: webhookEvents.length,
      },
    };
  } catch (err) {
    console.error("[stripe-status] getStripeStatus error:", err);
    return { ok: false, error: "Failed to load Stripe status" };
  }
}
