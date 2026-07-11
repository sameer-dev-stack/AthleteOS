import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Return basic sitemap if env vars not available (CI builds)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
    ];
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .eq("profile_published", true)
    .not("username", "is", null);

  const athleteUrls = (profiles || []).map((profile) => ({
    url: `${BASE_URL}/${profile.username}`,
    lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/discover`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...athleteUrls,
  ];
}
