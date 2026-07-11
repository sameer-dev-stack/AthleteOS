import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { EmailCampaigns } from "@/components/dashboard/email-campaigns";

export default async function CampaignsPage() {
  const profileResult = await getMyProfile();

  if (!profileResult.ok || !profileResult.data) {
    redirect("/onboarding");
  }

  const profile = profileResult.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Email Campaigns</h1>
        <p className="mt-1.5 text-sm text-white/40">
          Create, schedule, and send email campaigns to your fan subscribers.
        </p>
      </div>

      <div className="max-w-5xl">
        <EmailCampaigns athleteId={profile.id} />
      </div>
    </div>
  );
}
