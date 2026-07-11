import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { callGemini } from "@/lib/ai";
import { sendWeeklyBriefing } from "@/lib/actions/emails";

// Runs every Monday at 8AM UTC via Vercel Cron (configured in vercel.json)
// Protected by CRON_SECRET environment variable

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min timeout for batch processing

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  // Auth guard — Vercel sends Authorization header automatically
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdmin();
  const results = { sent: 0, skipped: 0, errors: 0 };

  try {
    // Get all athletes active in the last 7 days with email confirmed
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: athletes, error: athletesErr } = await admin
      .from("profiles")
      .select("id, email, full_name, sport, school, position, bio, created_at, plan")
      .eq("onboarding_completed", true)
      .eq("suspended", false)
      .not("email", "is", null);

    if (athletesErr || !athletes) {
      console.error("[weekly-briefing] Failed to fetch athletes:", athletesErr?.message);
      return NextResponse.json({ error: "Failed to fetch athletes" }, { status: 500 });
    }

    for (const athlete of athletes) {
      try {
        // --- 7-day stats ---
        const weekStart = sevenDaysAgo.toISOString();

        const [viewsRes, clicksRes, tipsRes, nilRes, memoryRes, quotaRes, inquiriesRes, subsRes] = await Promise.all([
          admin.from("page_views").select("id", { count: "exact", head: true })
            .eq("athlete_id", athlete.id).gte("created_at", weekStart),
          admin.from("link_clicks").select("id", { count: "exact", head: true })
            .eq("athlete_id", athlete.id).gte("created_at", weekStart),
          admin.from("tips").select("amount")
            .eq("athlete_id", athlete.id).eq("status", "succeeded").gte("created_at", weekStart),
          admin.from("nil_value_metrics").select("nil_score, computed_at")
            .eq("profile_id", athlete.id).order("computed_at", { ascending: false }).limit(1),
          admin.from("athlete_ai_memory").select("*").eq("profile_id", athlete.id).single(),
          admin.from("ai_usage").select("used_count")
            .eq("user_id", athlete.id).eq("tool", "all")
            .eq("period_start", new Date().toISOString().slice(0, 7) + "-01").single(),
          admin.from("inquiries").select("id", { count: "exact", head: true })
            .eq("athlete_id", athlete.id).gte("created_at", weekStart),
          admin.from("fan_subscriptions").select("id", { count: "exact", head: true })
            .eq("athlete_id", athlete.id).eq("status", "active"),
        ]);

        const cardViews = viewsRes.count || 0;
        const linkClicks = clicksRes.count || 0;
        const tipsTotal = (tipsRes.data || []).reduce((acc: number, t: { amount: number }) => acc + t.amount, 0) / 100;
        const nilScore = nilRes.data?.[0]?.nil_score || null;
        const memory = memoryRes.data;
        const aiUsed = quotaRes.data?.used_count || 0;
        const aiLimit = athlete.plan === "pro" ? 300 : athlete.plan === "elite" ? 500 : 5;
        const aiRemaining = Math.max(0, aiLimit - aiUsed);

        const newInquiries = inquiriesRes.count || 0;
        const fanSubscribers = subsRes.count || 0;

        // Skip athletes with zero activity this week
        if (cardViews === 0 && linkClicks === 0 && tipsTotal === 0 && newInquiries === 0) {
          results.skipped++;
          continue;
        }

        // --- AI-generated 3 action items ---
        const memoryBlock = memory
          ? `\nAI Memory: preferred tone = ${memory.preferred_tone}, most used tool = ${memory.last_used_tool || "N/A"}, outputs saved = ${memory.outputs_saved_count}`
          : "";

        const aiPrompt = `You are an athletic advisor. Give exactly 3 short, specific, actionable items an athlete should do this week to grow their NIL value.

Athlete:
- Name: ${athlete.full_name || "Athlete"}
- Sport: ${athlete.sport || "N/A"}
- School: ${athlete.school || "N/A"}${memoryBlock}

This week's data:
- Card views: ${cardViews}
- Link clicks: ${linkClicks}
- Tips earned: $${tipsTotal.toFixed(2)}
- New inquiries: ${newInquiries}
- Fan subscribers: ${fanSubscribers}
- NIL Score: ${nilScore ?? "Not yet calculated"}
- AI uses remaining this month: ${aiRemaining}

Rules:
- Each item must be 1 sentence, actionable, and specific to their data
- If views are high but clicks low, suggest improving links
- If tips are zero, suggest a fan engagement caption
- If inquiries are zero, suggest reaching out to local brands
- If AI uses remain, encourage using the AI toolkit
- Return exactly 3 items as a numbered list: 1. ... 2. ... 3. ...
Do not include any intro or outro.`;

        let actionItems: string[] = [];
        try {
          const aiResponse = await callGemini(aiPrompt, "You are a concise, data-driven NIL coach.", 400);
          actionItems = aiResponse
            .split("\n")
            .filter((l) => l.match(/^\d\./))
            .map((l) => l.replace(/^\d\.\s*/, "").trim())
            .filter((l) => l.length > 0)
            .slice(0, 3);
        } catch {
          actionItems = [
            "Post a training recap caption using the AI Caption Generator in your toolkit.",
            "Check your analytics to see which links are getting the most clicks this week.",
            "Update your NIL Score by running the Value Engine — it only takes one click.",
          ];
        }

        // --- Send email ---
        const sent = await sendWeeklyBriefing(athlete.email, {
          firstName: athlete.full_name?.split(" ")[0] || "Athlete",
          cardViews,
          linkClicks,
          tipsTotal,
          nilScore,
          aiRemaining,
          aiLimit,
          actionItems,
          preferredTone: memory?.preferred_tone || null,
          daysOnPlatform: Math.floor(
            (Date.now() - new Date(athlete.created_at).getTime()) / (1000 * 60 * 60 * 24)
          ),
          newInquiries: inquiriesRes.count || 0,
          fanSubscribers: subsRes.count || 0,
        });

        if (sent.ok) {
          results.sent++;
        } else {
          results.errors++;
          console.error(`[weekly-briefing] Failed to send to ${athlete.email}:`, sent.error);
        }

        // Small delay to avoid rate limiting Resend
        await new Promise((r) => setTimeout(r, 200));
      } catch (athleteErr) {
        results.errors++;
        console.error(`[weekly-briefing] Error for athlete ${athlete.id}:`, athleteErr);
      }
    }

    console.log(`[weekly-briefing] Done: ${JSON.stringify(results)}`);
    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    console.error("[weekly-briefing] Fatal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
