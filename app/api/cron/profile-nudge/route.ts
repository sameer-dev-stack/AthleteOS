import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendProfileNudgeEmail } from "@/lib/actions/emails";

export const runtime = "nodejs";
export const maxDuration = 120;

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdmin();
  const results = { sent: 0, skipped: 0, errors: 0 };

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name, avatar_url, bio, stats, links, social, profile_published")
    .eq("onboarding_completed", true)
    .eq("profile_published", false)
    .lte("created_at", oneDayAgo)
    .limit(50);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ message: "No incomplete profiles found", results });
  }

  for (const profile of profiles) {
    try {
      const missing: string[] = [];
      if (!profile.avatar_url) missing.push("Profile photo");
      if (!profile.bio || profile.bio.length < 15) missing.push("Bio");
      if (!profile.stats || profile.stats.length === 0) missing.push("Stats");
      if (!profile.social?.instagram && !profile.social?.twitter && !profile.social?.tiktok) missing.push("Social accounts");

      if (missing.length === 0) {
        results.skipped++;
        continue;
      }

      const firstName = (profile.full_name || "Athlete").split(" ")[0];
      await sendProfileNudgeEmail(profile.email, firstName, missing);
      results.sent++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({ message: "Profile nudge emails processed", results });
}
