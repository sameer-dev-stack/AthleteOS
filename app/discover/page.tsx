import type { Metadata } from "next";
import { searchPublicAthletes, getDiscoverySports } from "@/lib/actions/discovery";
import { DiscoverClient } from "./client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover Athletes — AthleteOS",
  description:
    "Browse and discover student-athletes for brand partnerships, sponsorships, and NIL deals. Filter by sport, school, position, and audience size.",
  openGraph: {
    title: "Discover Athletes — AthleteOS",
    description:
      "Browse and discover student-athletes for brand partnerships, sponsorships, and NIL deals.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover Athletes — AthleteOS",
    description:
      "Browse and discover student-athletes for brand partnerships, sponsorships, and NIL deals.",
  },
};

export default async function DiscoverPage() {
  const [athletesResult, sportsResult] = await Promise.all([
    searchPublicAthletes({ page: 1, pageSize: 24 }),
    getDiscoverySports(),
  ]);

  return (
    <DiscoverClient
      initialAthletes={athletesResult.ok ? athletesResult.data ?? [] : []}
      initialTotal={athletesResult.total ?? 0}
      sports={sportsResult.ok ? sportsResult.data ?? [] : []}
    />
  );
}
