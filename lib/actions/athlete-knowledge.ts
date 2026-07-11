"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { callGemini } from "@/lib/ai";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContentPerformanceEntry = {
  type: string;   // e.g. "bio", "caption", "pitch"
  label: string;  // human label, e.g. "Sponsor pitch"
  score: number;  // save rate or engagement proxy 0–100
};

export type GrowthTrendEntry = {
  week: string;       // ISO week start date
  direction: "up" | "flat" | "down";
  delta_followers: number;
  delta_views: number;
};

export type DealPreferences = {
  accepted: string[];   // brand categories accepted
  declined: string[];   // brand categories declined
  avg_response_hours: number;
};

export type AthleteKnowledge = {
  profile_id: string;
  brand_voice: string | null;
  content_themes: string[];
  best_performing_content: ContentPerformanceEntry[];
  deal_preferences: DealPreferences;
  growth_trends: GrowthTrendEntry[];
  recommended_actions: string[];
  last_learned_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LearningEvent = {
  tool: string;
  action: "saved" | "copied" | "applied" | "ignored" | "regenerated";
  context?: Record<string, unknown>;
};

// ── Admin client ──────────────────────────────────────────────────────────────

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── getAthleteKnowledge ───────────────────────────────────────────────────────

/**
 * Fetch current knowledge for the logged-in athlete. Returns null for new athletes.
 */
export async function getAthleteKnowledge(): Promise<AthleteKnowledge | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("athlete_knowledge")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    if (error || !data) return null;
    return data as AthleteKnowledge;
  } catch (err) {
    console.error("[athlete-knowledge] getAthleteKnowledge failed silently:", err);
    return null;
  }
}

// ── updateAthleteKnowledge ────────────────────────────────────────────────────

/**
 * Merge new learnings into existing knowledge (service-role upsert).
 * Partial patch — only provided keys are updated.
 */
export async function updateAthleteKnowledge(
  profileId: string,
  patch: Partial<Omit<AthleteKnowledge, "profile_id" | "created_at" | "updated_at">>
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== profileId) return;

    const admin = getAdmin();
    await admin.from("athlete_knowledge").upsert(
      {
        profile_id: profileId,
        ...patch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );
  } catch (err) {
    console.error("[athlete-knowledge] updateAthleteKnowledge failed silently:", err);
  }
}

// ── seedKnowledgeFromProfile ──────────────────────────────────────────────────

export async function seedKnowledgeFromProfile(profile: {
  id: string;
  full_name: string | null;
  sport: string | null;
  school: string | null;
  position: string | null;
  bio: string | null;
}): Promise<void> {
  try {
    const admin = getAdmin();
    const themes: string[] = [];
    if (profile.sport) themes.push(`${profile.sport} content`);
    if (profile.school) themes.push(`campus spotlight`);
    if (profile.bio && profile.bio.trim().length > 20) themes.push("personal branding");

    await admin.from("athlete_knowledge").upsert(
      {
        profile_id: profile.id,
        content_themes: themes.slice(0, 6),
        recommended_actions: [
          "Generate your first AI bio",
          "Add social accounts to grow discoverability",
          "Share your athlete card with your network",
          "Complete your profile stats and highlights",
        ].slice(0, 4),
        last_learned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );
  } catch (err) {
    console.error("[athlete-knowledge] seedKnowledgeFromProfile failed silently:", err);
  }
}

// ── recordLearningEvent ───────────────────────────────────────────────────────

/**
 * Fire-and-forget: log a single learning event and update knowledge aggregates.
 * Called alongside existing recordAiEvent() in lib/actions/ai.ts.
 */
export async function recordLearningEvent(event: LearningEvent): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const admin = getAdmin();

    // Fetch existing knowledge to update aggregates
    const { data: existing } = await admin
      .from("athlete_knowledge")
      .select("best_performing_content, content_themes, brand_voice")
      .eq("profile_id", user.id)
      .single();

    const bestPerforming: ContentPerformanceEntry[] =
      (existing?.best_performing_content as ContentPerformanceEntry[]) || [];

    // When an output is saved/applied — treat as a positive performance signal
    if (event.action === "saved" || event.action === "applied" || event.action === "copied") {
      const toolLabels: Record<string, string> = {
        bio: "Athlete Bio",
        pitch: "Sponsor Pitch",
        captions: "Social Caption",
        rate: "Rate Guidance",
        optimize: "Profile Optimizer",
      };

      const existing_entry = bestPerforming.find((e) => e.type === event.tool);
      if (existing_entry) {
        existing_entry.score = Math.min(100, existing_entry.score + 5);
      } else {
        bestPerforming.push({
          type: event.tool,
          label: toolLabels[event.tool] || event.tool,
          score: 60, // baseline when first saved
        });
      }

      // Keep only top 5 by score
      bestPerforming.sort((a, b) => b.score - a.score);
      const top5 = bestPerforming.slice(0, 5);

      // Derive content_themes from the tools being saved
      const themeMap: Record<string, string> = {
        bio: "personal branding",
        pitch: "sponsor outreach",
        captions: "social content",
        rate: "deal negotiation",
        optimize: "profile optimization",
      };
      const existingThemes: string[] = (existing?.content_themes as string[]) || [];
      const newTheme = themeMap[event.tool];
      const themes = newTheme && !existingThemes.includes(newTheme)
        ? [...existingThemes, newTheme].slice(0, 6)
        : existingThemes;

      await admin.from("athlete_knowledge").upsert(
        {
          profile_id: user.id,
          best_performing_content: top5,
          content_themes: themes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" }
      );
    }
  } catch (err) {
    // Non-blocking — never fail the main action
    console.error("[athlete-knowledge] recordLearningEvent failed silently:", err);
  }
}

// ── refreshAthleteKnowledge ───────────────────────────────────────────────────

/**
 * Lazy weekly refresh: summarizes recent ai_events, rebuilds recommended_actions.
 * Called from getNilValueBreakdown() when last_learned_at is >7 days old or null.
 */
export async function refreshAthleteKnowledge(profileId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== profileId) return;

    const admin = getAdmin();

    // Fetch last 30 days of ai_events for this athlete
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30);

    const { data: events } = await admin
      .from("ai_events")
      .select("tool, action, created_at")
      .eq("profile_id", profileId)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (!events || events.length === 0) {
      // Still update last_learned_at so we don't re-run for another 7 days
      await admin.from("athlete_knowledge").upsert(
        {
          profile_id: profileId,
          last_learned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" }
      );
      return;
    }

    // Tally tool usage
    const toolCounts: Record<string, number> = {};
    const toolSaves: Record<string, number> = {};
    for (const ev of events) {
      toolCounts[ev.tool] = (toolCounts[ev.tool] || 0) + 1;
      if (ev.action === "saved" || ev.action === "applied" || ev.action === "copied") {
        toolSaves[ev.tool] = (toolSaves[ev.tool] || 0) + 1;
      }
    }

    // Build recommended_actions based on what they're NOT doing
    const actions: string[] = [];
    const toolLabels: Record<string, string> = {
      bio: "bio generator",
      pitch: "sponsor pitch writer",
      captions: "caption generator",
      rate: "rate helper",
      optimize: "profile optimizer",
    };

    const unusedTools = Object.keys(toolLabels).filter((t) => !toolCounts[t]);
    for (const tool of unusedTools.slice(0, 2)) {
      actions.push(`Try the ${toolLabels[tool]} to build your NIL profile`);
    }

    const topTool = Object.entries(toolSaves).sort((a, b) => b[1] - a[1])[0];
    if (topTool) {
      actions.push(`Keep using the ${toolLabels[topTool[0]] || topTool[0]} — it's your best-performing tool`);
    }

    if (!toolCounts["pitch"]) {
      actions.push("Write your first sponsor pitch to start attracting brand deals");
    }
    if ((toolSaves["bio"] || 0) === 0 && toolCounts["bio"]) {
      actions.push("Refine your bio until you save one — brands read bios first");
    }

    // Always have at least one action
    if (actions.length === 0) {
      actions.push("Share your public card link to grow your NIL visibility");
    }

    await admin.from("athlete_knowledge").upsert(
      {
        profile_id: profileId,
        recommended_actions: actions.slice(0, 5),
        last_learned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );
  } catch (err) {
    console.error("[athlete-knowledge] refreshAthleteKnowledge failed silently:", err);
  }
}

// ── getNilValueBreakdown ──────────────────────────────────────────────────────

export type NilBreakdown = {
  marketPosition: string;   // 2-3 sentence positioning paragraph
  whatsWorking: string[];   // bullet list of 2-3 strengths
  thisWeeksFocus: string[];  // 3 action items from recommended_actions
  isPersonalized: boolean;  // false = fallback generic text
};

/**
 * Returns a personalized 3-section AI breakdown for the NIL page right column.
 * Lazily triggers a knowledge refresh if data is stale (>7 days).
 */
export async function getNilValueBreakdown(profileId: string): Promise<{
  ok: boolean;
  data?: NilBreakdown;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== profileId) return { ok: false, error: "Unauthorized" };

    const admin = getAdmin();

    // Check if knowledge refresh is needed (>7 days stale or never run)
    const { data: knowledge } = await admin
      .from("athlete_knowledge")
      .select("*")
      .eq("profile_id", profileId)
      .single();

    const isStale =
      !knowledge?.last_learned_at ||
      Date.now() - new Date(knowledge.last_learned_at).getTime() > 7 * 24 * 60 * 60 * 1000;

    if (isStale) {
      // Lazy refresh — non-blocking to the response, but we await it here
      // since it's fast (no AI call, just DB aggregation)
      await refreshAthleteKnowledge(profileId);
    }

    // Re-fetch after possible refresh
    const { data: freshKnowledge } = await admin
      .from("athlete_knowledge")
      .select("*")
      .eq("profile_id", profileId)
      .single();

    // Fetch latest NIL metrics
    const { data: metrics } = await admin
      .from("nil_value_metrics")
      .select("nil_score, card_views, link_clicks, followers_total, engagement_rate, computed_at")
      .eq("profile_id", profileId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .single();

    // Fetch profile
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, sport, school, position")
      .eq("id", profileId)
      .single();

    // Determine if we have enough data for personalized breakdown
    const hasKnowledge = freshKnowledge && (
      (freshKnowledge.content_themes as string[])?.length > 0 ||
      (freshKnowledge.best_performing_content as ContentPerformanceEntry[])?.length > 0 ||
      (freshKnowledge.recommended_actions as string[])?.length > 0
    );
    const hasMetrics = !!metrics;

    if (!hasKnowledge && !hasMetrics) {
      // Generic fallback — no data yet
      return {
        ok: true,
        data: {
          marketPosition:
            "Sharing your card and posting consistently builds your AI profile. Check back after 7 days.",
          whatsWorking: [],
          thisWeeksFocus: [
            "Complete your profile with sport, school, and position",
            "Add at least one social account to establish your audience size",
            "Share your public card link with your network",
          ],
          isPersonalized: false,
        },
      };
    }

    // Build knowledge context for prompt
    const knowledgeCtx = freshKnowledge as AthleteKnowledge | null;
    const topContent = ((knowledgeCtx?.best_performing_content as ContentPerformanceEntry[]) || [])
      .slice(0, 3)
      .map((c) => c.label)
      .join(", ");
    const themes = (knowledgeCtx?.content_themes || []).slice(0, 3).join(", ");
    const actions = (knowledgeCtx?.recommended_actions || []).slice(0, 3).join("; ");

    const nilScore = metrics?.nil_score ?? 0;
    const followers = metrics?.followers_total ?? 0;
    const cardViews = metrics?.card_views ?? 0;

    const safe = (s: string | null | undefined) => (s || "N/A").replace(/[\n\r]/g, " ").slice(0, 200);

    const prompt = `You are a senior NIL advisor. Write a concise, personalized AI Market Breakdown for this athlete.

Athlete Profile:
- Name: ${safe(profile?.full_name)}
- Sport: ${safe(profile?.sport)}
- School: ${safe(profile?.school)}
- NIL Score: ${nilScore}/100
- Social Followers: ${followers.toLocaleString()}
- Card Views (30d): ${cardViews}
${themes ? `- Content Themes: ${safe(themes)}` : ""}
${topContent ? `- Best Performing Tools: ${safe(topContent)}` : ""}
${actions ? `- Known Focus Areas: ${safe(actions)}` : ""}

Write exactly 3 sections using these EXACT labels:

MARKET POSITION: [2-3 sentences placing them in the NIL market relative to their score tier and sport. Be specific and encouraging.]

WHATS WORKING:
- [strength 1]
- [strength 2]
- [strength 3 if applicable]

THIS WEEKS FOCUS:
- [action 1 — specific and tactical]
- [action 2 — specific and tactical]
- [action 3 — specific and tactical]

Return only these 3 sections. No preamble. No markdown formatting.`;

    const systemPrompt =
      "You are a concise, data-driven NIL advisor for college athletes. Be specific, realistic, and encouraging. Never use filler phrases like 'great job' or 'keep it up'.";

    const raw = await callGemini(prompt, systemPrompt, 600, 2, 2000);

    // Parse structured sections from AI output
    const marketMatch = raw.match(/MARKET POSITION:\s*([\s\S]+?)(?=\nWHATS WORKING:|$)/i);
    const workingMatch = raw.match(/WHATS WORKING:\s*([\s\S]+?)(?=\nTHIS WEEKS FOCUS:|$)/i);
    const focusMatch = raw.match(/THIS WEEKS FOCUS:\s*([\s\S]+?)$/i);

    const parseList = (text: string | undefined): string[] =>
      (text || "")
        .split("\n")
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .filter((l) => l.length > 0);

    const whatsWorking = parseList(workingMatch?.[1]);
    const thisWeeksFocus = parseList(focusMatch?.[1]);

    // If AI parse fails, fall back gracefully
    const breakdown: NilBreakdown = {
      marketPosition:
        marketMatch?.[1]?.trim() ||
        `With a NIL Score of ${nilScore}/100, you're building a solid foundation. Focus on growing your digital presence and completing your AthleteOS profile.`,
      whatsWorking:
        whatsWorking.length > 0
          ? whatsWorking
          : topContent
          ? topContent.split(", ")
          : ["Profile visibility", "Platform engagement"],
      thisWeeksFocus:
        thisWeeksFocus.length > 0
          ? thisWeeksFocus
          : (knowledgeCtx?.recommended_actions || []).slice(0, 3).length > 0
          ? (knowledgeCtx?.recommended_actions || []).slice(0, 3)
          : ["Complete your bio", "Add social account follower counts", "Share your public card"],
      isPersonalized: true,
    };

    return { ok: true, data: breakdown };
  } catch (err) {
    console.error("[athlete-knowledge] getNilValueBreakdown error:", err);
    // Graceful fallback — never crash the NIL page
    return {
      ok: true,
      data: {
        marketPosition:
          "Sharing your card and posting consistently builds your AI profile. Check back after 7 days.",
        whatsWorking: [],
        thisWeeksFocus: [
          "Complete your profile with sport, school, and position",
          "Add at least one social account",
          "Share your public card link",
        ],
        isPersonalized: false,
      },
    };
  }
}
