import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import { SponsorshipMarketplace } from "@/components/dashboard/sponsorship-marketplace";

export const metadata = {
  title: "Marketplace | AthleteOS",
  description: "Browse sponsorship opportunities and connect with brands.",
};

export default async function MarketplacePage() {
  const profileResult = await getMyProfile();
  if (!profileResult.ok || !profileResult.data) {
    redirect("/auth/sign-in");
  }

  return <SponsorshipMarketplace profile={profileResult.data} />;
}
