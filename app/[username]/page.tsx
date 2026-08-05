import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublicProfile } from "@/lib/actions/profile";
import { ProfileCard } from "@/components/profile-card";
import { ProfileCardSkeleton } from "@/components/profile-card-skeleton";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app";

function sanitizeJsonLd(input: string): string {
  return input.replace(/[<>]/g, "").replace(/&/g, "&amp;");
}

function cleanDisplayName(fullName: string | null, username: string | null): string {
  const raw = fullName || username || "";
  if (!raw) return "Athlete";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return raw.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return raw;
}

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const result = await getPublicProfile(username);

  if (!result.ok || !result.data) {
    return { title: "Profile not found" };
  }

  const p = result.data;
  const displayName = cleanDisplayName(p.full_name, p.username);
  const title = p.sport
    ? `${displayName} — ${p.sport} | AthleteOS`
    : `${displayName} — AthleteOS`;

  const description =
    p.bio && p.bio.trim().length > 10 && !p.bio.includes("@")
      ? p.bio.slice(0, 200)
      : `${displayName} (${p.sport || "Athlete"}${p.position ? ` · ${p.position}` : ""} at ${p.school || "School"}). Official AthleteOS card.`;

  const ogImageUrl = `${SITE_URL}/api/og/${username}`;
  const images = p.avatar_url
    ? [
        { url: p.avatar_url, alt: `${displayName} Avatar` },
        { url: ogImageUrl, width: 1200, height: 630, alt: `${displayName} — AthleteOS` },
      ]
    : [{ url: ogImageUrl, width: 1200, height: 630, alt: `${displayName} — AthleteOS` }];

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${username}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: "AthleteOS",
      url: `${SITE_URL}/${username}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const result = await getPublicProfile(username);

  if (!result.ok || !result.data) {
    notFound();
  }

  const p = result.data;
  const displayName = cleanDisplayName(p.full_name, p.username);

  // Fetch public stats (views, social followers, nil score)
  let totalViews = 0;
  let totalFollowers = 0;
  let nilScore: number | null = null;
  try {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const [viewsResult, socialResult, nilResult] = await Promise.all([
      serviceClient
        .from("page_views")
        .select("id", { count: "exact", head: true })
        .eq("athlete_id", p.id),
      serviceClient
        .from("social_accounts")
        .select("followers")
        .eq("athlete_id", p.id),
      serviceClient
        .from("nil_value_metrics")
        .select("nil_score")
        .eq("profile_id", p.id)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    totalViews = viewsResult.count ?? 0;
    totalFollowers = (socialResult.data ?? []).reduce((sum, a) => sum + (a.followers || 0), 0);
    nilScore = nilResult.data?.nil_score ?? null;
  } catch {
    // Non-critical — card still renders
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: sanitizeJsonLd(displayName),
    url: `${SITE_URL}/${username}`,
    image: p.avatar_url || undefined,
    jobTitle: [p.position, p.sport].filter(Boolean).join(" "),
    affiliation: p.school ? { "@type": "Organization", name: sanitizeJsonLd(p.school) } : undefined,
    sameAs: [
      p.social?.twitter ? `https://twitter.com/${p.social.twitter}` : null,
      p.social?.instagram ? `https://instagram.com/${p.social.instagram}` : null,
      p.social?.tiktok ? `https://tiktok.com/@${p.social.tiktok}` : null,
      p.social?.youtube ? `https://youtube.com/@${p.social.youtube}` : null,
    ].filter(Boolean),
  };

  const safeJsonLd = JSON.stringify(jsonLd)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <Suspense fallback={<ProfileCardSkeleton />}>
        <ProfileCard profile={p} totalViews={totalViews} totalFollowers={totalFollowers} nilScore={nilScore} />
      </Suspense>
    </>
  );
}
