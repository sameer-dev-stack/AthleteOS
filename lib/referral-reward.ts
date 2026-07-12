export type Plan = "free" | "pro" | "elite";

// Single decision point for "is this user Pro right now".
// Honors BOTH the paid plan column AND referral/stripe-granted extended_pro_until.
export function resolvePlan(
  plan: string | null | undefined,
  extendedProUntil: string | null | undefined
): Plan {
  if (plan === "pro" || plan === "elite") return plan;
  if (extendedProUntil && new Date(extendedProUntil).getTime() > Date.now()) return "pro";
  return "free";
}

// Determines which user IDs earn Pro on a completed referral.
// Two-sided: both referrer and referred. Guards block self-referral and duplicates.
export function usersToReward(
  referrerId: string,
  referredId: string,
  isSelf: boolean,
  alreadyReferred: boolean
): string[] {
  if (isSelf || alreadyReferred) return [];
  return [referrerId, referredId];
}
