"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { callGemini } from "@/lib/ai";
import { getAiQuota, recordAiUsage } from "@/lib/actions/ai-usage";
import { getMyProfile } from "@/lib/actions/profile";
import { getAiMemory, recordAiEvent } from "@/lib/actions/ai-memory";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContentResult = {
  ok: boolean;
  data?: string;
  error?: string;
  quota?: { used: number; limit: number; remaining: number; plan: string };
};

export type ContentHistoryItem = {
  id: string;
  content_type: string;
  prompt: string;
  generated_content: string;
  created_at: string;
};

export type ContentHistoryResult = {
  ok: boolean;
  data?: ContentHistoryItem[];
  error?: string;
};

export type DeleteContentResult = {
  ok: boolean;
  error?: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTENT_TYPES = {
  bio: {
    systemPrompt:
      "You are an expert bio writer for athlete profiles. Write concise, compelling bios optimized for NIL marketing.",
    maxTokens: 400,
  },
  caption: {
    systemPrompt:
      "You are a social media strategist who writes viral captions for student-athletes. You understand platform algorithms, Gen Z voice, and NIL marketing.",
    maxTokens: 600,
  },
  pitch: {
    systemPrompt:
      "You are a sports marketing specialist who writes compelling NIL sponsor outreach pitches. Be professional but authentic.",
    maxTokens: 1200,
  },
  thank_you: {
    systemPrompt:
      "You are a gracious athlete writing a heartfelt thank-you message to a sponsor, fan, or supporter. Be genuine and personal.",
    maxTokens: 500,
  },
} as const;

export type ContentType = keyof typeof CONTENT_TYPES;

// ── Schema ────────────────────────────────────────────────────────────────────

const GenerateContentSchema = z.object({
  contentType: z.enum(["bio", "caption", "pitch", "thank_you"]),
  prompt: z.string().min(5).max(1000),
});

// ── Server Actions ────────────────────────────────────────────────────────────

export async function generateContent(formData: {
  contentType: string;
  prompt: string;
}): Promise<ContentResult> {
  const parsed = GenerateContentSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const quota = await getAiQuota();
  if (quota.used >= quota.limit) {
    const msg =
      quota.plan === "free"
        ? "You've used all your free AI actions this month. Upgrade to Pro for unlimited."
        : "You've used all your AI actions this month.";
    return { ok: false, error: msg, quota };
  }

  const profileRes = await getMyProfile();
  const profile = profileRes.ok ? profileRes.data : null;

  const memory = await getAiMemory();
  const memoryInstructions = memory
    ? `Preferred tone: ${memory.preferred_tone}. Output length preference: ${memory.preferred_output_length}.`
    : "Tone: confident.";

  const config = CONTENT_TYPES[parsed.data.contentType];

  const safe = (s: string | null | undefined) =>
    (s || "N/A").replace(/[\n\r]/g, " ").slice(0, 200);

  const profileContext = profile
    ? `Athlete: ${safe(profile.full_name)} (Sport: ${safe(profile.sport)}, School: ${safe(profile.school)}, Position: ${safe(profile.position)}).`
    : "";

  const prompt = `Generate a ${parsed.data.contentType.replace("_", " ")} based on this request:

${parsed.data.prompt}

${profileContext}
AI memory settings: ${memoryInstructions}

Write the output directly. No labels, no intro text, no quotation marks around the entire output. Just the raw content.`;

  try {
    const data = await callGemini(prompt, config.systemPrompt, config.maxTokens);

    await Promise.all([
      recordAiUsage("content_generator"),
      recordAiEvent("content", "generated", memory?.preferred_tone || "confident", "medium"),
    ]);

    // Persist to ai_content_history table
    await supabase.from("ai_content_history").insert({
      user_id: user.id,
      content_type: parsed.data.contentType,
      prompt: parsed.data.prompt,
      generated_content: data,
    });

    const updatedQuota = await getAiQuota();
    return { ok: true, data, quota: updatedQuota };
  } catch (err: unknown) {
    console.error("generateContent error:", err);
    const message = err instanceof Error ? err.message : "AI generation failed.";
    return { ok: false, error: message };
  }
}

export async function getContentHistory(): Promise<ContentHistoryResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("ai_content_history")
      .select("id, content_type, prompt, generated_content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("getContentHistory error:", error);
      return { ok: false, error: "Failed to load history." };
    }

    return { ok: true, data: data as ContentHistoryItem[] };
  } catch (err: unknown) {
    console.error("getContentHistory error:", err);
    return { ok: false, error: "Failed to load history." };
  }
}

export async function deleteContent(id: string): Promise<DeleteContentResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("ai_content_history")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("deleteContent error:", error);
      return { ok: false, error: "Failed to delete content." };
    }

    return { ok: true };
  } catch (err: unknown) {
    console.error("deleteContent error:", err);
    return { ok: false, error: "Failed to delete content." };
  }
}
