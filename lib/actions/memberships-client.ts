"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type Tier = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  athlete_id: string;
  profiles: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
};

export async function getTierForSubscription(tierId: string): Promise<{ ok: boolean; tier?: Tier; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const serviceClient = getServiceClient();

  const { data, error } = await serviceClient
    .from("membership_tiers")
    .select("*, profiles(full_name, username, avatar_url)")
    .eq("id", tierId)
    .eq("is_active", true)
    .single();

  if (error) return { ok: false, error: "Failed to fetch tier" };
  if (!data) return { ok: false, error: "Tier not found" };

  return { ok: true, tier: data as Tier };
}
