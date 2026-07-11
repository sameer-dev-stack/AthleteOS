import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { getMyDeals } from "@/lib/actions/compliance";
import { ComplianceClient } from "./client";

export default async function CompliancePage() {
  const profileResult = await getMyProfile();

  if (!profileResult.ok || !profileResult.data) {
    redirect("/onboarding");
  }

  const profile = profileResult.data;
  const accentColor = profile.theme_accent || "#C6FF3D";

  const dealsResult = await getMyDeals();
  const deals = dealsResult.ok && dealsResult.data ? dealsResult.data : [];

  return (
    <ComplianceClient initialDeals={deals} accentColor={accentColor} />
  );
}
