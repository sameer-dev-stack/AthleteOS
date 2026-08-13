"use server";

import { z } from "zod";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { resolvePlan } from "@/lib/referral-reward";


function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sanitizeSearch(input: string): string {
  return input
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[%_]/g, "\\$&")
    .trim()
    .slice(0, 100);
}

export type DiscoveryAthlete = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  sport: string | null;
  school: string | null;
  position: string | null;
  bio: string | null;
  is_verified: boolean;
  plan: string;
  total_followers: number;
};

const SearchSchema = z.object({
  query: z.string().max(100).optional(),
  sport: z.string().max(100).optional(),
  school: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  minFollowers: z.number().min(0).max(1_000_000_000).optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(50).default(24),
});

export type DiscoveryFilters = z.infer<typeof SearchSchema>;

export async function searchPublicAthletes(
  filters: DiscoveryFilters
): Promise<{ ok: boolean; data?: DiscoveryAthlete[]; proAthletes?: DiscoveryAthlete[]; regularAthletes?: DiscoveryAthlete[]; total?: number; error?: string }> {
  const parsed = SearchSchema.safeParse(filters);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { query, sport, school, position, minFollowers, page, pageSize } = parsed.data;

  const supabase = getServiceClient();

  // Fetch published, onboarded profiles
  let dbQuery = supabase
    .from("profiles")
    .select(
      "id, full_name, username, avatar_url, sport, school, position, bio, is_verified, plan, extended_pro_until, pro_expires_at",
      { count: "exact" }
    )
    .eq("profile_published", true)
    .eq("onboarding_completed", true);

  if (query) {
    const q = sanitizeSearch(query);
    dbQuery = dbQuery.or(
      `full_name.ilike.%${q}%,username.ilike.%${q}%,sport.ilike.%${q}%,school.ilike.%${q}%`
    );
  }
  if (sport) {
    dbQuery = dbQuery.ilike("sport", `%${sanitizeSearch(sport)}%`);
  }
  if (school) {
    dbQuery = dbQuery.ilike("school", `%${sanitizeSearch(school)}%`);
  }
  if (position) {
    dbQuery = dbQuery.ilike("position", `%${sanitizeSearch(position)}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: profiles, error, count } = await dbQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return { ok: false, error: error.message };
  if (!profiles || profiles.length === 0) return { ok: true, data: [], proAthletes: [], regularAthletes: [], total: count ?? 0 };

  // Fetch aggregated follower counts from social_accounts
  const profileIds = profiles.map((p) => p.id);
  const { data: socialRows } = await supabase
    .from("social_accounts")
    .select("profile_id, followers")
    .in("profile_id", profileIds);

  const followerMap = new Map<string, number>();
  if (socialRows) {
    for (const row of socialRows) {
      followerMap.set(
        row.profile_id,
        (followerMap.get(row.profile_id) ?? 0) + (row.followers ?? 0)
      );
    }
  }

  // Build result with follower totals
  let athletes: DiscoveryAthlete[] = profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    username: p.username,
    avatar_url: p.avatar_url,
    sport: p.sport,
    school: p.school,
    position: p.position,
    bio: p.bio,
    is_verified: p.is_verified,
    plan: resolvePlan(p.plan, p.extended_pro_until, p.pro_expires_at),
    total_followers: followerMap.get(p.id) ?? 0,
  }));

  // Apply minFollowers filter (post-query since it depends on joined data)
  if (minFollowers && minFollowers > 0) {
    athletes = athletes.filter((a) => a.total_followers >= minFollowers);
  }

  // Priority Discover Ranking: Pro users & Gold Verified athletes are boosted to the top
  // Tiebreakers: follower count desc, then alphabetical by name
  athletes.sort((a, b) => {
    const aWeight = (a.plan === "pro" ? 2 : 0) + (a.is_verified ? 1 : 0);
    const bWeight = (b.plan === "pro" ? 2 : 0) + (b.is_verified ? 1 : 0);
    if (bWeight !== aWeight) return bWeight - aWeight;
    if (b.total_followers !== a.total_followers) return b.total_followers - a.total_followers;
    return (a.full_name || a.username || "").localeCompare(b.full_name || b.username || "");
  });

  const proAthletes = athletes.filter((a) => a.plan === "pro");
  const regularAthletes = athletes.filter((a) => a.plan !== "pro");

  return { ok: true, data: athletes, proAthletes, regularAthletes, total: athletes.length };
}

export async function getDiscoverySports(): Promise<{ ok: boolean; data?: string[]; error?: string }> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("sport")
    .eq("profile_published", true)
    .eq("onboarding_completed", true)
    .not("sport", "is", null)
    .not("sport", "eq", "");

  if (error) return { ok: false, error: error.message };

  const sports = [...new Set(data.map((r) => r.sport).filter(Boolean))].sort();
  return { ok: true, data: sports };
}
