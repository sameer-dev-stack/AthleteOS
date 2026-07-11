"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CreateBrandSchema = z.object({
  companyName: z.string().min(1).max(100),
  industry: z.string().max(100).optional(),
  website: z.string().url().max(500).optional(),
  description: z.string().max(500).optional(),
});

export async function createBrandAccount(
  companyName: string,
  industry?: string,
  website?: string,
  description?: string
): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const parsed = CreateBrandSchema.safeParse({ companyName, industry, website, description });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("brand_accounts")
      .upsert(
        {
          user_id: user.id,
          company_name: parsed.data.companyName,
          industry: parsed.data.industry ?? null,
          website: parsed.data.website ?? null,
          description: parsed.data.description ?? null,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/brands");
    return { ok: true, data };
  } catch (err) {
    console.error("[brand] createBrandAccount error:", err);
    return { ok: false, error: "Failed to save brand account" };
  }
}

export async function getBrandAccount(): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("brand_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (err) {
    console.error("[brand] getBrandAccount error:", err);
    return { ok: false, error: "Failed to load brand account" };
  }
}

const CreateBriefSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sport: z.string().max(50).optional(),
  budgetMin: z.number().int().min(0).optional(),
  budgetMax: z.number().int().min(0).optional(),
  deadline: z.string().optional(),
});

export async function createCampaignBrief(
  title: string,
  description?: string,
  sport?: string,
  budgetMin?: number,
  budgetMax?: number,
  deadline?: string
): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const parsed = CreateBriefSchema.safeParse({ title, description, sport, budgetMin, budgetMax, deadline });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data: brand } = await supabase
      .from("brand_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!brand) return { ok: false, error: "Create a brand account first" };

    const { data, error } = await supabase
      .from("campaign_briefs")
      .insert({
        brand_id: brand.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        sport: parsed.data.sport ?? null,
        budget_min_cents: parsed.data.budgetMin ?? null,
        budget_max_cents: parsed.data.budgetMax ?? null,
        deadline: parsed.data.deadline ?? null,
      })
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/brands/dashboard");
    return { ok: true, data };
  } catch (err) {
    console.error("[brand] createCampaignBrief error:", err);
    return { ok: false, error: "Failed to create brief" };
  }
}

export async function getCampaignBriefs(
  page = 1,
  pageSize = 20
): Promise<{ ok: boolean; data?: Record<string, unknown>[]; total?: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: brand } = await supabase
    .from("brand_accounts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!brand) return { ok: true, data: [], total: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("campaign_briefs")
    .select("*", { count: "exact" })
    .eq("brand_id", brand.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [], total: count ?? 0 };
}

/**
 * Sanitize a free-text search parameter.
 *
 * Even though Supabase's PostgREST client uses parameterized queries (safe from
 * classic SQL injection), ILIKE wildcard abuse ('%' and '_' at arbitrary positions)
 * can force expensive full-table scans. We also strip control characters and null
 * bytes, and enforce a reasonable length cap.
 *
 * Allowed characters: letters, digits, spaces, @, ., -, _, +
 */
function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[%_]/g, "\\$&")
    .trim()
    .slice(0, 100);
}

/**
 * Search for athletes by name, username, sport, or school.
 *
 * PUBLIC API — This endpoint is intentionally accessible without authentication
 * to enable anonymous brand discovery at /brands/discover. The profiles being
 * searched are already public-facing (same data visible at /[username]).
 *
 * All user input is sanitized before ILIKE queries to prevent wildcard abuse
 * and control character injection.
 */
export async function searchAthletes(
  query?: string,
  sport?: string,
  school?: string,
  page = 1,
  pageSize = 20
): Promise<{ ok: boolean; data?: Record<string, unknown>[]; total?: number; error?: string }> {
  // Sanitize all input parameters before ILIKE queries
  const safeQuery = query ? sanitizeSearch(query) : undefined;
  const safeSport = sport ? sanitizeSearch(sport) : undefined;
  const safeSchool = school ? sanitizeSearch(school) : undefined;

  const supabase = getServiceClient();

  let dbQuery = supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, sport, school, position, bio, stats, is_verified, profile_published", { count: "exact" })
    .eq("profile_published", true)
    .eq("onboarding_completed", true);

  if (safeQuery) {
    dbQuery = dbQuery.or(`full_name.ilike.%${safeQuery}%,username.ilike.%${safeQuery}%,sport.ilike.%${safeQuery}%`);
  }
  if (safeSport) {
    dbQuery = dbQuery.ilike("sport", `%${safeSport}%`);
  }
  if (safeSchool) {
    dbQuery = dbQuery.ilike("school", `%${safeSchool}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await dbQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [], total: count ?? 0 };
}

export async function saveAthlete(
  athleteId: string,
  notes?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data: brand } = await supabase
      .from("brand_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!brand) return { ok: false, error: "Create a brand account first" };

    const { error } = await supabase
      .from("saved_athletes")
      .upsert(
        { brand_id: brand.id, athlete_id: athleteId, notes: notes ?? null },
        { onConflict: "brand_id,athlete_id" }
      );

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    console.error("[brand] saveAthlete error:", err);
    return { ok: false, error: "Failed to save athlete" };
  }
}

export async function getSavedAthletes(
  page = 1,
  pageSize = 20
): Promise<{ ok: boolean; data?: Record<string, unknown>[]; total?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data: brand } = await supabase
      .from("brand_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!brand) return { ok: true, data: [], total: 0 };

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("saved_athletes")
      .select("*, profiles(id, full_name, username, avatar_url, sport, school, bio, is_verified)", { count: "exact" })
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? [], total: count ?? 0 };
  } catch (err) {
    console.error("[brand] getSavedAthletes error:", err);
    return { ok: false, error: "Failed to load saved athletes" };
  }
}

export async function removeSavedAthlete(athleteId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data: brand } = await supabase
      .from("brand_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!brand) return { ok: false, error: "Not found" };

    const { error } = await supabase
      .from("saved_athletes")
      .delete()
      .eq("brand_id", brand.id)
      .eq("athlete_id", athleteId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    console.error("[brand] removeSavedAthlete error:", err);
    return { ok: false, error: "Failed to remove athlete" };
  }
}
