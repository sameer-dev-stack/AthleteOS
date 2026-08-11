import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/actions/profile";
import { DashboardOverview } from "@/components/dashboard/overview";
import { VerificationBanner } from "@/components/verification-banner";
import { getLaunchPromoStats } from "@/lib/launch-promo";
import { LaunchOfferBanner } from "@/components/promo/launch-offer-banner";

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
  const isPro = profile.plan === "pro" || profile.plan === "team";

  return (
    <>
      <VerificationBanner />
      {!isPro && promoStats.isAvailable && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <LaunchOfferBanner
            remainingSlots={promoStats.remainingSlots}
            totalSlots={promoStats.totalSlots}
            isAuthenticated={true}
            hasClaimed={profile.has_claimed_promo_trial}
          />
        </div>
      )}
      <DashboardOverview profile={profile} />
    </>
  );
}
