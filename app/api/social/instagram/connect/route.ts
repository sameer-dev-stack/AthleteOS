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

  const appId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = `${origin}/api/social/instagram/callback`;

  if (!appId) {
    return NextResponse.redirect(`${origin}/dashboard/nil?error=instagram-not-configured`);
  }

  // One-time nonce bound to this user. The callback verifies the state
  // against this row + an httpOnly cookie before writing the account,
  // so a third party cannot redirect their own OAuth code into someone
  // else's profile_id (20260812 hardening).
  const state = randomUUID();

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await service.from("social_oauth_states").insert({
    state,
    profile_id: user.id,
    platform: "instagram",
  });

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "user_profile,user_media",
    response_type: "code",
    state,
  });

  const res = NextResponse.redirect(
    `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
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