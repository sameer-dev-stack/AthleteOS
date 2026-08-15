"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

const VERIFICATION_WINDOW_MS = 5 * 60 * 1000;

export async function verifyRecentTip(athleteId: string): Promise<{ verified: boolean }> {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cutoff = new Date(Date.now() - VERIFICATION_WINDOW_MS).toISOString();
  const { data } = await supabase
    .from("tips")
    .select("id")
    .eq("athlete_id", athleteId)
    .gte("created_at", cutoff)
    .limit(1);

  return { verified: (data?.length || 0) > 0 };
}
