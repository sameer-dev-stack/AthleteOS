import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Shared Apify dataset processor.
 * Called by:
 *   - /api/webhooks/apify (production, after actor run completes)
 *   - queueSocialScrape dev fallback (sync path on localhost)
 *
 * Parses the raw Apify dataset items, checks privacy, computes per-platform
 * engagement metrics, and upserts social_accounts. Then triggers NIL recalc.
 */
export async function processApifyDataset(
  platform: "instagram" | "tiktok",
  handle: string,
  userId: string,
  items: any[]
): Promise<{ ok: boolean; status: string; error?: string }> {
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (!Array.isArray(items) || items.length === 0) {
    await admin
      .from("social_accounts")
      .update({ verification_status: "PRIVATE_ACCOUNT" })
      .eq("profile_id", userId)
      .eq("platform", platform);
    return { ok: false, status: "PRIVATE_ACCOUNT" };
  }

  const firstItem = items[0];

  if (platform === "instagram") {
    const owner = firstItem.owner;
    const isPrivate = firstItem.isPrivate || owner?.isPrivate || false;

    if (isPrivate) {
      await admin
        .from("social_accounts")
        .update({ verification_status: "PRIVATE_ACCOUNT" })
        .eq("profile_id", userId)
        .eq("platform", platform);
      return { ok: false, status: "PRIVATE_ACCOUNT" };
    }

    const followers: number = owner?.followersCount || firstItem.followersCount || 0;

    let totalLikes = 0;
    let totalComments = 0;
    let postCount = 0;

    for (const item of items) {
      if (item.likesCount !== undefined || item.commentsCount !== undefined) {
        totalLikes += item.likesCount || 0;
        totalComments += item.commentsCount || 0;
        postCount++;
      }
    }

    const avgLikes = postCount > 0 ? totalLikes / postCount : 0;
    const avgComments = postCount > 0 ? totalComments / postCount : 0;
    // Total raw engagements for true cross-platform ER calculation
    const totalEngagements = totalLikes + totalComments;
    // Per-platform ER = total_engagements / (posts × followers)
    const er =
      postCount > 0 && followers > 0
        ? totalEngagements / (postCount * followers)
        : 0;

    await admin
      .from("social_accounts")
      .update({
        followers,
        engagement_rate: er,
        average_likes: avgLikes,
        average_comments: avgComments,
        average_views: 0,
        average_shares: 0,
        total_engagements: totalEngagements,
        is_connected: true,
        verification_status: "VERIFIED",
        last_scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", userId)
      .eq("platform", platform);
  } else if (platform === "tiktok") {
    const authorMeta = firstItem.authorMeta;
    const isPrivate = authorMeta?.private || firstItem.private || false;

    if (isPrivate) {
      await admin
        .from("social_accounts")
        .update({ verification_status: "PRIVATE_ACCOUNT" })
        .eq("profile_id", userId)
        .eq("platform", platform);
      return { ok: false, status: "PRIVATE_ACCOUNT" };
    }

    const followers: number = authorMeta?.fans || firstItem.fans || 0;

    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalViews = 0;
    let postCount = 0;

    for (const item of items) {
      const stats = item.stats;
      if (stats) {
        totalLikes += stats.diggCount || stats.likeCount || 0;
        totalComments += stats.commentCount || 0;
        totalShares += stats.shareCount || 0;
        totalViews += stats.playCount || 0;
        postCount++;
      }
    }

    const avgLikes = postCount > 0 ? totalLikes / postCount : 0;
    const avgComments = postCount > 0 ? totalComments / postCount : 0;
    const avgViews = postCount > 0 ? totalViews / postCount : 0;
    const avgShares = postCount > 0 ? totalShares / postCount : 0;
    // TikTok engagement = likes + comments + shares (not views — FYP inflates view counts)
    const totalEngagements = totalLikes + totalComments + totalShares;
    const er =
      postCount > 0 && followers > 0
        ? totalEngagements / (postCount * followers)
        : 0;

    await admin
      .from("social_accounts")
      .update({
        followers,
        engagement_rate: er,
        average_likes: avgLikes,
        average_comments: avgComments,
        average_views: avgViews,
        average_shares: avgShares,
        total_engagements: totalEngagements,
        is_connected: true,
        verification_status: "VERIFIED",
        last_scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", userId)
      .eq("platform", platform);
  }

  // Trigger NIL score recalculation
  try {
    const { computeAndSaveMetrics } = await import("./actions/nil-engine");
    await computeAndSaveMetrics(userId);
  } catch (err) {
    console.error("[apify-processor] NIL recalc failed:", err);
  }

  return { ok: true, status: "VERIFIED" };
}
