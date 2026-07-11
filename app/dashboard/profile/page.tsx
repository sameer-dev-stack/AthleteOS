import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { ProfileEditorClient } from "./client";

export default async function ProfilePage() {
  const profileResult = await getMyProfile();

  if (!profileResult.ok || !profileResult.data) {
    redirect("/onboarding");
  }

  return <ProfileEditorClient profile={profileResult.data} />;
}
