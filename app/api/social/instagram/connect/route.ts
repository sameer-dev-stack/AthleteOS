import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "user_profile,user_media",
    response_type: "code",
    state: user.id,
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
  );
}
