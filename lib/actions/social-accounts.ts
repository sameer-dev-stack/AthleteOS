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
  engagement_rate: number;
  average_likes: number;
  average_comments: number;
  average_views: number;
  average_shares: number;
  total_engagements: number;
  verification_status: string | null;
  last_scraped_at: string | null;
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
      .select(
        "id, profile_id, platform, handle, followers, engagement_rate, average_likes, average_comments, average_views, average_shares, total_engagements, verification_status, last_scraped_at, updated_at"
      )
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
      .select("id, profile_id, platform, handle, followers, verification_status, updated_at")
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
        verification_status: null,
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

export async function queueSocialScrape(
  platform: "instagram" | "tiktok",
  handle: string
): Promise<{ ok: boolean; status?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const APIFY_API_KEY = process.env.APIFY_API_KEY;
    if (!APIFY_API_KEY) {
      throw new Error("Missing APIFY_API_KEY in server environment variables.");
    }

    const cleanHandle = handle.trim().replace(/^@/, "");
    if (!cleanHandle) return { ok: false, error: "Invalid username handle" };

    // Insert / update a PENDING row immediately so the UI can show the pending state
    const { error: upsertErr } = await supabase
      .from("social_accounts")
      .upsert(
        {
          profile_id: user.id,
          platform,
          handle: `@${cleanHandle}`,
          verification_status: "PENDING",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id, platform" }
      );

    if (upsertErr) {
      return { ok: false, error: upsertErr.message };
    }

    const actorId =
      platform === "instagram"
        ? "apify~instagram-scraper"
        : "clockworks~tiktok-profile-scraper";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
    const isLocal = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");

    const body: Record<string, unknown> =
      platform === "instagram"
        ? { usernames: [cleanHandle], resultsLimit: 12 }
        : {
            profiles: [cleanHandle],
            resultsPerPage: 12,
            profileScrapeSections: ["videos"],
            proxyConfiguration: {
              useApifyProxy: true,
              apifyProxyGroups: ["RESIDENTIAL"],
            },
          };

    if (isLocal) {
      // Dev fallback: process a mock synchronous payload inline to support disconnected local debugging.
      // Production always uses the async webhook path below.
      const mockItems = [
        {
          owner: {
            followersCount: 15400,
            isPrivate: false,
            fullName: "Local Test Athlete",
            profilePicUrl: null,
          },
          authorMeta: {
            fans: 15400,
            private: false,
            nickName: "Local Test Athlete",
            avatar: null,
          },
          likesCount: 350,
          commentsCount: 25,
          stats: {
            diggCount: 400,
            commentCount: 30,
            shareCount: 15,
            playCount: 5000,
          },
        },
      ];

      const { processApifyDataset } = await import("@/lib/apify-processor");
      await processApifyDataset(platform, cleanHandle, user.id, mockItems);
      revalidatePath("/dashboard/nil");
      return { ok: true, status: "VERIFIED" };
    }

    // Production: non-blocking actor run with webhook callback
    const webhookUrl = `${appUrl}/api/webhooks/apify?platform=${platform}&handle=${encodeURIComponent(cleanHandle)}&userId=${user.id}`;

    const webhooks = encodeURIComponent(
      JSON.stringify([
        {
          eventTypes: ["ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED"],
          requestUrl: webhookUrl,
        },
      ])
    );

    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}&webhooks=${webhooks}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!runRes.ok) {
      const errText = await runRes.text();
      console.error("[queueSocialScrape] Apify actor run failed:", errText);
      await supabase
        .from("social_accounts")
        .update({ verification_status: "ERROR" })
        .eq("profile_id", user.id)
        .eq("platform", platform);
      return { ok: false, error: "Failed to start verification task" };
    }

    revalidatePath("/dashboard/nil");
    return { ok: true, status: "QUEUED" };
  } catch (err: unknown) {
    console.error("queueSocialScrape unexpected error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
