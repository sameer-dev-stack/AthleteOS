import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizeReferrerName } from "@/lib/referral-display";

export const runtime = "nodejs";

// Resolves a referral code to the referrer's display name for the sign-up
// banner. Service-role only; returns just the name (never email/PII).
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.json({ name: null });

  const serviceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: codeRow } = await serviceRole
    .from("referral_codes")
    .select("user_id, is_active")
    .ilike("code", code)
    .single();
  if (!codeRow?.is_active || !codeRow.user_id) {
    return NextResponse.json({ name: null });
  }

  const { data: profile } = await serviceRole
    .from("profiles")
    .select("full_name")
    .eq("id", codeRow.user_id)
    .single();

  return NextResponse.json({ name: sanitizeReferrerName(profile?.full_name ?? null) });
}
