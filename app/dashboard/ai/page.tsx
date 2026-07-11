import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { getAiQuota } from "@/lib/actions/ai-usage";
import { getSavedAssetsCount } from "@/lib/actions/ai-vault";
import { AIToolkitClient } from "./client";

export default async function AIPage() {
  const profileResult = await getMyProfile();

  if (!profileResult.ok || !profileResult.data) {
    redirect("/onboarding");
  }

  const [quota, savedAssetsCount] = await Promise.all([
    getAiQuota(),
    getSavedAssetsCount(),
  ]);

  return (
    <AIToolkitClient
      profile={profileResult.data}
      quota={quota}
      savedAssetsCount={savedAssetsCount}
    />
  );
}
