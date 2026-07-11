"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type SavedAsset = {
  id: string;
  profile_id: string;
  tool_type: string;
  content: string;
  is_starred: boolean;
  created_at: string;
};

/**
 * Save an AI-generated asset to the vault.
 */
export async function saveAssetToVault(
  toolType: string,
  content: string
): Promise<{ ok: boolean; data?: SavedAsset; error?: string }> {
  const Schema = z.object({
    toolType: z.enum(["bio", "captions", "pitch", "optimize", "rate"]),
    content: z.string().min(1, "Content cannot be empty").max(50000),
  });

  const parsed = Schema.safeParse({ toolType, content });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("ai_saved_assets")
      .insert({
        profile_id: user.id,
        tool_type: parsed.data.toolType,
        content: parsed.data.content,
      })
      .select()
      .single();

    if (error) {
      console.error("[ai-vault] saveAssetToVault failed:", error);
      return { ok: false, error: "Failed to save asset" };
    }

    return { ok: true, data: data as SavedAsset };
  } catch (err) {
    console.error("[ai-vault] saveAssetToVault exception:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all saved assets for the current athlete.
 */
export async function getSavedAssets(): Promise<SavedAsset[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("ai_saved_assets")
      .select("*")
      .eq("profile_id", user.id)
      .order("is_starred", { ascending: false })
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as SavedAsset[];
  } catch {
    return [];
  }
}

/**
 * Get the count of saved assets for the current athlete.
 */
export async function getSavedAssetsCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from("ai_saved_assets")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id);

    if (error || count === null) return 0;
    return count;
  } catch {
    return 0;
  }
}

/**
 * Toggle the starred status of an asset.
 */
export async function toggleStarAsset(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const Schema = z.object({
    id: z.string().uuid(),
  });

  const parsed = Schema.safeParse({ id });
  if (!parsed.success) {
    return { ok: false, error: "Invalid asset ID" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data: existing, error: fetchError } = await supabase
      .from("ai_saved_assets")
      .select("is_starred")
      .eq("id", parsed.data.id)
      .eq("profile_id", user.id)
      .single();

    if (fetchError || !existing) {
      return { ok: false, error: "Asset not found" };
    }

    const { error } = await supabase
      .from("ai_saved_assets")
      .update({ is_starred: !existing.is_starred })
      .eq("id", parsed.data.id)
      .eq("profile_id", user.id);

    if (error) {
      console.error("[ai-vault] toggleStarAsset failed:", error);
      return { ok: false, error: "Failed to update asset" };
    }

    return { ok: true };
  } catch (err) {
    console.error("[ai-vault] toggleStarAsset exception:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete an asset from the vault.
 */
export async function deleteAsset(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const Schema = z.object({
    id: z.string().uuid(),
  });

  const parsed = Schema.safeParse({ id });
  if (!parsed.success) {
    return { ok: false, error: "Invalid asset ID" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("ai_saved_assets")
      .delete()
      .eq("id", parsed.data.id)
      .eq("profile_id", user.id);

    if (error) {
      console.error("[ai-vault] deleteAsset failed:", error);
      return { ok: false, error: "Failed to delete asset" };
    }

    return { ok: true };
  } catch (err) {
    console.error("[ai-vault] deleteAsset exception:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update the content of a saved asset.
 */
export async function updateAssetContent(
  id: string,
  content: string
): Promise<{ ok: boolean; error?: string }> {
  const Schema = z.object({
    id: z.string().uuid(),
    content: z.string().min(1, "Content cannot be empty").max(50000),
  });

  const parsed = Schema.safeParse({ id, content });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("ai_saved_assets")
      .update({ content: parsed.data.content })
      .eq("id", parsed.data.id)
      .eq("profile_id", user.id);

    if (error) {
      console.error("[ai-vault] updateAssetContent failed:", error);
      return { ok: false, error: "Failed to update asset" };
    }

    return { ok: true };
  } catch (err) {
    console.error("[ai-vault] updateAssetContent exception:", err);
    return { ok: false, error: "An unexpected error occurred" };
  }
}
