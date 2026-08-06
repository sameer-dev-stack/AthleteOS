import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnalyticsData, type AnalyticsRange } from "@/lib/actions/analytics";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("range") || "30d") as AnalyticsRange;
    const customStart = searchParams.get("customStart") || undefined;
    const customEnd = searchParams.get("customEnd") || undefined;
    const compare = searchParams.get("compare") === "true";

    const data = await getAnalyticsData(user.id, range, customStart, customEnd, compare);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[api/analytics] GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load analytics" }, { status: 500 });
  }
}
