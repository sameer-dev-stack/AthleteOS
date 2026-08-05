"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type PreferredTone = "confident" | "casual" | "professional" | "playful";

export const ALLOWED_DEAL_PREFERENCES = [
  "sponsorship",
  "shoutout",
  "collab",
  "booking",
  "content",
  "merch",
] as const;

export type DealPreference = (typeof ALLOWED_DEAL_PREFERENCES)[number];

export type BusinessFacts = {
  profile_id: string;
  brand_voice: string | null;
  preferred_tone: PreferredTone;
  min_deal_value: number | null;
  deal_preferences: DealPreference[];
  updated_at: string;
};

const SaveBusinessFactsSchema = z.object({
  brandVoice: z.string().max(500).nullable().optional(),
  preferredTone: z.enum(["confident", "casual", "professional", "playful"]),
  minDealValue: z.number().min(0).nullable().optional(),
  dealPreferences: z
    .array(z.enum(ALLOWED_DEAL_PREFERENCES))
    .max(6)
    .transform((arr) => Array.from(new Set(arr))),
});

export async function getBusinessFacts(): Promise<{
  ok: boolean;
  data?: BusinessFacts | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("business_facts")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };

    return { ok: true, data: (data as BusinessFacts | null) ?? null };
  } catch (err) {
    console.error("[business-facts] getBusinessFacts error:", err);
    return { ok: false, error: "Failed to fetch business facts" };
  }
}

export async function saveBusinessFacts(input: {
  brandVoice?: string | null;
  preferredTone: string;
  minDealValue?: number | null;
  dealPreferences: string[];
}): Promise<{ ok: boolean; data?: BusinessFacts; error?: string }> {
  const parsed = SaveBusinessFactsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated" };

  const patch = {
    profile_id: user.id,
    brand_voice: parsed.data.brandVoice ?? null,
    preferred_tone: parsed.data.preferredTone,
    min_deal_value: parsed.data.minDealValue ?? null,
    deal_preferences: parsed.data.dealPreferences,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("business_facts")
    .upsert(patch, { onConflict: "profile_id" })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  return { ok: true, data: data as BusinessFacts };
}
