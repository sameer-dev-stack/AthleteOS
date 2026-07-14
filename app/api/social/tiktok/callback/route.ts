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
    return NextResponse.redirect(`${origin}/dashboard/nil?error=tiktok-oauth-failed`);
  }

  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${origin}/api/social/tiktok/callback`,
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData?.data?.access_token;
    const openId = tokenData?.data?.open_id;

    if (!accessToken || !openId) {
      return NextResponse.redirect(`${origin}/dashboard/nil?error=tiktok-token-exchange-failed`);
    }

    const userRes = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url,follower_count,video_count`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const userData = await userRes.json();
    const userInfo = userData?.data?.user;

    await db.from("social_accounts").upsert(
      {
        profile_id: state,
        platform: "tiktok",
        handle: userInfo?.display_name || "",
        followers: userInfo?.follower_count || 0,
        access_token: accessToken,
        verification_status: "VERIFIED",
        platform_user_id: openId,
        profile_url: userInfo?.avatar_url || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id, platform" }
    );

    return NextResponse.redirect(`${origin}/dashboard/nil?tiktok=connected`);
  } catch (err) {
    console.error("[tiktok-callback]", err);
    return NextResponse.redirect(`${origin}/dashboard/nil?error=tiktok-oauth-failed`);
  }
}
