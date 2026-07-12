import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/actions/profile";
import {
  getReferralStats,
  getReferralHistory,
  getReferralFunnel,
  getReferralLeaderboard,
} from "@/lib/actions/referrals";
import { ReferralsPageClient } from "./client";

export const metadata = {
  title: "Referrals | AthleteOS",
  description: "Refer athletes to AthleteOS and earn free Pro plan days.",
};

export default async function ReferralsPage() {
  const profileResult = await getMyProfile();
  if (!profileResult.ok || !profileResult.data) {
    redirect("/auth/sign-in");
  }
  const profile = profileResult.data;

  const [stats, history, funnel, leaderboard] = await Promise.all([
    getReferralStats(),
    getReferralHistory(),
    getReferralFunnel(),
    getReferralLeaderboard(10),
  ]);

  return (
    <ReferralsPageClient
      profile={profile}
      initialStats={stats}
      initialHistory={history}
      initialFunnel={funnel}
      initialLeaderboard={leaderboard}
    />
  );
}
