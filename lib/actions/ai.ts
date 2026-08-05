"use server";

import { z } from "zod";
import {
  generateBioVariations,
  generateSponsorPitch,
  generateCaptions,
  optimizeProfile,
  generateRateGuidance,
  streamBioVariations,
  streamSponsorPitch,
  streamCaptions,
  type AIMemoryContext,
} from "@/lib/ai";
import { getAiQuota, recordAiUsage } from "@/lib/actions/ai-usage";
import { getMyProfile } from "@/lib/actions/profile";
import { getAiMemory } from "@/lib/actions/ai-memory";
import { recordLearningEvent, getAthleteKnowledge } from "@/lib/actions/athlete-knowledge";

// ── Enriched memory context (memory + knowledge in parallel) ─────────────────

async function getEnrichedMemoryContext(): Promise<import("@/lib/ai").AIMemoryContext | undefined> {
  const [memory, knowledge] = await Promise.all([getAiMemory(), getAthleteKnowledge()]);

  return {
    preferred_tone: memory?.preferred_tone || "confident",
    preferred_output_length: memory?.preferred_output_length || "medium",
    tools_used_count: memory?.tools_used_count || {},
    outputs_saved_count: memory?.outputs_saved_count || 0,
    outputs_regenerated_count: memory?.outputs_regenerated_count || 0,
    outputs_ignored_count: memory?.outputs_ignored_count || 0,
    last_used_tool: memory?.last_used_tool || null,
    athleteKnowledge: knowledge
      ? {
          content_themes: knowledge.content_themes,
          best_performing_content: knowledge.best_performing_content,
          growth_trends: knowledge.growth_trends as { direction: string }[],
          recommended_actions: knowledge.recommended_actions,
          brand_voice: knowledge.brand_voice,
        }
      : null,
  };
}


export type AiResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
  quota?: { used: number; limit: number; remaining: number; plan: string };
};

async function checkQuota(): Promise<
  | { allowed: true; quota: { used: number; limit: number; remaining: number; plan: string } }
  | { allowed: false; quota: { used: number; limit: number; remaining: number; plan: string }; error: string }
> {
  const quota = await getAiQuota();
  if (quota.used >= quota.limit) {
    const upgradeMsg =
      quota.plan === "free"
        ? "You've used all your free AI actions this month. Upgrade to Pro for unlimited."
        : "You've used all your AI actions this month.";
    return { allowed: false, quota, error: upgradeMsg };
  }
  return { allowed: true, quota };
}

// ── Event recording helpers — called from client components ──────────────────

export async function recordToolEvent(): Promise<void> {
  // Deprecated stub per ADR-046
}

// ── Bio Generator ─────────────────────────────────────────────────────────────

const GenerateBiosSchema = z.object({
  sport: z.string().min(1).max(50),
  school: z.string().min(1).max(100),
  position: z.string().min(1).max(50),
  tone: z.enum(["confident", "humble", "energetic", "storyteller"]),
  existingBio: z.string().max(280).nullable().optional(),
});

export async function generateBios(formData: {
  sport: string;
  school: string;
  position: string;
  tone: string;
  existingBio?: string | null;
}): Promise<AiResult<string[]>> {
  const parsed = GenerateBiosSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const check = await checkQuota();
  if (!check.allowed) return { ok: false, error: check.error, quota: check.quota };

  const memoryContext = await getEnrichedMemoryContext();

  try {
    const bios = await generateBioVariations({
      sport: parsed.data.sport,
      school: parsed.data.school,
      position: parsed.data.position,
      tone: parsed.data.tone,
      existingBio: parsed.data.existingBio,
      memoryContext,
    });

    await recordAiUsage("bio_generator");

    const updatedQuota = await getAiQuota();
    return { ok: true, data: bios, quota: updatedQuota };
  } catch (error) {
    console.error("AI generation failed:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: msg || "AI generation failed. Please try again in a moment." };
  }
}

// ── Pitch Writer ──────────────────────────────────────────────────────────────

const GeneratePitchSchema = z.object({
  brandName: z.string().min(1).max(100),
  sport: z.string().min(1).max(50),
  school: z.string().min(1).max(100),
  position: z.string().min(1).max(50),
  audienceSize: z.string().min(1).max(50),
  engagementRate: z.string().min(1).max(50),
  athleteBio: z.string().max(280).nullable().optional(),
  goal: z.string().min(1).max(200),
});

export async function generatePitch(formData: {
  brandName: string;
  sport: string;
  school: string;
  position: string;
  audienceSize: string;
  engagementRate: string;
  athleteBio?: string | null;
  goal: string;
}): Promise<AiResult<string[]>> {
  const parsed = GeneratePitchSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const check = await checkQuota();
  if (!check.allowed) return { ok: false, error: check.error, quota: check.quota };

  const memoryContext = await getEnrichedMemoryContext();

  try {
    const pitches = await generateSponsorPitch({
      brandName: parsed.data.brandName,
      sport: parsed.data.sport,
      school: parsed.data.school,
      position: parsed.data.position,
      audienceSize: parsed.data.audienceSize,
      engagementRate: parsed.data.engagementRate,
      athleteBio: parsed.data.athleteBio || "",
      goal: parsed.data.goal,
      memoryContext,
    });

    await recordAiUsage("pitch_writer");

    const updatedQuota = await getAiQuota();
    return { ok: true, data: pitches, quota: updatedQuota };
  } catch (error) {
    console.error("AI generation failed:", error);
    return { ok: false, error: "AI generation failed. Please try again in a moment." };
  }
}

// ── Caption Generator ─────────────────────────────────────────────────────────

const GenerateCaptionsSchema = z.object({
  context: z.enum(["win", "sponsorship", "training", "milestone", "personal"]),
  sport: z.string().min(1).max(50),
  school: z.string().min(1).max(100),
  tone: z.enum(["confident", "humble", "energetic", "storyteller"]),
  athleteBio: z.string().max(280).nullable().optional(),
});

export async function generateCaptionsAction(formData: {
  context: string;
  sport: string;
  school: string;
  tone: string;
  athleteBio?: string | null;
}): Promise<AiResult<string[]>> {
  const parsed = GenerateCaptionsSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const check = await checkQuota();
  if (!check.allowed) return { ok: false, error: check.error, quota: check.quota };

  const memoryContext = await getEnrichedMemoryContext();

  try {
    const captions = await generateCaptions({
      context: parsed.data.context,
      sport: parsed.data.sport,
      school: parsed.data.school,
      tone: parsed.data.tone,
      athleteBio: parsed.data.athleteBio || "",
      memoryContext,
    });

    await recordAiUsage("caption_generator");

    const updatedQuota = await getAiQuota();
    return { ok: true, data: captions, quota: updatedQuota };
  } catch (error) {
    console.error("AI generation failed:", error);
    return { ok: false, error: "AI generation failed. Please try again in a moment." };
  }
}

// ── Profile Optimizer ─────────────────────────────────────────────────────────

export async function optimizeProfileAction(): Promise<
  AiResult<{ critique: string; optimizedBio: string; suggestions: string[] }>
> {
  const check = await checkQuota();
  if (!check.allowed) return { ok: false, error: check.error, quota: check.quota };

  const profileResult = await getMyProfile();
  if (!profileResult.ok || !profileResult.data) {
    return { ok: false, error: "Could not load your profile." };
  }

  const p = profileResult.data;
  const memoryContext = await getEnrichedMemoryContext();

  try {
    const result = await optimizeProfile({
      fullName: p.full_name || "",
      sport: p.sport || "",
      school: p.school || "",
      position: p.position || "",
      bio: p.bio || "",
      stats: p.stats || [],
      links: p.links || [],
      highlights: p.highlights || [],
      memoryContext,
    });

    await recordAiUsage("profile_optimizer");

    const updatedQuota = await getAiQuota();
    return { ok: true, data: result, quota: updatedQuota };
  } catch (error) {
    console.error("AI generation failed:", error);
    return { ok: false, error: "AI generation failed. Please try again in a moment." };
  }
}

// ── Rate Helper ───────────────────────────────────────────────────────────────

const GenerateRateSchema = z.object({
  sport: z.string().min(1).max(50),
  school: z.string().min(1).max(100),
  position: z.string().min(1).max(50),
  audienceSize: z.string().min(1).max(50),
  engagementRate: z.string().min(1).max(50),
  niche: z.string().max(100).optional(),
  pastDeals: z.string().max(200).nullable().optional(),
});

export async function generateRateGuidanceAction(formData: {
  sport: string;
  school: string;
  position: string;
  audienceSize: string;
  engagementRate: string;
  niche?: string;
  pastDeals?: string | null;
}): Promise<AiResult<string>> {
  const parsed = GenerateRateSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const check = await checkQuota();
  if (!check.allowed) return { ok: false, error: check.error, quota: check.quota };

  const memoryContext = await getEnrichedMemoryContext();

  try {
    const guidance = await generateRateGuidance({
      sport: parsed.data.sport,
      school: parsed.data.school,
      position: parsed.data.position,
      audienceSize: parsed.data.audienceSize,
      engagementRate: parsed.data.engagementRate,
      niche: parsed.data.niche || "",
      pastDeals: parsed.data.pastDeals || "",
      memoryContext,
    });

    await recordAiUsage("rate_helper");

    const updatedQuota = await getAiQuota();
    return { ok: true, data: guidance, quota: updatedQuota };
  } catch (error) {
    console.error("AI generation failed:", error);
    return { ok: false, error: "AI generation failed. Please try again in a moment." };
  }
}

// ── Streaming variants ────────────────────────────────────────────────────────

const GenerateBiosStreamSchema = z.object({
  sport: z.string().min(1).max(50),
  school: z.string().min(1).max(100),
  position: z.string().min(1).max(50),
  tone: z.enum(["confident", "humble", "energetic", "storyteller"]),
  existingBio: z.string().max(280).nullable().optional(),
});

export async function generateBiosStream(formData: {
  sport: string;
  school: string;
  position: string;
  tone: string;
  existingBio?: string | null;
}): Promise<AiResult<ReadableStream<string>>> {
  const parsed = GenerateBiosStreamSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const check = await checkQuota();
  if (!check.allowed) return { ok: false, error: check.error, quota: check.quota };

  try {
    const memoryContext = await getEnrichedMemoryContext();

    const stream = await streamBioVariations({
      sport: parsed.data.sport,
      school: parsed.data.school,
      position: parsed.data.position,
      tone: parsed.data.tone,
      existingBio: parsed.data.existingBio,
      memoryContext,
    });

    await recordAiUsage("bio_generator");

    const updatedQuota = await getAiQuota();
    return { ok: true, data: stream, quota: updatedQuota };
  } catch (error) {
    console.error("AI streaming generation failed:", error);
    return { ok: false, error: "AI generation failed. Please try again in a moment." };
  }
}

const GeneratePitchStreamSchema = z.object({
  brandName: z.string().min(1).max(100),
  audienceSize: z.string().min(1).max(50),
  engagementRate: z.string().min(1).max(20),
  goal: z.string().min(1).max(200),
});

export async function generatePitchStream(formData: {
  brandName: string;
  audienceSize: string;
  engagementRate: string;
  goal: string;
}): Promise<AiResult<ReadableStream<string>>> {
  const parsed = GeneratePitchStreamSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const check = await checkQuota();
  if (!check.allowed) return { ok: false, error: check.error, quota: check.quota };

  try {
    const profile = await getMyProfile();
    const memoryContext = await getEnrichedMemoryContext();

    const stream = await streamSponsorPitch({
      brandName: parsed.data.brandName,
      sport: profile.data?.sport || "",
      school: profile.data?.school || "",
      position: profile.data?.position || "",
      audienceSize: parsed.data.audienceSize,
      engagementRate: parsed.data.engagementRate,
      athleteBio: profile.data?.bio || "",
      goal: parsed.data.goal,
      memoryContext,
    });

    await recordAiUsage("pitch_writer");

    const updatedQuota = await getAiQuota();
    return { ok: true, data: stream, quota: updatedQuota };
  } catch (error) {
    console.error("AI streaming generation failed:", error);
    return { ok: false, error: "AI generation failed. Please try again in a moment." };
  }
}

const GenerateCaptionsStreamSchema = z.object({
  context: z.enum(["win", "sponsorship", "training", "milestone", "personal"]),
  tone: z.enum(["confident", "humble", "energetic", "storyteller"]),
});

export async function generateCaptionsStream(formData: {
  context: string;
  tone: string;
}): Promise<AiResult<ReadableStream<string>>> {
  const parsed = GenerateCaptionsStreamSchema.safeParse(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const check = await checkQuota();
  if (!check.allowed) return { ok: false, error: check.error, quota: check.quota };

  try {
    const profile = await getMyProfile();
    const memoryContext = await getEnrichedMemoryContext();

    const stream = await streamCaptions({
      context: parsed.data.context,
      sport: profile.data?.sport || "",
      school: profile.data?.school || "",
      tone: parsed.data.tone,
      athleteBio: profile.data?.bio || "",
      memoryContext,
    });

    await recordAiUsage("caption_generator");

    const updatedQuota = await getAiQuota();
    return { ok: true, data: stream, quota: updatedQuota };
  } catch (error) {
    console.error("AI streaming generation failed:", error);
    return { ok: false, error: "AI generation failed. Please try again in a moment." };
  }
}
