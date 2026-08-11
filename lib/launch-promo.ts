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
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("has_claimed_promo_trial", true);

    const claimedCount = (!error && count !== null) ? count : 0;
    const remainingSlots = Math.max(0, PROMO_TOTAL_SLOTS - claimedCount);
    const isAvailable = remainingSlots > 0;

    return {
      totalSlots: PROMO_TOTAL_SLOTS,
      claimedCount,
      remainingSlots,
      isAvailable,
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
