import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";

export async function GET() {
  try {
    const storage = await getStorage();
    const [waitlist, newsletter] = await Promise.all([
      storage.getCount("waitlist"),
      storage.getCount("newsletter"),
    ]);
    return NextResponse.json(
      { waitlist, newsletter, mode: storage.mode },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[/api/waitlist] failed", err);
    return NextResponse.json(
      { waitlist: 0, newsletter: 0, mode: "unavailable" },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
