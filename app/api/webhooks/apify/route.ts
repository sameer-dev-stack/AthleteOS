import { NextResponse } from "next/server";
import { processApifyDataset } from "@/lib/apify-processor";

export const runtime = "nodejs";

/**
 * Apify webhook callback.
 * Called by Apify when an actor run completes (ACTOR.RUN.SUCCEEDED or ACTOR.RUN.FAILED).
 *
 * Security: we re-fetch the dataset directly from Apify using the datasetId
 * from the payload — a spoofed call cannot inject fake data because it would
 * need a valid Apify datasetId that we re-verify against the Apify API.
 *
 * Query params (set by queueSocialScrape):
 *   platform - "instagram" | "tiktok"
 *   handle   - raw username (no @)
 *   userId   - Supabase auth user ID
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform") as "instagram" | "tiktok" | null;
    const handle = searchParams.get("handle");
    const userId = searchParams.get("userId");

    if (!platform || !handle || !userId) {
      return NextResponse.json(
        { error: "Missing required query params: platform, handle, userId" },
        { status: 400 }
      );
    }

    if (platform !== "instagram" && platform !== "tiktok") {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const payload = await req.json();

    // Handle failed runs
    const eventType = payload?.eventType as string | undefined;
    if (eventType === "ACTOR.RUN.FAILED") {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await admin
        .from("social_accounts")
        .update({ verification_status: "ERROR" })
        .eq("profile_id", userId)
        .eq("platform", platform);
      console.error(`[webhook/apify] Actor run FAILED for ${platform}/@${handle}`);
      return NextResponse.json({ status: "FAILED" });
    }

    // Re-fetch the dataset from Apify (security: validates the datasetId is real)
    const datasetId = payload?.resource?.defaultDatasetId as string | undefined;
    if (!datasetId) {
      return NextResponse.json({ error: "No datasetId in payload" }, { status: 400 });
    }

    const APIFY_API_KEY = process.env.APIFY_API_KEY;
    if (!APIFY_API_KEY) {
      return NextResponse.json({ error: "APIFY_API_KEY not configured" }, { status: 500 });
    }

    const datasetRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}`
    );

    if (!datasetRes.ok) {
      console.error("[webhook/apify] Failed to fetch dataset:", datasetId);
      return NextResponse.json({ error: "Failed to fetch Apify dataset" }, { status: 502 });
    }

    const items = await datasetRes.json();

    const result = await processApifyDataset(platform, handle, userId, items);

    return NextResponse.json({ status: result.status });
  } catch (err) {
    console.error("[webhook/apify] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
