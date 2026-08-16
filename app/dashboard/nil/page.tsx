import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/actions/profile";
import { getNilMetrics } from "@/lib/actions/nil-engine";
import { getSocialAccounts } from "@/lib/actions/social-accounts";
import { getAiQuota } from "@/lib/actions/ai-usage";
import { NilDashboardClient } from "./client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "NIL Value Engine | NIL CARD",
  description: "Monitor your NIL score, recommended rates, and evaluate sponsorship deal offers.",
};

export default async function NilDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?redirect=/dashboard/nil");
  }

  const profileRes = await getMyProfile();
  if (!profileRes.ok || !profileRes.data) {
    redirect("/auth/sign-in");
  }
  const profile = profileRes.data;

  const metricsRes = await getNilMetrics();
  const socialRes = await getSocialAccounts();
  const quota = await getAiQuota();

  const initialMetrics = metricsRes.ok ? metricsRes.data || null : null;
  const initialSocialAccounts = socialRes.ok ? socialRes.data || [] : [];

  return (
    <NilDashboardClient
      profile={profile}
      initialMetrics={initialMetrics}
      initialSocialAccounts={initialSocialAccounts}
      quota={quota}
    />
  );
}
