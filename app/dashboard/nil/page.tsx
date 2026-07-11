import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { getNilMetrics } from "@/lib/actions/nil-engine";
import { getSocialAccounts } from "@/lib/actions/social-accounts";
import { getAiQuota } from "@/lib/actions/ai-usage";
import { NilDashboardClient } from "./client";

export const metadata = {
  title: "NIL Value Engine | AthleteOS",
  description: "Monitor your NIL score, recommended rates, and evaluate sponsorship deal offers.",
};

export default async function NilDashboardPage() {
  const profileResult = await getMyProfile();
  if (!profileResult.ok || !profileResult.data) {
    redirect("/auth/sign-in");
  }
  const profile = profileResult.data;

  // Load latest metrics and social connections
  const metricsResult = await getNilMetrics();
  const socialResult = await getSocialAccounts();
  const quota = await getAiQuota();

  const metrics = metricsResult.data || null;
  const socialAccounts = socialResult.ok ? socialResult.data || [] : [];

  return (
    <NilDashboardClient
      profile={profile}
      initialMetrics={metrics}
      initialSocialAccounts={socialAccounts}
      quota={quota}
    />
  );
}
