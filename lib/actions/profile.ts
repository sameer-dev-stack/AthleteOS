"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { ALL_THEMES } from "@/lib/themes";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  username: string | null;
  sport: string | null;
  school: string | null;
  class_year: string | null;
  position: string | null;
  bio: string | null;
  stats: { label: string; value: string; icon?: string | null }[];
  links: { label: string; url: string }[];
  social: { twitter?: string; instagram?: string; tiktok?: string; youtube?: string };
  highlights: { title: string; url: string }[];
  is_verified: boolean;
  profile_published: boolean;
  onboarding_completed: boolean;
  plan: string;
  stripe_account_id: string | null;
  stripe_subscription_id: string | null;
  stripe_onboarding_complete: boolean;
  theme_accent: string;
  theme_layout: string;
  moderation_status: string;
  extended_pro_until: string | null;
  pro_expires_at: string | null;
  created_at: string;
  updated_at: string;
  contact_phone: string | null;
  contact_email: string | null;
  payout_method: string | null;
  payout_settings: Record<string, any> | null;
  email_preferences: Record<string, boolean> | null;
  has_claimed_promo_trial?: boolean;
};

export type ProfileResult = {
  ok: boolean;
  data?: Profile;
  error?: string;
};

const LinkSchema = z.object({
  label: z.string().min(1).max(100),
  url: z.string().regex(/^https?:\/\/.+/, "Must start with http:// or https://").max(500),
});

const HighlightSchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().regex(/^https?:\/\/.+/, "Must start with http:// or https://").max(500),
});

const StatSchema = z.object({
  label: z.string().min(1).max(50),
  value: z.string().min(1).max(50),
  icon: z.string().max(50).optional().nullable(),
});

const SocialSchema = z.object({
  twitter: z.string().max(50).optional(),
  instagram: z.string().max(50).optional(),
  tiktok: z.string().max(50).optional(),
  youtube: z.string().max(50).optional(),
});

const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/).optional(),
  full_name: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ\s'\-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes").optional(),
  sport: z.string().min(1).max(50).optional(),
  school: z.string().min(1).max(100).optional(),
  class_year: z.string().max(20).nullable().optional(),
  position: z.string().max(50).nullable().optional(),
  bio: z.string().max(280).nullable().optional(),
  avatar_url: z.string().max(500).nullable().optional(),
  cover_url: z.string().max(500).nullable().optional(),
  stats: z.array(StatSchema).max(10).optional(),
  links: z.array(LinkSchema).max(10).optional(),
  social: SocialSchema.optional(),
  highlights: z.array(HighlightSchema).max(10).optional(),
  profile_published: z.boolean().optional(),
  onboarding_completed: z.boolean().optional(),
  contact_phone: z.string().max(30).nullable().optional(),
  contact_email: z.string().email("Must be a valid email").max(200).nullable().optional().or(z.literal("").transform(() => null)),
  payout_method: z.string().nullable().optional(),
  payout_settings: z.record(z.any()).nullable().optional(),
  stripe_onboarding_complete: z.boolean().optional(),
  referred_by: z.string().max(30).nullable().optional(),
});

export async function getMyProfile(): Promise<ProfileResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Profile };
  } catch (err) {
    console.error("[profile] getMyProfile error:", err);
    return { ok: false, error: "Failed to load profile" };
  }
}

export async function checkUsername(username: string): Promise<{ available: boolean }> {
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const clean = username.toLowerCase().trim();
  if (clean.length < 3 || clean.length > 30) return { available: false };
  if (!/^[a-z0-9_-]+$/.test(clean)) return { available: false };

  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("username", clean)
    .single();

  return { available: !data };
}

export async function updateProfile(
  updates: Partial<Pick<Profile, "username" | "full_name" | "sport" | "school" | "class_year" | "position" | "bio" | "stats" | "links" | "social" | "highlights" | "profile_published" | "onboarding_completed" | "avatar_url" | "cover_url" | "contact_phone" | "contact_email" | "payout_method" | "payout_settings" | "stripe_onboarding_complete" | "email_preferences"> & { referred_by?: string | null }>
): Promise<ProfileResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const parsed = UpdateProfileSchema.safeParse(updates);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
    }

    const validated = parsed.data;

    if (validated.stripe_onboarding_complete && !validated.payout_method && !updates.payout_method) {
      return { ok: false, error: "Cannot complete onboarding without payout method" };
    }

    if (validated.profile_published) {
      const { isCardComplete, getMissingCardFieldLabels } = await import("../card-completeness");
      const { data: current } = await admin
        .from("profiles")
        .select("avatar_url, full_name, sport, position, school, class_year, bio, stats, links, social, highlights, contact_email, contact_phone")
        .eq("id", user.id)
        .single();

      const mergedCard: import("../card-completeness").CardProfile = { ...(current || {}) };
      for (const key of ["avatar_url", "full_name", "sport", "position", "school", "class_year", "bio", "stats", "links", "social", "highlights", "contact_email", "contact_phone"] as const) {
        if (validated[key] !== undefined) (mergedCard as Record<string, unknown>)[key] = validated[key];
      }

      if (!isCardComplete(mergedCard)) {
        const labels = getMissingCardFieldLabels(mergedCard);
        const message = labels.length <= 2
          ? `Your card needs ${labels.join(" and ")} before it can go live.`
          : `Your card needs ${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]} before it can go live.`;
        return { ok: false, error: message };
      }
    }

    if (updates.username) {
      const clean = validated.username!.toLowerCase().trim();

      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("username", clean)
        .neq("id", user.id)
        .single();

      if (existing) {
        return { ok: false, error: "That username is already taken." };
      }

      validated.username = clean;
    }

    if (validated.full_name) {
      validated.full_name = validated.full_name
        .replace(/[^a-zA-ZÀ-ÿ\s'\-]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    }

    if (validated.school) {
      validated.school = validated.school
        .replace(/\s{2,}/g, " ")
        .trim();
    }

    // Fetch old values before update for change logging
    const TRACKED_FIELDS = ["bio", "full_name", "sport", "school", "position", "class_year", "avatar_url", "stats", "links", "social", "highlights", "contact_phone", "contact_email"] as const;
    const { data: oldProfile } = await admin
      .from("profiles")
      .select(TRACKED_FIELDS.join(", "))
      .eq("id", user.id)
      .single();

    const updatePayload: Record<string, unknown> = { ...validated, updated_at: new Date().toISOString() };
    if (updates.referred_by !== undefined) {
      updatePayload.referred_by = updates.referred_by;
    }

    let { data, error } = await admin
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error && /referred_by/.test(error.message)) {
      const { referred_by: _drop, ...payloadWithoutRef } = updatePayload;
      const retry = await admin
        .from("profiles")
        .update(payloadWithoutRef)
        .eq("id", user.id)
        .select("*")
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      if (error.code === "23505" && error.message?.includes("username")) {
        return { ok: false, error: "That username was just claimed by someone else. Please choose another." };
      }
      return { ok: false, error: error.message };
    }

    try {
      const { recordProfileEvent } = await import("./profile-history");
      for (const field of TRACKED_FIELDS) {
        if (field in validated && validated[field] !== undefined) {
          const oldVal = (oldProfile as any)?.[field];
          const newVal = validated[field];
          const oldStr = JSON.stringify(oldVal);
          const newStr = JSON.stringify(newVal);
          if (oldStr !== newStr) {
            recordProfileEvent(user.id, `${field}_updated`, field, oldVal, newVal);
          }
        }
      }
    } catch {
      // Non-blocking — history logging should never break the save
    }

    try {
      const { checkAndRewardReferral } = await import("./referrals");
      await checkAndRewardReferral(user.id);
    } catch {
      // Non-blocking
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath(`/${data.username || ""}`);

    if (validated.onboarding_completed) {
      const { seedKnowledgeFromProfile } = await import("./athlete-knowledge");
      await seedKnowledgeFromProfile({
        id: user.id,
        full_name: validated.full_name ?? data.full_name,
        sport: validated.sport ?? data.sport,
        school: validated.school ?? data.school,
        position: validated.position ?? data.position,
        bio: validated.bio ?? data.bio,
      });
    }

    return { ok: true, data: data as Profile };
  } catch (e) {
    console.error("[profile] updateProfile error:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save profile" };
  }
}

export async function getPublicProfile(username: string): Promise<ProfileResult> {
  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, avatar_url, cover_url, username, sport, school, class_year, position, bio, stats, links, social, highlights, is_verified, profile_published, plan, theme_accent, theme_layout, contact_phone, contact_email, created_at, onboarding_completed")
      .eq("username", username.toLowerCase().trim())
      .eq("profile_published", true)
      .single();

    if (error || !data) return { ok: false, error: "Profile not found" };
    return { ok: true, data: data as Profile };
  } catch (err) {
    console.error("[profile] getPublicProfile error:", err);
    return { ok: false, error: "Failed to load profile" };
  }
}

export async function updateTheme(
  themeAccent: string,
  themeLayout: string
): Promise<ProfileResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const ThemeSchema = z.object({
    accent: z.string().refine(
      (val) => /^#[0-9A-Fa-f]{6}$/.test(val) || ALL_THEMES.some((t) => t.id === val),
      { message: "Invalid theme or color selected" }
    ),
    layout: z.enum(["compact", "classic", "wide"]),
  });

  const parsed = ThemeSchema.safeParse({ accent: themeAccent, layout: themeLayout });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await admin
    .from("profiles")
    .update({ theme_accent: parsed.data.accent, theme_layout: parsed.data.layout, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath(`/${data.username || ""}`);
  return { ok: true, data: data as Profile };
}
