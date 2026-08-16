import { DISPOSABLE_EMAIL_DOMAINS, REFERRAL_MILESTONES, MAX_REFERRAL_PRO_DAYS } from "./constants";
import type { Profile } from "./actions/profile";

export type Plan = "free" | "pro";

// Single decision point for "is this user Pro right now".
// Honors BOTH the paid plan column AND referral/stripe-granted extended_pro_until.
// Also checks pro_expires_at for time-limited Pro grants (e.g. first-500 benefit).
// If proExpiresAt is set AND no stripeSubscriptionId, it's a promo — expires when proExpiresAt passes.
export function resolvePlan(
  plan: string | null | undefined,
  extendedProUntil: string | null | undefined,
  proExpiresAt?: string | null | undefined,
  stripeSubscriptionId?: string | null | undefined
): Plan {
  if (plan === "pro") {
    // Paid subscriber — always Pro until they cancel
    if (stripeSubscriptionId) return "pro";
    // Promo grant — check if it expired
    if (proExpiresAt && new Date(proExpiresAt).getTime() < Date.now()) return "free";
    // Promo grant still active, or legacy plan with no expiry info
    return "pro";
  }
  if (extendedProUntil && new Date(extendedProUntil).getTime() > Date.now()) return "pro";
  return "free";
}

// Anti-Cheat: Checks if an email uses a known disposable/temp domain.
export function isDisposableEmail(email: string | null | undefined): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

// Anti-Cheat: Requires referred athlete to have uploaded photo, bio, at least 1 stat, and published card.
export function isProfileQualifiedForReferral(profile: Partial<Profile> | null | undefined): boolean {
  if (!profile) return false;
  if (!profile.profile_published) return false;
  if (!profile.avatar_url?.trim()) return false;
  if (!profile.bio || profile.bio.trim().length < 15) return false;
  const validStats = (profile.stats ?? []).filter(s => s.label?.trim() && s.value?.trim());
  if (validStats.length < 1) return false;
  return true;
}

export type MilestoneStatus = {
  completedCount: number;
  nextMilestone: { count: number; months: number; days: number; label: string; badge: boolean } | null;
  currentMilestone: { count: number; months: number; days: number; label: string; badge: boolean } | null;
  progressPercent: number;
  totalDaysEarned: number;
  isGoldBadgeUnlocked: boolean;
};

// Calculates milestone progress based on completed, verified referrals (5, 15, 25).
export function getReferralMilestoneStatus(completedCount: number): MilestoneStatus {
  let current: (typeof REFERRAL_MILESTONES)[number] | null = null;
  let next: (typeof REFERRAL_MILESTONES)[number] | null = REFERRAL_MILESTONES[0];

  for (let i = 0; i < REFERRAL_MILESTONES.length; i++) {
    if (completedCount >= REFERRAL_MILESTONES[i].count) {
      current = REFERRAL_MILESTONES[i];
      next = REFERRAL_MILESTONES[i + 1] || null;
    }
  }

  let totalDaysEarned = 0;
  if (completedCount >= 25) {
    totalDaysEarned = 180;
  } else if (completedCount >= 15) {
    totalDaysEarned = 90;
  } else if (completedCount >= 5) {
    totalDaysEarned = 30;
  }

  // Cap at 365 days max
  totalDaysEarned = Math.min(totalDaysEarned, MAX_REFERRAL_PRO_DAYS);

  let progressPercent = 0;
  if (!next) {
    progressPercent = 100;
  } else {
    const prevCount = current ? current.count : 0;
    const needed = next.count - prevCount;
    const currentProgress = completedCount - prevCount;
    progressPercent = Math.min(Math.max(Math.round((currentProgress / needed) * 100), 0), 100);
  }

  const isGoldBadgeUnlocked = completedCount >= 15;

  return {
    completedCount,
    nextMilestone: next,
    currentMilestone: current,
    progressPercent,
    totalDaysEarned,
    isGoldBadgeUnlocked,
  };
}
