import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/actions/profile";
import { DashboardOverview } from "@/components/dashboard/overview";
import { VerificationBanner } from "@/components/verification-banner";

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

  return (
    <>
      <VerificationBanner />
      <DashboardOverview profile={profile} />
    </>
  );
}
