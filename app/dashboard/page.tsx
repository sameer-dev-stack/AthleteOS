import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/actions/profile";
import { DashboardOverview } from "@/components/dashboard/overview";
import { VerificationBanner } from "@/components/verification-banner";
import { getLaunchPromoStats } from "@/lib/launch-promo";
import { getSubscriptionByUserId } from "@/lib/stripe-billing";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const profileResult = await getMyProfile();

  if (!profileResult.ok || !profileResult.data) {
    throw new Error("Failed to load profile. Please try again.");
  }

  const profile = profileResult.data;

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const promoStats = await getLaunchPromoStats();
  const claimedPromoTrial = profile.has_claimed_promo_trial === true;

  let trialEndsAt: string | null = null;
  if (claimedPromoTrial) {
    const sub = await getSubscriptionByUserId(user.id);
    trialEndsAt = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd * 1000).toISOString() : null;
  }

  return (
    <>
      <VerificationBanner />
      <DashboardOverview
        profile={profile}
        promo={{
          available: promoStats.isAvailable,
          remainingSlots: promoStats.remainingSlots,
          totalSlots: promoStats.totalSlots,
          claimed: claimedPromoTrial,
          trialEndsAt,
        }}
      />
    </>
  );
}
