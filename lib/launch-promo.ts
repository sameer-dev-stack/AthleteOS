import { createClient as createServiceClient } from "@supabase/supabase-js";

export const PROMO_TOTAL_SLOTS = 500;
export const PROMO_TRIAL_DAYS = 90;

export type LaunchPromoStats = {
  totalSlots: number;
  claimedCount: number;
  remainingSlots: number;
  isAvailable: boolean;
};

/**
 * Returns active statistics for the 500-user 3-Month Pro Trial launch promotion.
 *
 * The authoritative cap lives in the promo_slots counter row, which the Stripe
 * webhook claims atomically at redemption time. This function is a UI hint
 * only: it fails OPEN when the DB is unreachable so the checkout flow can
 * still run, because the webhook (not this read) enforces the hard limit.
 */
export async function getLaunchPromoStats(): Promise<LaunchPromoStats> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return {
        totalSlots: PROMO_TOTAL_SLOTS,
        claimedCount: 0,
        remainingSlots: PROMO_TOTAL_SLOTS,
        isAvailable: true,
      };
    }

    const admin = createServiceClient(supabaseUrl, serviceKey);

    // Prefer the atomic counter; fall back to the flag count for older rows.
    const { data: slotRow } = await admin
      .from("promo_slots")
      .select("claimed, capacity")
      .eq("id", 1)
      .single();

    const claimedCount =
      slotRow?.claimed ?? 0;
    const capacity = slotRow?.capacity ?? PROMO_TOTAL_SLOTS;

    if (slotRow) {
      const remainingSlots = Math.max(0, capacity - claimedCount);
      return {
        totalSlots: capacity,
        claimedCount,
        remainingSlots,
        isAvailable: remainingSlots > 0,
      };
    }

    // Counter row missing (migration not applied yet) — fall back to flags.
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("has_claimed_promo_trial", true);

    const flagCount = (!error && count !== null) ? count : 0;
    const remainingSlots = Math.max(0, PROMO_TOTAL_SLOTS - flagCount);

    return {
      totalSlots: PROMO_TOTAL_SLOTS,
      claimedCount: flagCount,
      remainingSlots,
      isAvailable: remainingSlots > 0,
    };
  } catch {
    return {
      totalSlots: PROMO_TOTAL_SLOTS,
      claimedCount: 0,
      remainingSlots: PROMO_TOTAL_SLOTS,
      isAvailable: true,
    };
  }
}

/**
 * Atomically claim one promo slot (row-locked via the claim_promo_slot RPC).
 * Returns the new claimed count, or null when the promotion is exhausted.
 * Called ONLY from the Stripe webhook at redemption time — this is the
 * authoritative enforcement of the 500-slot cap.
 */
export async function claimPromoSlot(): Promise<number | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) return null;

  const admin = createServiceClient(supabaseUrl, serviceKey);

  const { data, error } = await admin.rpc("claim_promo_slot");

  if (error) {
    console.error("[launch-promo] claimPromoSlot failed:", error.message);
    return null;
  }

  return typeof data === "number" ? data : null;
}
