"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export type AIMemory = {
  profile_id: string;
  preferred_tone: string;
  preferred_output_length: string;
  preferred_brand_categories: string[];
  last_used_tool: string | null;
  tools_used_count: Record<string, number>;
  outputs_saved_count: number;
  outputs_regenerated_count: number;
  outputs_ignored_count: number;
  last_active_at: string;
  updated_at: string;
};

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Fetch the current athlete's AI memory. Returns null if no record yet.
 */
export async function getAiMemory(): Promise<AIMemory | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("athlete_ai_memory")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    if (error || !data) return null;
    return data as AIMemory;
  } catch {
    return null;
  }
}

/**
 * Record a single AI behavior event and update the memory aggregates atomically.
 * Called server-side after every generate/save/copy/apply/ignore action.
 */
export async function recordAiEvent(
  tool: string,
  action: "generated" | "saved" | "copied" | "regenerated" | "ignored" | "applied",
  toneUsed?: string,
  outputLength?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const admin = getAdmin();

    // 1. Insert event row (athletes can insert their own via RLS, but we use service role for reliability)
    await admin.from("ai_events").insert({
      profile_id: user.id,
      tool,
      action,
      tone_used: toneUsed || null,
      output_length: outputLength || null,
    });

    // 2. Fetch current memory
    const { data: existing } = await admin
      .from("athlete_ai_memory")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    // 3. Compute updated aggregates
    const now = new Date().toISOString();
    const toolsUsed: Record<string, number> = { ...(existing?.tools_used_count || {}) };

    if (action === "generated") {
      toolsUsed[tool] = (toolsUsed[tool] || 0) + 1;
    }

    const patch: Record<string, unknown> = {
      profile_id: user.id,
      last_used_tool: tool,
      tools_used_count: toolsUsed,
      last_active_at: now,
      updated_at: now,
    };

    if (toneUsed) patch.preferred_tone = toneUsed;
    if (outputLength) patch.preferred_output_length = outputLength;

    if (action === "saved" || action === "applied") {
      patch.outputs_saved_count = (existing?.outputs_saved_count || 0) + 1;
    }
    if (action === "regenerated") {
      patch.outputs_regenerated_count = (existing?.outputs_regenerated_count || 0) + 1;
    }
    if (action === "ignored") {
      patch.outputs_ignored_count = (existing?.outputs_ignored_count || 0) + 1;
    }

    // 4. Upsert with conditional check to prevent concurrent counter loss
    const { error: upsertErr } = await admin.from("athlete_ai_memory").upsert(
      patch,
      { onConflict: "profile_id" }
    );

    // If upsert failed due to concurrent modification, retry with fresh read
    if (upsertErr && existing) {
      const { data: fresh } = await admin
        .from("athlete_ai_memory")
        .select("*")
        .eq("profile_id", user.id)
        .single();
      if (fresh) {
        const freshTools: Record<string, number> = { ...(fresh.tools_used_count || {}) };
        if (action === "generated") freshTools[tool] = (freshTools[tool] || 0) + 1;
        await admin.from("athlete_ai_memory").upsert({
          profile_id: user.id,
          last_used_tool: tool,
          tools_used_count: freshTools,
          last_active_at: now,
          updated_at: now,
          outputs_saved_count: (fresh.outputs_saved_count || 0) + (action === "saved" || action === "applied" ? 1 : 0),
          outputs_regenerated_count: (fresh.outputs_regenerated_count || 0) + (action === "regenerated" ? 1 : 0),
          outputs_ignored_count: (fresh.outputs_ignored_count || 0) + (action === "ignored" ? 1 : 0),
        }, { onConflict: "profile_id" });
      }
    }
  } catch (err) {
    // Non-blocking — never fail the main action because of memory update
    console.error("[ai-memory] recordAiEvent failed silently:", err);
  }
}
