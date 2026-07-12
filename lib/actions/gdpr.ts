"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function exportUserData(): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [profileRes, tipsRes, inquiriesRes, aiUsageRes, savedAssetsRes, pageViewsRes, linkClicksRes] = await Promise.all([
      admin.from("profiles").select("*").eq("id", user.id).single(),
      admin.from("tips").select("*").eq("athlete_id", user.id),
      admin.from("inquiries").select("*").eq("athlete_id", user.id),
      admin.from("ai_usage").select("*").eq("user_id", user.id),
      admin.from("ai_saved_assets").select("*").eq("profile_id", user.id),
      admin.from("page_views").select("*").eq("athlete_id", user.id),
      admin.from("link_clicks").select("*").eq("athlete_id", user.id),
    ]);

    return {
      ok: true,
      data: {
        exportDate: new Date().toISOString(),
        profile: profileRes.data || null,
        tips: tipsRes.data || [],
        inquiries: inquiriesRes.data || [],
        aiUsage: aiUsageRes.data || [],
        savedAssets: savedAssetsRes.data || [],
        analytics: {
          pageViews: pageViewsRes.data || [],
          linkClicks: linkClicksRes.data || [],
        },
      },
    };
  } catch (err) {
    console.error("[gdpr] exportUserData error:", err);
    return { ok: false, error: "Failed to export data" };
  }
}

export async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const tables = [
      "tips", "inquiries", "ai_usage", "ai_saved_assets", "ai_events",
      "page_views", "link_clicks", "nil_value_metrics", "nil_deals",
      "audit_log", "fan_subscriptions", "content_posts", "membership_tiers",
      "social_accounts", "athlete_ai_memory", "saved_athletes",
    ];

    for (const table of tables) {
      try {
        await admin.from(table).delete().eq("athlete_id", user.id);
      } catch { /* best effort */ }
      try {
        await admin.from(table).delete().eq("user_id", user.id);
      } catch { /* best effort */ }
    }

    // referral data removed with account (GDPR) — referred_id unique = one referral per person
    await admin.from("referral_clicks").delete().eq("referrer_id", user.id);
    await admin.from("referrals").delete().or(`referrer_id.eq.${user.id},referred_id.eq.${user.id}`);
    await admin.from("referral_codes").delete().eq("user_id", user.id);

    await admin.from("profiles").delete().eq("id", user.id);

    return { ok: true };
  } catch (err) {
    console.error("[gdpr] deleteAccount error:", err);
    return { ok: false, error: "Failed to delete account" };
  }
}
