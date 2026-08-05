"use server";

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

/**
 * Fetch the current athlete's AI memory. Null-safe stub returning null per ADR-046.
 */
export async function getAiMemory(): Promise<AIMemory | null> {
  return null;
}
