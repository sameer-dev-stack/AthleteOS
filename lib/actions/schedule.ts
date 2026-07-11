"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ScheduledPost = {
  id: string;
  user_id: string;
  platform: string;
  content: string;
  media_url: string | null;
  scheduled_at: string;
  status: string;
  hashtags: string[];
  created_at: string;
  updated_at: string;
};

const CreatePostSchema = z.object({
  platform: z.enum(["instagram", "tiktok", "twitter", "youtube", "other"]),
  content: z.string().min(1, "Content is required").max(2200, "Content is too long"),
  media_url: z.string().url("Invalid URL").optional().nullable(),
  scheduled_at: z.string().refine((val) => new Date(val) > new Date(), "Schedule time must be in the future"),
  hashtags: z.array(z.string()).optional(),
  status: z.enum(["draft", "queued"]).default("queued"),
});

export async function schedulePost(
  platform: string,
  content: string,
  scheduledAt: string,
  mediaUrl?: string | null,
  hashtags?: string[]
): Promise<{ ok: boolean; data?: ScheduledPost; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const parsed = CreatePostSchema.safeParse({
      platform,
      content,
      media_url: mediaUrl,
      scheduled_at: scheduledAt,
      hashtags,
      status: "queued",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
    }

    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({
        user_id: user.id,
        platform: parsed.data.platform,
        content: parsed.data.content,
        media_url: parsed.data.media_url,
        scheduled_at: parsed.data.scheduled_at,
        status: parsed.data.status,
        hashtags: parsed.data.hashtags || [],
      })
      .select()
      .single();

    if (error) {
      console.error("schedulePost database error:", error);
      return { ok: false, error: error.message };
    }

    revalidatePath("/dashboard/schedule");
    return { ok: true, data: data as ScheduledPost };
  } catch (err: unknown) {
    console.error("schedulePost unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function getScheduledPosts(
  status?: string
): Promise<{ ok: boolean; data?: ScheduledPost[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    let query = supabase
      .from("scheduled_posts")
      .select()
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("getScheduledPosts database error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data as ScheduledPost[] };
  } catch (err: unknown) {
    console.error("getScheduledPosts unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function deleteScheduledPost(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("scheduled_posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("deleteScheduledPost database error:", error);
      return { ok: false, error: error.message };
    }

    revalidatePath("/dashboard/schedule");
    return { ok: true };
  } catch (err: unknown) {
    console.error("deleteScheduledPost unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

export async function updateScheduledPostStatus(
  id: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    if (!["draft", "queued", "cancelled"].includes(status)) {
      return { ok: false, error: "Invalid status" };
    }

    const { error } = await supabase
      .from("scheduled_posts")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("updateScheduledPostStatus database error:", error);
      return { ok: false, error: error.message };
    }

    revalidatePath("/dashboard/schedule");
    return { ok: true };
  } catch (err: unknown) {
    console.error("updateScheduledPostStatus unexpected error:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}
