"use server";

import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/actions/profile";
import { getAiQuota, recordAiUsage } from "@/lib/actions/ai-usage";
import { getAiMemory, recordAiEvent } from "@/lib/actions/ai-memory";
import { callGemini } from "@/lib/ai";

export type QuickAiResult = {
  ok: boolean;
  data?: string;
  error?: string;
  quota?: { used: number; limit: number; remaining: number; plan: string };
};

export async function quickAiAction(signal: string): Promise<QuickAiResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const quota = await getAiQuota();
    if (quota.used >= quota.limit) {
      const msg = quota.plan === "free"
        ? "You've used all your free AI actions this month. Upgrade to Pro for unlimited."
        : "You've used all your AI actions this month.";
      return { ok: false, error: msg, quota };
    }

    const profileRes = await getMyProfile();
    if (!profileRes.ok || !profileRes.data) {
      return { ok: false, error: "Failed to load athlete profile." };
    }
    const profile = profileRes.data;

    // Fetch memory
    const memory = await getAiMemory();
    const memoryInstructions = memory
      ? `Preferred tone: ${memory.preferred_tone}. Output length preference: ${memory.preferred_output_length}.`
      : "Tone: confident.";

    let prompt = "";
    let systemPrompt = "";
    let maxTokens = 600;
    let toolType = "quick_action";

    const safe = (s: string | null | undefined) => (s || "N/A").replace(/[\n\r]/g, " ").slice(0, 200);

    // Build the contextual prompts based on signals
    if (signal === "dropped_views") {
      toolType = "captions";
      systemPrompt = "You are a social media growth strategist for athletes.";
      prompt = `Your card views have dropped recently. Let's write an authentic, high-engagement re-engagement post.
Athlete: ${safe(profile.full_name)} (Sport: ${safe(profile.sport)}, School: ${safe(profile.school)}).
AI memory settings: ${memoryInstructions}
Write exactly one scroll-stopping, authentic caption (1-3 sentences) with 3-5 tags to get fans back to your profile. Do not include labels or intro.`;
    } else if (signal === "score_up") {
      toolType = "pitch";
      maxTokens = 800;
      systemPrompt = "You are an expert sports agent writing high-converting brand pitches.";
      prompt = `Congratulations! Your NIL Value Score recently went up. Let's write a compelling brand outreach pitch to pitch a sponsor.
Athlete: ${safe(profile.full_name)} (Sport: ${safe(profile.sport)}, School: ${safe(profile.school)}).
AI memory settings: ${memoryInstructions}
Write a short, professional brand pitch (Subject line + 3 concise paragraphs) that highlights this positive momentum. Mention sport and school. Do not include labels or extra text.`;
    } else if (signal === "low_tips") {
      toolType = "captions";
      systemPrompt = "You are a fan engagement copywriter.";
      prompt = `You haven't received many tips or fan contributions lately. Write an engaging post celebrating fans and reminding them they can support you directly on your athlete card.
Athlete: ${safe(profile.full_name)} (Sport: ${safe(profile.sport)}, School: ${safe(profile.school)}).
AI memory settings: ${memoryInstructions}
Write exactly one caption (1-3 sentences) with 3 tags. Make it humble, authentic, and appreciative. Do not include labels or intro.`;
    } else if (signal === "optimize_bio") {
      toolType = "optimize";
      systemPrompt = "You are an expert bio writer for athlete profiles.";
      prompt = `Your profile bio needs some optimization. Let's rewrite it to be brand-ready and clean.
Athlete: ${safe(profile.full_name)} (Sport: ${safe(profile.sport)}, School: ${safe(profile.school)}, Position: ${safe(profile.position)}).
Current bio: "${safe(profile.bio)}"
AI memory settings: ${memoryInstructions}
Write one single optimized bio under 280 characters. No titles, no quotes. Just the raw bio text.`;
    } else {
      // Baseline quick caption
      toolType = "captions";
      systemPrompt = "You are a creative caption writer.";
      prompt = `Write a quick, energetic caption for a student-athlete sharing behind-the-scenes updates.
Athlete: ${safe(profile.full_name)} (Sport: ${safe(profile.sport)}).
AI memory settings: ${memoryInstructions}
Write exactly one quick caption (1-2 sentences) with 2 tags. Do not include labels.`;
    }

    // Call MiMo
    const data = await callGemini(prompt, systemPrompt, maxTokens);

    // Record usage and event
    await Promise.all([
      recordAiUsage("quick_action"),
      recordAiEvent(toolType, "generated", memory?.preferred_tone || "confident", "medium"),
    ]);

    const updatedQuota = await getAiQuota();
    return { ok: true, data, quota: updatedQuota };
  } catch (err: unknown) {
    console.error("quickAiAction error:", err);
    const message = err instanceof Error ? err.message : "Action failed.";
    return { ok: false, error: message };
  }
}
