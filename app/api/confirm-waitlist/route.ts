import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_ATTEMPTS = 5;

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const ip = getClientIp(request);

  if (!token || token.length < 10 || token.length > 200) {
    return NextResponse.redirect(
      new URL("/?error=invalid-confirmation-token", request.url)
    );
  }

  if (!checkRateLimit(`confirm-waitlist:${ip}`)) {
    return NextResponse.redirect(
      new URL("/?error=too-many-attempts", request.url)
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("waitlist")
    .update({ confirmed: true, confirmation_token: null })
    .eq("confirmation_token", token)
    .select("email")
    .single();

  if (error || !data) {
    return NextResponse.redirect(
      new URL("/?error=confirmation-failed", request.url)
    );
  }

  return NextResponse.redirect(new URL("/auth/welcome", request.url));
}
