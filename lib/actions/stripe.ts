"use server";

import { z } from "zod";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

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

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Creates a one-time payment Checkout Session for a fan tip.
 * Money is collected into NIL CARD's own Stripe account (platform model).
 * The athlete sees the tip in their dashboard and requests a withdrawal,
 * which NIL CARD fulfills manually within 48 hours.
 */
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

  const supabase = getServiceClient();
  const { data: athlete } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .eq("id", athleteId)
    .eq("profile_published", true)
    .single();

  if (!athlete) {
    return { ok: false, error: "Athlete not found" };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Tip for ${athlete.full_name || athlete.username || "Athlete"}`,
              description: `Support ${athlete.full_name || "this athlete"} on NIL CARD`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.nilcard.app"}/${athlete.username}?tip=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.nilcard.app"}/${athlete.username}?tip=cancelled`,
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
    const message = err instanceof Error ? err.message : "Unknown error";
    const code = err instanceof Error && 'code' in err ? (err as { code?: string }).code : undefined;
    console.error("[stripe] createTipSession failed", err, { code });
    return { ok: false, error: `Failed to create tip session: ${message}${code ? ` (${code})` : ""}` };
  }
}
