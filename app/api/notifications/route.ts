import { NextResponse } from "next/server";
import { getSystemNotifications } from "@/lib/actions/notifications";

export async function GET() {
  const result = await getSystemNotifications();
  return NextResponse.json(result);
}
