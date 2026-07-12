"use server";

import { getEffectivePlan } from "@/lib/actions/plan";
import type { EffectivePlan } from "@/lib/actions/plan";

export type Plan = EffectivePlan;

const QUOTA_CONFIG = {
  free: { total: 5 },
  pro: { total: 300 },
  elite: { total: 500 },
} as const;

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function getPlan(): Promise<Plan> {
  return getEffectivePlan();
}

export async function getAiQuota(): Promise<{
  used: number;
  limit: number;
  remaining: number;
  plan: Plan;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { used: 0, limit: 0, remaining: 0, plan: "free" };

    const plan = await getPlan(supabase);
    const periodStart = getCurrentPeriod();

    const { data } = await supabase
      .from("ai_usage")
      .select("used_count")
      .eq("user_id", user.id)
      .eq("tool", "all")
      .eq("period_start", periodStart)
      .single();

    const used = data?.used_count || 0;
    const limit = QUOTA_CONFIG[plan].total;
    const remaining = Math.max(0, limit - used);

    return { used, limit, remaining, plan };
  } catch (err) {
    console.error("[ai-usage] getAiQuota error:", err);
    return { used: 0, limit: 5, remaining: 5, plan: "free" };
  }
}

export async function recordAiUsage(
  tool: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const periodStart = getCurrentPeriod();

    const { error: insertError } = await supabase
      .from("ai_usage")
      .insert({
        user_id: user.id,
        tool: "all",
        used_count: 1,
        period_start: periodStart,
      });

    if (insertError) {
      const { error: rpcError } = await supabase.rpc("increment_ai_usage", {
        p_user_id: user.id,
        p_period_start: periodStart,
      });
      if (rpcError) {
        const { data: current } = await supabase
          .from("ai_usage")
          .select("used_count")
          .eq("user_id", user.id)
          .eq("tool", "all")
          .eq("period_start", periodStart)
          .single();

        if (current) {
          await supabase
            .from("ai_usage")
            .update({ used_count: current.used_count + 1 })
            .eq("user_id", user.id)
            .eq("tool", "all")
            .eq("period_start", periodStart);
        }
      }
    }

    return { success: true };
  } catch (err) {
    console.error("[ai-usage] recordAiUsage error:", err);
    return { success: false, error: "Failed to record usage" };
  }
}
