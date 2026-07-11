import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { account_id } = body;

  if (!account_id) {
    return NextResponse.json({ error: "Missing account_id" }, { status: 400 });
  }

  const { data: account, error: fetchError } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("id", account_id)
    .eq("profile_id", user.id)
    .single();

  if (fetchError || !account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  if (!account.access_token) {
    return NextResponse.json({ error: "No access token — reconnect via OAuth" }, { status: 400 });
  }

  try {
    if (account.platform === "instagram") {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${account.platform_user_id}?fields=followers_count,media_count&access_token=${account.access_token}`
      );
      const data = await res.json();

      if (data.error) {
        return NextResponse.json({ error: data.error.message, needs_reconnect: true }, { status: 401 });
      }

      await supabase
        .from("social_accounts")
        .update({
          followers: data.followers_count || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id)
        .eq("profile_id", user.id);

      return NextResponse.json({ ok: true, followers: data.followers_count });
    }

    if (account.platform === "tiktok") {
      const res = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=follower_count,video_count",
        { headers: { Authorization: `Bearer ${account.access_token}` } }
      );
      const data = await res.json();

      if (data.error?.code !== "ok") {
        return NextResponse.json({ error: "Token expired or invalid", needs_reconnect: true }, { status: 401 });
      }

      const followerCount = data?.data?.user?.follower_count || 0;

      await supabase
        .from("social_accounts")
        .update({
          followers: followerCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id)
        .eq("profile_id", user.id);

      return NextResponse.json({ ok: true, followers: followerCount });
    }

    return NextResponse.json({ error: "Unsupported platform for auto-refresh" }, { status: 400 });
  } catch (err) {
    console.error("[social-refresh]", err);
    return NextResponse.json({ error: "Failed to refresh follower count" }, { status: 500 });
  }
}
