import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Runs every Sunday at 3AM UTC via Vercel Cron (configured in vercel.json)
// Calls existing cleanup_raw_analytics() PL/pgSQL function to prune data > 90 days
// Protected by CRON_SECRET environment variable

export const runtime = "nodejs";
export const maxDuration = 60;

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

  try {
    const { data, error } = await admin.rpc("cleanup_raw_analytics");

    if (error) {
      console.error("[prune-analytics] Failed to execute cleanup:", error.message);
      return NextResponse.json({ error: "Cleanup function failed" }, { status: 500 });
    }

    console.log("[prune-analytics] Done:", JSON.stringify(data));
    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    console.error("[prune-analytics] Fatal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
