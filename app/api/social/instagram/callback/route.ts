import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STATE_COOKIE = "athleteos_oauth_state";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/dashboard/nil?error=instagram-oauth-failed`);
  }

  // Nonce + cookie binding: the state must match the one we issued to the
  // browser that started this flow, must not be expired, and must resolve
  // to a real profile. Prevents cross-user OAuth state replay (20260812).
  const cookieState = request.cookies.get(STATE_COOKIE)?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(`${origin}/dashboard/nil?error=instagram-oauth-failed`);
  }

  const stateRow = await db
    .from("social_oauth_states")
    .select("profile_id, created_at")
    .eq("state", state)
    .single();

  if (stateRow.error || !stateRow.data) {
    return NextResponse.redirect(`${origin}/dashboard/nil?error=instagram-oauth-failed`);
  }

  const createdMs = new Date(stateRow.data.created_at).getTime();
  if (Date.now() - createdMs > 10 * 60 * 1000) {
    await db.from("social_oauth_states").delete().eq("state", state);
    return NextResponse.redirect(`${origin}/dashboard/nil?error=instagram-oauth-expired`);
  }

  const profileId = stateRow.data.profile_id;

  // One-time use — consume immediately, before any writes.
  await db.from("social_oauth_states").delete().eq("state", state);

  try {
    const tokenRes = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        redirect_uri: `${origin}/api/social/instagram/callback`,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${origin}/dashboard/nil?error=instagram-token-exchange-failed`);
    }

    const accessToken = tokenData.access_token;

    const profileRes = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,username&access_token=${accessToken}`
    );
    const profileData = await profileRes.json();

    const igRes = await fetch(
      `https://graph.facebook.com/v18.0/${profileData.id}?fields=followers_count,media_count,profile_picture_url&access_token=${accessToken}`
    );
    const igData = await igRes.json();

    await db.from("social_accounts").upsert(
      {
        profile_id: profileId,
        platform: "instagram",
        handle: profileData.username || "",
        followers: igData.followers_count || 0,
        access_token: accessToken,
        verification_status: "VERIFIED",
        platform_user_id: profileData.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id, platform" }
    );

    const res = NextResponse.redirect(`${origin}/dashboard/nil?instagram=connected`);
    res.cookies.delete(STATE_COOKIE);
    return res;
  } catch (err) {
    console.error("[instagram-callback]", err);
    return NextResponse.redirect(`${origin}/dashboard/nil?error=instagram-oauth-failed`);
  }
}