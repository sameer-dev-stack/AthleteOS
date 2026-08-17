import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const _rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nilcard.app";
const BASE_URL = _rawBaseUrl.startsWith("http://") || _rawBaseUrl.startsWith("https://") ? _rawBaseUrl : `https://${_rawBaseUrl}`;

const STATIC_PAGES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/discover", priority: 0.9, changeFrequency: "daily" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/changelog", priority: 0.5, changeFrequency: "weekly" },
  { path: "/docs/help", priority: 0.6, changeFrequency: "monthly" },
  { path: "/docs/nil-guide", priority: 0.6, changeFrequency: "monthly" },
  { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/brands", priority: 0.7, changeFrequency: "monthly" },
  { path: "/brands/discover", priority: 0.7, changeFrequency: "weekly" },
];

const JUNK_USERNAME_RE = /^[a-z]+\d{2,}[a-z0-9]+(com|net|org|app|io|co)$/i;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Return basic sitemap if env vars not available (CI builds)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return STATIC_PAGES.map(({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }));
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

  const athleteUrls = (profiles || [])
    .filter((profile) => {
      const username = profile.username as string;
      if (!username || username.length > 30) return false;
      if (JUNK_USERNAME_RE.test(username)) return false;
      return true;
    })
    .map((profile) => ({
      url: `${BASE_URL}/${profile.username}`,
      lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [
    ...STATIC_PAGES.map(({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    })),
    ...athleteUrls,
  ];
}
