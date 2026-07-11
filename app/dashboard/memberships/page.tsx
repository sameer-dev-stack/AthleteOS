import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { MembershipsClient } from "./client";

export default async function MembershipsPage() {
  const profileResult = await getMyProfile();

  if (!profileResult.ok || !profileResult.data) {
    redirect("/onboarding");
  }

  return <MembershipsClient profile={profileResult.data} />;
}
