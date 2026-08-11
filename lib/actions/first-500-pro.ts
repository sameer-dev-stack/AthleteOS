"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Privileged plan writes MUST use the service role: after the 20260812
// hardening migration, plan/pro_expires_at/waitlist_position are not
// updateable by the user's RLS role.
const admin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function assignFirst500ProBenefit(): Promise<{ assigned: boolean; position?: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { assigned: false };

  const service = admin();

  const { data: profile } = await service
    .from("profiles")
    .select("waitlist_position, pro_expires_at, plan")
    .eq("id", user.id)
    .single();

  if (!profile) return { assigned: false };

  if (profile.pro_expires_at) {
    return { assigned: false, position: profile.waitlist_position ?? undefined };
  }

  const { data: waitlistEntry } = await service
    .from("waitlist")
    .select("id, joined_at")
    .eq("email", user.email?.toLowerCase() ?? "")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!waitlistEntry) return { assigned: false };

  const { count: position } = await service
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .lt("joined_at", waitlistEntry.joined_at);

  const waitlistPosition = (position ?? 0) + 1;

  await service
    .from("profiles")
    .update({ waitlist_position: waitlistPosition })
    .eq("id", user.id);

  if (waitlistPosition <= 500) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    const { error } = await service
      .from("profiles")
      .update({
        plan: "pro",
        pro_expires_at: expiresAt.toISOString(),
      })
      .eq("id", user.id)
      .is("pro_expires_at", null);

    if (error) return { assigned: false, position: waitlistPosition };

    return { assigned: true, position: waitlistPosition };
  }

  return { assigned: false, position: waitlistPosition };
}

export async function checkProExpiry(): Promise<{ expired: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { expired: false };

  const service = admin();

  const { data: profile } = await service
    .from("profiles")
    .select("plan, pro_expires_at")
    .eq("id", user.id)
    .single();

  if (!profile || profile.plan !== "pro" || !profile.pro_expires_at) {
    return { expired: false };
  }

  if (new Date(profile.pro_expires_at) < new Date()) {
    const { data: fullProfile } = await service
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (!fullProfile?.stripe_subscription_id) {
      await service
        .from("profiles")
        .update({ plan: "free" })
        .eq("id", user.id);
      return { expired: true };
    }
  }

  return { expired: false };
}
