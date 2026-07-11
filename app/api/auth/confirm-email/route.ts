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
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  const ip = getClientIp(request);

  if (!token || token.length < 10 || token.length > 200) {
    return NextResponse.redirect(
      new URL("/?error=invalid-confirmation-token", origin)
    );
  }

  if (!checkRateLimit(`confirm-email:${ip}`)) {
    return NextResponse.redirect(
      new URL("/?error=too-many-attempts", origin)
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile, error: lookupError } = await supabase
    .from("profiles")
    .select("id, confirmation_token_expires, email_confirmed")
    .eq("confirmation_token", token)
    .single();

  if (lookupError || !profile) {
    return NextResponse.redirect(
      new URL("/?error=confirmation-failed", origin)
    );
  }

  if (profile.email_confirmed) {
    return NextResponse.redirect(new URL("/auth/welcome", origin));
  }

  if (profile.confirmation_token_expires) {
    const expiresAt = new Date(profile.confirmation_token_expires);
    if (expiresAt < new Date()) {
      return NextResponse.redirect(
        new URL("/?error=token-expired", origin)
      );
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      email_confirmed: true,
      confirmation_token: null,
      confirmation_token_expires: null,
    })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.redirect(
      new URL("/?error=confirmation-failed", origin)
    );
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(
    profile.id,
    { email_confirm: true }
  );

  if (authError) {
    console.error("[confirm-email] failed to confirm auth user", authError.message);
  }

  return NextResponse.redirect(new URL("/auth/welcome", origin));
}
