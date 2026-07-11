import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { getSocialAccounts } from "@/lib/actions/social-accounts";
import { ScheduleClient } from "./client";

export default async function SchedulePage() {
  const profileResult = await getMyProfile();

  if (!profileResult.ok || !profileResult.data) {
    redirect("/onboarding");
  }

  const accountsResult = await getSocialAccounts();
  const socialAccounts = accountsResult.ok && accountsResult.data
    ? accountsResult.data.map((a) => ({ platform: a.platform, handle: a.handle }))
    : [];

  return <ScheduleClient socialAccounts={socialAccounts} />;
}
