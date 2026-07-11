"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function truncate(val: unknown, maxLen = 500): string | null {
  if (val === null || val === undefined) return null;
  const str = typeof val === "string" ? val : JSON.stringify(val);
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

export type ProfileEvent = {
  id: string;
  profile_id: string;
  event_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

/**
 * Log a profile change event. Called from updateProfile after a successful write.
 * Non-blocking — failures are swallowed so they never break the main action.
 */
export async function recordProfileEvent(
  profileId: string,
  eventType: string,
  fieldName?: string,
  oldValue?: unknown,
  newValue?: unknown,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== profileId) return;

    const admin = getAdmin();
    await admin.from("profile_events").insert({
      profile_id: profileId,
      event_type: eventType,
      field_name: fieldName || null,
      old_value: truncate(oldValue),
      new_value: truncate(newValue),
      metadata: metadata || {},
    });
  } catch (err) {
    console.error("[profile-history] recordProfileEvent failed:", err);
  }
}

/**
 * Get recent profile change history for the current athlete.
 */
export async function getProfileHistory(
  limit = 20
): Promise<{ ok: boolean; data?: ProfileEvent[]; error?: string }> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const admin = getAdmin();
    const { data, error } = await admin
      .from("profile_events")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as ProfileEvent[] };
  } catch {
    return { ok: false, error: "Failed to load history" };
  }
}

/**
 * Get a summary of profile improvement over a date range.
 * Returns counts of changes made and which fields were most active.
 */
export async function getProfileActivitySummary(
  days = 30
): Promise<{
  ok: boolean;
  data?: { totalChanges: number; topFields: { field: string; count: number }[]; activeDays: number };
  error?: string;
}> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const admin = getAdmin();

    const { data, error } = await admin
      .from("profile_events")
      .select("field_name, event_type, created_at")
      .eq("profile_id", user.id)
      .gte("created_at", since);

    if (error) return { ok: false, error: error.message };

    const events = data || [];
    const fieldCounts: Record<string, number> = {};
    const activeDaysSet = new Set<string>();

    for (const e of events) {
      const field = e.field_name || e.event_type;
      fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      activeDaysSet.add(e.created_at.slice(0, 10));
    }

    const topFields = Object.entries(fieldCounts)
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      ok: true,
      data: {
        totalChanges: events.length,
        topFields,
        activeDays: activeDaysSet.size,
      },
    };
  } catch {
    return { ok: false, error: "Failed to compute summary" };
  }
}
