import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnalyticsData, type AnalyticsRange } from "@/lib/actions/analytics";
import { getEffectivePlan } from "@/lib/actions/plan";

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

    const planResult = await getEffectivePlan();
    if (planResult === "free") {
      data.totalClicks = 0;
      data.topLinks = [];
      data.topReferrers = [];
      data.geoBreakdown = [];
      data.demographics = { devices: [], browsers: [] };
      data.engagement = { clickRate: 0, inquiryRate: 0, tipRate: 0, avgViewsPerDay: 0 };
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("[api/analytics] GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed to load analytics" }, { status: 500 });
  }
}
