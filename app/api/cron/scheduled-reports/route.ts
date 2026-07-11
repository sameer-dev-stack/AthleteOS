import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendAnalyticsReportEmail } from "@/lib/actions/analytics";

export const runtime = "nodejs";
export const maxDuration = 300;

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
  const now = new Date();
  const results = { sent: 0, skipped: 0, errors: 0 };

  try {
    const { data: reports, error: fetchErr } = await admin
      .from("scheduled_reports")
      .select("id, athlete_id, frequency, range, email, last_sent_at")
      .eq("enabled", true);

    if (fetchErr || !reports) {
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }

    for (const report of reports) {
      try {
        const shouldSend = shouldSendReport(report.frequency, report.last_sent_at, now);
        if (!shouldSend) {
          results.skipped++;
          continue;
        }

        const result = await sendAnalyticsReportEmail(
          report.athlete_id,
          report.range as "7d" | "30d" | "90d"
        );

        if (result.ok) {
          await admin
            .from("scheduled_reports")
            .update({ last_sent_at: now.toISOString() })
            .eq("id", report.id);
          results.sent++;
        } else {
          results.errors++;
          console.error(`[scheduled-reports] Send failed for ${report.id}:`, result.error);
        }

        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        results.errors++;
        console.error(`[scheduled-reports] Error for report ${report.id}:`, err);
      }
    }

    console.log(`[scheduled-reports] Done: ${JSON.stringify(results)}`);
    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    console.error("[scheduled-reports] Fatal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function shouldSendReport(frequency: string, lastSentAt: string | null, now: Date): boolean {
  if (!lastSentAt) return true;

  const last = new Date(lastSentAt);
  const diffMs = now.getTime() - last.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  switch (frequency) {
    case "daily":
      return diffHours >= 23;
    case "weekly":
      return diffHours >= 167;
    case "monthly":
      return diffHours >= 720;
    default:
      return false;
  }
}
