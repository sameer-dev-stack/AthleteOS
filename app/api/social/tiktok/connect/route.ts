import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const STATE_COOKIE = "athleteos_oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/dashboard/nil?error=not-authenticated`);
  }

  const clientId = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = `${origin}/api/social/tiktok/callback`;

  if (!clientId) {
    return NextResponse.redirect(`${origin}/dashboard/nil?error=tiktok-not-configured`);
  }

  // One-time nonce bound to this user (see instagram/connect for rationale).
  const state = randomUUID();

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await service.from("social_oauth_states").insert({
    state,
    profile_id: user.id,
    platform: "tiktok",
  });

  const params = new URLSearchParams({
    client_key: clientId,
    redirect_uri: redirectUri,
    scope: "user.info.basic",
    response_type: "code",
    state,
  });

  const res = NextResponse.redirect(
    `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  );
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: STATE_TTL_MS / 1000,
  });
  return res;
}