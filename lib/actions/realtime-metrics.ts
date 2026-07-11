"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function getRealtimeMetrics(): Promise<{
  activeUsers: number;
  totalProfiles: number;
  publishedCards: number;
  recentTips: { amount: number; athlete: string; created_at: string }[];
  recentSignups: { full_name: string; email: string; created_at: string }[];
  pageViewsToday: number;
  tipsTodayCount: number;
  tipsTodayTotal: number;
  aiUsageToday: number;
} | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) return null;

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [activeUsers, totalProfiles, publishedCards, recentTips, recentSignups, pageViews, tips, aiUsage] =
      await Promise.all([
        admin.from("profiles").select("id", { count: "exact", head: true }).eq("suspended", false),
        admin.from("profiles").select("id", { count: "exact", head: true }),
        admin.from("profiles").select("id", { count: "exact", head: true }).eq("profile_published", true),
        admin.from("tips").select("amount, athlete_id, created_at").gte("created_at", todayISO).order("created_at", { ascending: false }).limit(5),
        admin.from("profiles").select("full_name, email, created_at").gte("created_at", todayISO).order("created_at", { ascending: false }).limit(5),
        admin.from("page_views").select("id", { count: "exact", head: true }).gte("viewed_at", todayISO),
        admin.from("tips").select("id, amount", { count: "exact" }).gte("created_at", todayISO),
        admin.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
      ]);

    return {
      activeUsers: activeUsers.count ?? 0,
      totalProfiles: totalProfiles.count ?? 0,
      publishedCards: publishedCards.count ?? 0,
      recentTips: (recentTips.data || []).map((t) => ({
        amount: t.amount,
        athlete: t.athlete_id?.slice(0, 8) || "Unknown",
        created_at: t.created_at,
      })),
      recentSignups: (recentSignups.data || []).map((s) => ({
        full_name: s.full_name || "Anonymous",
        email: s.email || "",
        created_at: s.created_at,
      })),
      pageViewsToday: pageViews.count ?? 0,
      tipsTodayCount: tips.count ?? 0,
      tipsTodayTotal: (tips.data || []).reduce((sum: number, t: { amount: number }) => sum + (t.amount || 0), 0),
      aiUsageToday: aiUsage.count ?? 0,
    };
  } catch {
    return null;
  }
}
