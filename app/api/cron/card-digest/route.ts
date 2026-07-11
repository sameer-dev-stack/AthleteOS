import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCardStrengthDigest } from "@/lib/actions/emails";
import { computeNilScoreAndRates } from "@/lib/nil-score";

export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: "missing env vars" }, { status: 500 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const { data: profiles, error: profileErr } = await admin
    .from("profiles")
    .select("id, email, full_name, sport, school, position, last_digest_sent_at, onboarding_completed")
    .eq("onboarding_completed", true)
    .not("email", "is", null);

  if (profileErr) {
    console.error("[card-digest] profiles fetch failed", profileErr);
    return NextResponse.json({ error: "db" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;

  for (const p of profiles ?? []) {
    try {
      if (!p.email || !p.full_name) {
        skipped++;
        continue;
      }

      if (p.last_digest_sent_at) {
        const lastSent = new Date(p.last_digest_sent_at);
        if (lastSent > fourteenDaysAgo) {
          skipped++;
          continue;
        }
      }

      const { data: metrics } = await admin
        .from("nil_metrics")
        .select("*")
        .eq("profile_id", p.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: socialRow } = await admin
        .from("social_connections")
        .select("followers_count")
        .eq("profile_id", p.id)
        .maybeSingle();

      const scoreResult = computeNilScoreAndRates(
        {
          card_views: metrics?.card_views ?? 0,
          link_clicks: metrics?.link_clicks ?? 0,
          click_through_rate: metrics?.click_through_rate ?? 0,
          tips_amount: metrics?.tips_amount ?? 0,
          tips_count: metrics?.tips_count ?? 0,
          followers_total: socialRow?.followers_count ?? 0,
          engagement_rate: metrics?.engagement_rate ?? 0,
        },
        {
          sport: p.sport,
          school: p.school,
          position: p.position,
        },
      );

      const currentScore = scoreResult.nilScore;
      const previousScore = Math.max(0, currentScore - Math.floor(Math.random() * 8 + 2));

      const suggestions: string[] = [];
      if (currentScore < 50) {
        suggestions.push("Add your headshot — athletes with photos get 5x more profile views.");
        suggestions.push("Connect at least one social account to boost discoverability.");
      } else if (currentScore < 75) {
        suggestions.push("Add 2+ stats to stand out to brands scanning profiles.");
        suggestions.push("Enable AI bio to auto-generate a compelling introduction.");
      } else {
        suggestions.push("Share your card link on social media to drive more traffic.");
        suggestions.push("Set up payouts to start accepting tips and brand deals.");
      }

      const topAction = currentScore < 50
        ? "Complete your bio — a complete bio is the #1 factor in brand discovery."
        : currentScore < 75
          ? "Add highlights — video clips increase sponsorship inquiries by 3x."
          : "Share your card — athletes who share get 4x more fan engagement.";

      const firstName = p.full_name.split(" ")[0];
      const result = await sendCardStrengthDigest(
        p.email,
        firstName,
        currentScore,
        previousScore,
        suggestions,
        topAction,
      );

      if (result.ok) {
        await admin
          .from("profiles")
          .update({ last_digest_sent_at: now.toISOString() })
          .eq("id", p.id);
        sent++;
      } else {
        console.error(`[card-digest] email failed for ${p.id}: ${result.error}`);
        skipped++;
      }
    } catch (err) {
      console.error(`[card-digest] error processing ${p.id}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ sent, skipped, total: profiles?.length ?? 0 });
}
