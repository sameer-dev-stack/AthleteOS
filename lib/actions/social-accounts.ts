"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SocialAccount = {
  id: string;
  profile_id: string;
  platform: string;
  handle: string;
  followers: number;
  is_connected: boolean;
  profile_url: string | null;
  updated_at: string;
};

const SocialAccountSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "twitter", "youtube", "other"]),
  handle: z.string().min(1, "Handle is required").max(100, "Handle is too long").regex(/^@?[a-zA-Z0-9_.-]+$/, "Invalid username format"),
  followers: z.number().min(0, "Followers cannot be negative").max(1000000000, "Follower count is too high"),
});

export async function getSocialAccounts(): Promise<{ ok: boolean; data?: SocialAccount[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("social_accounts")
      .select("id, profile_id, platform, handle, followers, is_connected, profile_url, updated_at")
      .eq("profile_id", user.id)
      .order("followers", { ascending: false });

    if (error) {
      if (error.code === "PGRST116" || error.message.includes("does not exist")) {
        return { ok: true, data: [] };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data as SocialAccount[] };
  } catch (err: unknown) {
    console.error("getSocialAccounts unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function upsertSocialAccount(
  platform: string,
  handle: string,
  followers: number
): Promise<{ ok: boolean; data?: SocialAccount; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const parsed = SocialAccountSchema.safeParse({ platform, handle, followers });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
    }

    const cleanHandle = handle.trim();

    const { data, error } = await supabase
      .from("social_accounts")
      .upsert(
        {
          profile_id: user.id,
          platform: parsed.data.platform,
          handle: cleanHandle,
          followers: parsed.data.followers,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id, platform" }
      )
      .select("id, profile_id, platform, handle, followers, is_connected, profile_url, updated_at")
      .single();

    if (error) {
      console.error("upsertSocialAccount database error:", error);
      return { ok: false, error: error.message };
    }

    revalidatePath("/dashboard/nil");
    return { ok: true, data: data as SocialAccount };
  } catch (err: unknown) {
    console.error("upsertSocialAccount unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function deleteSocialAccount(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("social_accounts")
      .delete()
      .eq("id", id)
      .eq("profile_id", user.id);

    if (error) {
      console.error("deleteSocialAccount database error:", error);
      return { ok: false, error: error.message };
    }

    revalidatePath("/dashboard/nil");
    return { ok: true };
  } catch (err: unknown) {
    console.error("deleteSocialAccount unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function disconnectSocialAccount(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("social_accounts")
      .update({
        access_token: null,
        is_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("profile_id", user.id);

    if (error) {
      console.error("disconnectSocialAccount database error:", error);
      return { ok: false, error: error.message };
    }

    revalidatePath("/dashboard/nil");
    return { ok: true };
  } catch (err: unknown) {
    console.error("disconnectSocialAccount unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function refreshSocialFollowers(id: string): Promise<{ ok: boolean; followers?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data: account, error: fetchError } = await supabase
      .from("social_accounts")
      .select("platform, access_token, platform_user_id")
      .eq("id", id)
      .eq("profile_id", user.id)
      .single();

    if (fetchError || !account) return { ok: false, error: "Account not found" };
    if (!account.access_token) return { ok: false, error: "Account not connected via OAuth" };

    let followers = 0;

    if (account.platform === "instagram") {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${account.platform_user_id}?fields=followers_count&access_token=${account.access_token}`
      );
      const data = await res.json();
      if (data.error) return { ok: false, error: "Instagram token expired — please reconnect" };
      followers = data.followers_count || 0;
    } else if (account.platform === "tiktok") {
      const res = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=follower_count",
        { headers: { Authorization: `Bearer ${account.access_token}` } }
      );
      const data = await res.json();
      if (data.error?.code !== "ok") return { ok: false, error: "TikTok token expired — please reconnect" };
      followers = data?.data?.user?.follower_count || 0;
    } else {
      return { ok: false, error: "Platform does not support auto-refresh" };
    }

    await supabase
      .from("social_accounts")
      .update({ followers, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("profile_id", user.id);

    revalidatePath("/dashboard/nil");
    return { ok: true, followers };
  } catch (err: unknown) {
    console.error("refreshSocialFollowers unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}
