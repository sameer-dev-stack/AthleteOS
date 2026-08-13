"use server";

import { createClient } from "@/lib/supabase/server";
import { resolvePlan } from "@/lib/referral-reward";

export type EffectivePlan = "free" | "pro" | "elite";

// Resolves the user's effective plan including referral-granted Pro window.
export async function getEffectivePlan(): Promise<EffectivePlan> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "free";

    const { data } = await supabase
      .from("profiles")
      .select("plan, extended_pro_until, pro_expires_at")
      .eq("id", user.id)
      .single();

    return resolvePlan(data?.plan, data?.extended_pro_until, data?.pro_expires_at);
  } catch (err) {
    console.error("[plan] getEffectivePlan error:", err);
    return "free";
  }
}
