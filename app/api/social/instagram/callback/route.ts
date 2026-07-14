import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/dashboard/nil?error=instagram-oauth-failed`);
  }

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
        profile_id: state,
        platform: "instagram",
        handle: profileData.username || "",
        followers: igData.followers_count || 0,
        access_token: accessToken,
        verification_status: "VERIFIED",
        platform_user_id: profileData.id,
        profile_url: igData.profile_picture_url || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id, platform" }
    );

    return NextResponse.redirect(`${origin}/dashboard/nil?instagram=connected`);
  } catch (err) {
    console.error("[instagram-callback]", err);
    return NextResponse.redirect(`${origin}/dashboard/nil?error=instagram-oauth-failed`);
  }
}
