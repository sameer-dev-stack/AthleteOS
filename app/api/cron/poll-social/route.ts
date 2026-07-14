import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min timeout

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Subscription tier resolving helper
function resolvePlan(plan: string | null, extendedUntil: string | null): "free" | "pro" | "elite" {
  if (extendedUntil && new Date(extendedUntil) > new Date()) {
    return "pro";
  }
  const p = (plan || "").toLowerCase();
  if (p === "pro" || p === "elite") return p as "pro" | "elite";
  return "free";
}

export async function GET(req: NextRequest) {
  try {
    // Auth guard (standard Vercel Cron auth)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isDev = process.env.NODE_ENV === "development";

    if (!isDev && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdmin();
    const APIFY_API_KEY = process.env.APIFY_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";

    if (!APIFY_API_KEY) {
      return NextResponse.json({ error: "APIFY_API_KEY not configured" }, { status: 500 });
    }
    if (!appUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL not configured" }, { status: 500 });
    }

    // Fetch all connected social accounts and join with profiles
    const { data: socialAccounts, error: accountsErr } = await admin
      .from("social_accounts")
      .select(`
        id,
        platform,
        handle,
        followers,
        last_scraped_at,
        updated_at,
        profile_id,
        profiles (
          id,
          plan,
          extended_pro_until,
          onboarding_completed,
          suspended
        )
      `)
      .eq("verification_status", "VERIFIED");

    if (accountsErr) {
      console.error("[cron/poll-social] Database error fetching accounts:", accountsErr.message);
      return NextResponse.json({ error: accountsErr.message }, { status: 500 });
    }

    const activeAccounts = socialAccounts || [];
    const now = Date.now();

    // Filter accounts that are due for polling
    const dueAccounts = activeAccounts.filter((account: any) => {
      const profile = account.profiles;
      if (!profile || !profile.onboarding_completed || profile.suspended) {
        return false;
      }

      const tier = resolvePlan(profile.plan, profile.extended_pro_until);
      const lastScrapedStr = account.last_scraped_at || account.updated_at;
      const lastScrapedTime = lastScrapedStr ? new Date(lastScrapedStr).getTime() : 0;
      const hoursSinceScrape = (now - lastScrapedTime) / (1000 * 60 * 60);

      if (tier === "pro" || tier === "elite") {
        // Pro/Elite: Poll weekly (every 168 hours), both Instagram and TikTok supported
        return hoursSinceScrape >= 168;
      } else {
        // Free: Poll monthly (every 720 hours), Instagram only
        if (account.platform !== "instagram") return false;
        return hoursSinceScrape >= 720;
      }
    });

    // Sort by oldest scraped / updated date first to ensure fairness, then select a batch of 8
    dueAccounts.sort((a: any, b: any) => {
      const timeA = a.last_scraped_at || a.updated_at ? new Date(a.last_scraped_at || a.updated_at).getTime() : 0;
      const timeB = b.last_scraped_at || b.updated_at ? new Date(b.last_scraped_at || b.updated_at).getTime() : 0;
      return timeA - timeB;
    });

    const batchSize = 8;
    const batch = dueAccounts.slice(0, batchSize);

    console.log(`[cron/poll-social] Found ${dueAccounts.length} due accounts. Processing batch of ${batch.length}`);

    // Trigger non-blocking async runs for the batch
    const runPromises = batch.map(async (account: any) => {
      const platform = account.platform;
      const handle = account.handle.trim().replace(/^@/, "");
      const userId = account.profile_id;
      const actorId =
        platform === "instagram"
          ? "apify~instagram-scraper"
          : "clockworks~tiktok-profile-scraper";

      const body: Record<string, unknown> =
        platform === "instagram"
          ? { usernames: [handle], resultsLimit: 12 }
          : {
              profiles: [handle],
              resultsPerPage: 12,
              profileScrapeSections: ["videos"],
              proxyConfiguration: {
                useApifyProxy: true,
                apifyProxyGroups: ["RESIDENTIAL"],
              },
            };

      const webhookUrl = `${appUrl}/api/webhooks/apify?platform=${platform}&handle=${encodeURIComponent(handle)}&userId=${userId}`;

      const webhooks = encodeURIComponent(
        JSON.stringify([
          {
            eventTypes: ["ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED"],
            requestUrl: webhookUrl,
          },
        ])
      );

      try {
        const response = await fetch(
          `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}&webhooks=${webhooks}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[cron/poll-social] Failed to start run for ${platform}/@${handle}:`, errText);
          return { id: account.id, ok: false };
        }

        console.log(`[cron/poll-social] Queued scrape successfully for ${platform}/@${handle}`);
        return { id: account.id, ok: true };
      } catch (err) {
        console.error(`[cron/poll-social] Scrape queue error for ${platform}/@${handle}:`, err);
        return { id: account.id, ok: false };
      }
    });

    const results = await Promise.all(runPromises);
    const successCount = results.filter((r) => r.ok).length;

    return NextResponse.json({
      processed: batch.length,
      success: successCount,
      failed: batch.length - successCount,
    });
  } catch (err: unknown) {
    console.error("[cron/poll-social] Unexpected cron error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
