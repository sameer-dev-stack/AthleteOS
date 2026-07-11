import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const params = new URLSearchParams({
    client_key: clientId,
    redirect_uri: redirectUri,
    scope: "user.info.basic",
    response_type: "code",
    state: user.id,
  });

  return NextResponse.redirect(
    `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  );
}
