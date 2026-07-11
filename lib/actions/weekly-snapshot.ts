"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type WeeklySnapshot = {
  id: string;
  profile_id: string;
  week_start: string;
  week_end: string;
  card_views: number;
  link_clicks: number;
  tips_amount: number;
  tips_count: number;
  followers_total: number;
  nil_score: number;
  profile_score: number;
  created_at: string;
};

function getWeekBounds(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

/**
 * Capture a weekly performance snapshot for a single athlete.
 * Idempotent — won't duplicate if a snapshot for this week already exists.
 */
export async function captureWeeklySnapshot(
  profileId: string
): Promise<{ ok: boolean; data?: WeeklySnapshot; error?: string }> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };
    if (user.id !== profileId) return { ok: false, error: "Unauthorized" };

    const admin = getAdmin();
    const { start, end } = getWeekBounds(new Date());

    // Check if snapshot already exists for this week
    const { data: existing } = await admin
      .from("weekly_snapshots")
      .select("id")
      .eq("profile_id", profileId)
      .eq("week_start", start)
      .limit(1);

    if (existing && existing.length > 0) {
      return { ok: true }; // Already captured this week
    }

    // Query this week's data
    const weekStart = `${start}T00:00:00.000Z`;
    const weekEnd = `${end}T23:59:59.999Z`;

    const [viewsRes, clicksRes, tipsRes, metricsRes, socialRes] = await Promise.all([
      admin
        .from("page_views")
        .select("id", { count: "exact", head: true })
        .eq("athlete_id", profileId)
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd),
      admin
        .from("link_clicks")
        .select("id", { count: "exact", head: true })
        .eq("athlete_id", profileId)
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd),
      admin
        .from("tips")
        .select("amount")
        .eq("athlete_id", profileId)
        .eq("status", "succeeded")
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd),
      admin
        .from("nil_value_metrics")
        .select("nil_score")
        .eq("profile_id", profileId)
        .order("computed_at", { ascending: false })
        .limit(1),
      admin
        .from("social_accounts")
        .select("followers")
        .eq("profile_id", profileId),
    ]);

    const cardViews = viewsRes.count || 0;
    const linkClicks = clicksRes.count || 0;
    const tipsData = tipsRes.data || [];
    const tipsAmount = tipsData.reduce((acc: number, t: { amount: number }) => acc + (t.amount || 0), 0) / 100;
    const tipsCount = tipsData.length;
    const followersTotal = (socialRes.data || []).reduce((acc: number, s: { followers: number }) => acc + (s.followers || 0), 0);
    const nilScore = metricsRes.data?.[0]?.nil_score || 0;

    // Calculate profile completion score
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, sport, school, position, bio, avatar_url, stats, links, highlights, social")
      .eq("id", profileId)
      .single();

    let profileScore = 0;
    if (profile) {
      const checks = [
        !!profile.full_name, !!profile.sport, !!profile.school,
        !!profile.position, !!profile.bio, !!profile.avatar_url,
        (profile.stats?.length || 0) > 0, (profile.links?.length || 0) > 0,
        Object.keys(profile.social || {}).length > 0,
        (profile.highlights?.length || 0) > 0,
      ];
      profileScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }

    // Insert snapshot
    const { data, error } = await admin
      .from("weekly_snapshots")
      .insert({
        profile_id: profileId,
        week_start: start,
        week_end: end,
        card_views: cardViews,
        link_clicks: linkClicks,
        tips_amount: tipsAmount,
        tips_count: tipsCount,
        followers_total: followersTotal,
        nil_score: nilScore,
        profile_score: profileScore,
      })
      .select()
      .single();

    if (error) {
      // Unique constraint violation = concurrent insert won the race
      if (error.code === "23505") return { ok: true };
      console.error("[weekly-snapshot] insert failed:", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data as WeeklySnapshot };
  } catch (err) {
    console.error("[weekly-snapshot] captureWeeklySnapshot error:", err);
    return { ok: false, error: "Failed to capture snapshot" };
  }
}

/**
 * Get weekly snapshot history for trend charts.
 * Returns snapshots ordered by week descending.
 */
export async function getWeeklySnapshots(
  weeks = 12
): Promise<{ ok: boolean; data?: WeeklySnapshot[]; error?: string }> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const admin = getAdmin();
    const { data, error } = await admin
      .from("weekly_snapshots")
      .select("*")
      .eq("profile_id", user.id)
      .order("week_start", { ascending: false })
      .limit(weeks);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data || []).reverse() as WeeklySnapshot[] };
  } catch {
    return { ok: false, error: "Failed to load snapshots" };
  }
}

/**
 * Get week-over-week growth comparison.
 */
export async function getGrowthComparison(): Promise<{
  ok: boolean;
  data?: {
    views: { current: number; previous: number; change: number };
    clicks: { current: number; previous: number; change: number };
    tips: { current: number; previous: number; change: number };
    followers: { current: number; previous: number; change: number };
  };
  error?: string;
}> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const admin = getAdmin();
    const { data } = await admin
      .from("weekly_snapshots")
      .select("*")
      .eq("profile_id", user.id)
      .order("week_start", { ascending: false })
      .limit(2);

    if (!data || data.length < 2) {
      return {
        ok: true,
        data: {
          views: { current: 0, previous: 0, change: 0 },
          clicks: { current: 0, previous: 0, change: 0 },
          tips: { current: 0, previous: 0, change: 0 },
          followers: { current: 0, previous: 0, change: 0 },
        },
      };
    }

    const curr = data[0];
    const prev = data[1];

    const calcChange = (c: number, p: number) => p > 0 ? Math.round(((c - p) / p) * 100) : c > 0 ? 100 : 0;

    return {
      ok: true,
      data: {
        views: { current: curr.card_views, previous: prev.card_views, change: calcChange(curr.card_views, prev.card_views) },
        clicks: { current: curr.link_clicks, previous: prev.link_clicks, change: calcChange(curr.link_clicks, prev.link_clicks) },
        tips: { current: curr.tips_amount, previous: prev.tips_amount, change: calcChange(curr.tips_amount, prev.tips_amount) },
        followers: { current: curr.followers_total, previous: prev.followers_total, change: calcChange(curr.followers_total, prev.followers_total) },
      },
    };
  } catch {
    return { ok: false, error: "Failed to compute growth" };
  }
}
