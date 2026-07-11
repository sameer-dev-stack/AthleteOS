import { NextRequest, NextResponse } from "next/server";
import { getShareableReport } from "@/lib/actions/analytics";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const result = await getShareableReport(token);

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Report not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    range: result.range,
    data: result.data,
  });
}
