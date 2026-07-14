import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { computeNilScoreAndRates, NILMetrics, NILProfile } from "./nil-score";

export type NILMetricsRow = {
  id: string;
  profile_id: string;
  period_start: string;
  period_end: string;
  card_views: number;
  link_clicks: number;
  click_through_rate: number;
  tips_amount: number;
  tips_count: number;
  followers_total: number;
  engagement_rate: number;
  follower_delta_percent: number;
  engagement_delta_percent: number;
  nil_score: number;
  computed_at: string;
};

function getRangeDates() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  return {
    start: thirtyDaysAgo.toISOString().split("T")[0],
    end: today.toISOString().split("T")[0],
  };
}

/**
 * Internal method to calculate NIL metrics and store in DB using service role client.
 * Bypasses user authentication checks for background cron tasks.
 */
export async function computeAndSaveMetricsInternal(
  admin: SupabaseClient,
  profileId: string
): Promise<{ ok: boolean; data?: NILMetricsRow; error?: string }> {
  try {
    // Get athlete profile details
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("sport, school, position")
      .eq("id", profileId)
      .single();

    if (profileErr || !profile) {
      return { ok: false, error: profileErr?.message || "Profile not found" };
    }

    const { start, end } = getRangeDates();

    // Query card views (page_views table)
    const { count: cardViews, error: viewsErr } = await admin
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", profileId)
      .gte("created_at", `${start}T00:00:00.000Z`);

    if (viewsErr) {
      return { ok: false, error: `Failed to query page_views: ${viewsErr.message}` };
    }

    // Query link clicks (link_clicks table)
    const { count: linkClicks, error: clicksErr } = await admin
      .from("link_clicks")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", profileId)
      .gte("created_at", `${start}T00:00:00.000Z`);

    if (clicksErr) {
      return { ok: false, error: `Failed to query link_clicks: ${clicksErr.message}` };
    }

    // Query tips (tips table)
    const { data: tipsData, error: tipsErr } = await admin
      .from("tips")
      .select("amount")
      .eq("athlete_id", profileId)
      .eq("status", "succeeded")
      .gte("created_at", `${start}T00:00:00.000Z`);

    if (tipsErr) {
      return { ok: false, error: `Failed to query tips: ${tipsErr.message}` };
    }

    const tipsCount = tipsData?.length || 0;
    const tipsAmountCents = tipsData?.reduce((acc, row) => acc + (row.amount || 0), 0) || 0;
    const tipsAmount = tipsAmountCents / 100;

    // Fetch connected social accounts to compute total followers and overall ER
    const { data: socialAccounts, error: socialErr } = await admin
      .from("social_accounts")
      .select("followers, total_engagements")
      .eq("profile_id", profileId)
      .eq("verification_status", "VERIFIED");

    const activeSocialAccounts = socialErr ? [] : socialAccounts || [];
    const followersTotal = activeSocialAccounts.reduce((acc, account) => acc + (account.followers || 0), 0);

    // True cross-platform engagement rate: total_engagements / total_followers
    const totalEngagements = activeSocialAccounts.reduce((acc, account) => acc + (account.total_engagements || 0), 0);
    const engagementRate = followersTotal > 0 ? totalEngagements / followersTotal : 0.05;

    // Calculate CTR
    const viewsNum = cardViews || 0;
    const clicksNum = linkClicks || 0;
    const clickThroughRate = viewsNum > 0 ? clicksNum / viewsNum : 0;

    // Fetch previous metrics to compute deltas
    const { data: prevMetrics } = await admin
      .from("nil_value_metrics")
      .select("followers_total, engagement_rate")
      .eq("profile_id", profileId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let followerDelta = 0;
    let engagementDelta = 0;

    if (prevMetrics) {
      const prevFollowers = prevMetrics.followers_total || 0;
      const prevER = prevMetrics.engagement_rate || 0;

      if (prevFollowers > 0) {
        followerDelta = ((followersTotal - prevFollowers) / prevFollowers) * 100;
      }
      if (prevER > 0) {
        engagementDelta = ((engagementRate - prevER) / prevER) * 100;
      }
    }

    // Compute score & rates
    const metricsInput: NILMetrics = {
      card_views: viewsNum,
      link_clicks: clicksNum,
      click_through_rate: clickThroughRate,
      tips_amount: tipsAmount,
      tips_count: tipsCount,
      followers_total: followersTotal,
      engagement_rate: engagementRate,
    };

    const profileInput: NILProfile = {
      sport: profile.sport,
      school: profile.school,
      position: profile.position,
    };

    const scoreResult = computeNilScoreAndRates(metricsInput, profileInput);

    // Write/update nil_value_metrics table
    const { data, error } = await admin
      .from("nil_value_metrics")
      .upsert(
        {
          profile_id: profileId,
          period_start: start,
          period_end: end,
          card_views: viewsNum,
          link_clicks: clicksNum,
          click_through_rate: clickThroughRate,
          tips_amount: tipsAmount,
          tips_count: tipsCount,
          followers_total: followersTotal,
          engagement_rate: engagementRate,
          follower_delta_percent: followerDelta,
          engagement_delta_percent: engagementDelta,
          nil_score: scoreResult.nilScore,
          computed_at: new Date().toISOString(),
        },
        { onConflict: "profile_id, period_start, period_end" }
      )
      .select()
      .single();

    if (error) {
      console.error("[nil-engine-internal] Error upserting nil_value_metrics:", error.message);
      return { ok: false, error: error.message };
    }

    // Persist a rolling history row so the NIL score trend is retained
    const { error: historyErr } = await admin
      .from("nil_score_history")
      .insert({
        profile_id: profileId,
        nil_score: scoreResult.nilScore,
        label: scoreResult.label,
        breakdown_json: scoreResult.breakdown,
        computed_at: new Date().toISOString(),
      });

    if (historyErr) {
      console.error("[nil-engine-internal] Error inserting nil_score_history:", historyErr.message);
      return { ok: false, error: historyErr.message };
    }

    revalidatePath("/dashboard/nil");
    return { ok: true, data: data as NILMetricsRow };
  } catch (err: unknown) {
    console.error("[nil-engine-internal] computeAndSaveMetricsInternal unexpected error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
