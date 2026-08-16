"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";
import { getSubscriptionByUserId } from "@/lib/stripe-billing";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type WaitlistEntry = {
  id: string;
  email: string;
  source: string;
  confirmed: boolean;
  joined_at: string;
};

export type AdminResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type ViewUserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  plan: string;
  suspended: boolean;
  role: string;
  sport: string | null;
  school: string | null;
  profile_published: boolean;
  onboarding_completed: boolean;
  bio: string | null;
  [key: string]: unknown;
};

export type ViewUserSubscription = {
  tier: string;
  status: string | null;
  currentPeriodEnd: number | null;
  customerId: string | null;
  subscriptionId: string | null;
};

export type ViewUserData = {
  profile: ViewUserProfile;
  subscription: ViewUserSubscription;
};

// ---------------------------------------------------------------------------
// Internal security helpers
// ---------------------------------------------------------------------------

/**
 * Verify the calling user is an admin.
 * Checks the DB role first; falls back to the hardcoded email allowlist.
 */
const UpdatePlanSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(["free", "pro"]),
});

const ToggleStatusSchema = z.object({
  userId: z.string().uuid(),
  active: z.boolean(),
});

const ToggleVerificationSchema = z.object({
  userId: z.string().uuid(),
  verified: z.boolean(),
});

const LogActionSchema = z.object({
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

async function verifyAdmin(supabase: SupabaseClient, user: User | null): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user.email)) return true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
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
 * Rate-limit a destructive admin action using the audit_log table as the source
 * of truth. No extra infrastructure needed — the log already records every action.
 *
 * @param supabase  Authenticated Supabase client
 * @param adminId   UUID of the admin performing the action
 * @param action    The action name to count (e.g. "update_user_plan")
 * @param limit     Max allowed occurrences within the window (default: 50)
 * @param windowHrs Rolling window in hours (default: 1)
 * @returns true if the request is within limits, false if rate-limited
 */
async function checkAdminRateLimit(
  supabase: SupabaseClient,
  adminId: string,
  action: string,
  limit = 50,
  windowHrs = 1
): Promise<boolean> {
  const since = new Date(
    Date.now() - windowHrs * 60 * 60 * 1000
  ).toISOString();

  const { count, error } = await supabase
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("admin_id", adminId)
    .eq("action", action)
    .gte("created_at", since);

  if (error) {
    // If we can't read the log, fail closed (deny).
    console.error("[admin] rate-limit check failed", error);
    return false;
  }

  return (count ?? 0) < limit;
}

// ---------------------------------------------------------------------------
// Waitlist / newsletter actions (unchanged, auth-guarded)
// ---------------------------------------------------------------------------

export async function getWaitlistEntries(): Promise<
  AdminResult<WaitlistEntry[]>
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const { data, error } = await supabase
    .from("waitlist")
    .select("*")
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("[admin] fetch waitlist failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function getWaitlistCount(): Promise<AdminResult<number>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const { count, error } = await supabase
    .from("waitlist")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("[admin] count waitlist failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data: count ?? 0 };
}

export async function getNewsletterCount(): Promise<AdminResult<number>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const { count, error } = await supabase
    .from("newsletter")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("[admin] count newsletter failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data: count ?? 0 };
}

function escapeCsv(value: string): string {
  let sanitized = value;
  if (/^[=+\-@]/.test(sanitized)) {
    sanitized = sanitized.replace(/^[=+\-@]+/, "");
  }
  if (sanitized.includes(",") || sanitized.includes('"') || sanitized.includes("\n")) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export async function exportWaitlistCsv(): Promise<AdminResult<string>> {
  const result = await getWaitlistEntries();
  if (!result.ok || !result.data) return { ok: false, error: result.error };

  const headers = ["Email", "Source", "Confirmed", "Joined At"];
  const rows = result.data.map((entry) => [
    escapeCsv(entry.email),
    escapeCsv(entry.source),
    entry.confirmed ? "Yes" : "No",
    new Date(entry.joined_at).toISOString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  return { ok: true, data: csv };
}

// ---------------------------------------------------------------------------
// Phase 7 Admin Server Actions
// ---------------------------------------------------------------------------

export type AuditLogEntry = {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

/**
 * List users with optional search and pagination.
 * Search param is sanitized before use.
 */
export async function listUsers(
  search?: string,
  page = 1,
  pageSize = 20
): Promise<AdminResult<{ users: Array<{ id: string; email: string; full_name: string | null; username: string | null; avatar_url: string | null; plan: string; suspended: boolean; is_verified: boolean; role: string; created_at: string }>; total: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  // Sanitize the search term to strip control chars, null bytes, and wildcard abuse
  const safeSearch = search ? sanitizeSearch(search) : undefined;
  if (search && !safeSearch) {
    // Original string existed but was entirely stripped — reject it
    return { ok: false, error: "Invalid search query" };
  }

  const safePageSize = Math.min(pageSize, 100);

  let query = supabase
    .from("profiles")
    .select(
      "id, email, full_name, username, avatar_url, plan, is_verified, suspended, role, created_at",
      { count: "exact" }
    );

  if (safeSearch) {
    query = query.or(
      `email.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%,username.ilike.%${safeSearch}%`
    );
  }

  query = query.order("created_at", { ascending: false });

  const from = (page - 1) * safePageSize;
  const to = from + safePageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin] listUsers failed", error);
    return { ok: false, error: error.message };
  }

  const users = (data ?? []).map((u: Record<string, unknown>) => ({
    id: u.id as string,
    email: u.email as string,
    full_name: u.full_name as string | null,
    username: u.username as string | null,
    avatar_url: u.avatar_url as string | null,
    plan: (u.plan as string) || "free",
    suspended: (u.suspended as boolean) ?? false,
    is_verified: (u.is_verified as boolean) ?? false,
    role: (u.role as string) || "user",
    created_at: u.created_at as string,
  }));

  return { ok: true, data: { users, total: count ?? 0 } };
}

/** Fetch paginated audit log entries for the admin dashboard. */
export async function getAuditLogs(
  page = 1,
  pageSize = 20
): Promise<AdminResult<{ logs: AuditLogEntry[]; total: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[admin] getAuditLogs failed", error);
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    data: { logs: (data ?? []) as AuditLogEntry[], total: count ?? 0 },
  };
}

/** Return a user's full profile and subscription status. */
export async function viewUser(
  userId: string
): Promise<AdminResult<ViewUserData>> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return { ok: false, error: "Invalid user ID format" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const { data: targetProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !targetProfile) {
    return {
      ok: false,
      error: profileError?.message ?? "User profile not found",
    };
  }

  const subscription = await getSubscriptionByUserId(userId);

  return { ok: true, data: { profile: targetProfile as ViewUserProfile, subscription } };
}

/**
 * Change a user's subscription plan.
 * Rate-limited to 50 plan changes per admin per hour.
 */
export async function updateUserPlan(
  userId: string,
  plan: string
): Promise<AdminResult<Record<string, unknown>>> {
  const parsed = UpdatePlanSchema.safeParse({ userId, plan });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authorized" };

  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  // Rate limit: max 50 plan updates per admin per hour
  const withinLimit = await checkAdminRateLimit(
    supabase,
    user.id,
    "update_user_plan",
    50,
    1
  );
  if (!withinLimit) {
    console.warn(`[admin] rate limit hit for updateUserPlan by admin ${user.id}`);
    return {
      ok: false,
      error: "Rate limit exceeded: max 50 plan updates per hour. Try again later.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("[admin] updateUserPlan failed", error);
    return { ok: false, error: error.message };
  }

  await logAdminAction("update_user_plan", "profile", userId, { plan: parsed.data.plan });

  return { ok: true, data };
}

/**
 * Suspend or reinstate a user via profiles.suspended.
 * Rate-limited to 50 status changes per admin per hour.
 */
export async function toggleUserStatus(
  userId: string,
  active: boolean
): Promise<AdminResult<Record<string, unknown>>> {
  const parsed = ToggleStatusSchema.safeParse({ userId, active });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authorized" };

  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  // Rate limit: max 50 status toggles per admin per hour
  const withinLimit = await checkAdminRateLimit(
    supabase,
    user.id,
    active ? "activate_user" : "suspend_user",
    50,
    1
  );
  if (!withinLimit) {
    console.warn(`[admin] rate limit hit for toggleUserStatus by admin ${user.id}`);
    return {
      ok: false,
      error: "Rate limit exceeded: max 50 status changes per hour. Try again later.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ suspended: !parsed.data.active })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("[admin] toggleUserStatus failed", error);
    return { ok: false, error: error.message };
  }

  await logAdminAction(
    parsed.data.active ? "activate_user" : "suspend_user",
    "profile",
    userId,
    { active: parsed.data.active }
  );

  return { ok: true, data };
}

export async function toggleUserVerification(
  userId: string,
  verified: boolean
): Promise<AdminResult<Record<string, unknown>>> {
  const parsed = ToggleVerificationSchema.safeParse({ userId, verified });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authorized" };

  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const withinLimit = await checkAdminRateLimit(
    supabase,
    user.id,
    "toggle_user_verification",
    50,
    1
  );
  if (!withinLimit) {
    return {
      ok: false,
      error: "Rate limit exceeded: max 50 verification toggles per hour.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ is_verified: parsed.data.verified })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("[admin] toggleUserVerification failed", error);
    return { ok: false, error: error.message };
  }

  await logAdminAction(
    parsed.data.verified ? "verify_user" : "unverify_user",
    "profile",
    userId,
    { verified: parsed.data.verified }
  );

  return { ok: true, data };
}

// ---------------------------------------------------------------------------
// Phase 7: Usage Monitoring, Abuse Detection, Payout Management, Moderation
// ---------------------------------------------------------------------------

export async function getUsageStats(): Promise<
  AdminResult<{
    totalGenerations: number;
    activeUsers: number;
    avgPerUser: number;
    planDistribution: { plan: string; count: number }[];
    topUsers: { email: string; plan: string; used: number }[];
  }>
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authorized" };
  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [usageResult, planResult, topUsersResult] = await Promise.all([
    serviceClient
      .from("ai_usage")
      .select("used_count, user_id")
      .eq("tool", "all")
      .eq("period_start", periodStart),
    serviceClient
      .from("profiles")
      .select("plan")
      .neq("role", "admin"),
    serviceClient
      .from("ai_usage")
      .select("used_count, user_id, profiles!inner(email, plan)")
      .eq("tool", "all")
      .eq("period_start", periodStart)
      .order("used_count", { ascending: false })
      .limit(10),
  ]);

  const usageData = usageResult.data ?? [];
  const totalGenerations = usageData.reduce((sum, u) => sum + (u.used_count || 0), 0);
  const activeUsers = usageData.length;
  const avgPerUser = activeUsers > 0 ? Math.round(totalGenerations / activeUsers) : 0;

  const plans = (planResult.data ?? []) as { plan: string }[];
  const planCounts = new Map<string, number>();
  for (const p of plans) {
    const plan = p.plan || "free";
    planCounts.set(plan, (planCounts.get(plan) || 0) + 1);
  }
  const planDistribution = Array.from(planCounts.entries()).map(([plan, count]) => ({ plan, count }));

  const topUsers = (topUsersResult.data ?? []).map((u: Record<string, unknown>) => {
    const profile = u.profiles as Record<string, unknown> | null;
    return {
      email: (profile?.email as string) || "unknown",
      plan: (profile?.plan as string) || "free",
      used: (u.used_count as number) || 0,
    };
  });

  return {
    ok: true,
    data: { totalGenerations, activeUsers, avgPerUser, planDistribution, topUsers },
  };
}

export async function getUserUsageList(
  page = 1,
  pageSize = 20
): Promise<AdminResult<{ users: { email: string; plan: string; used: number; periodStart: string }[]; total: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authorized" };
  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await serviceClient
    .from("ai_usage")
    .select("used_count, period_start, profiles!inner(email, plan)", { count: "exact" })
    .eq("tool", "all")
    .order("used_count", { ascending: false })
    .range(from, to);

  if (error) return { ok: false, error: error.message };

  const users = (data ?? []).map((u: Record<string, unknown>) => {
    const profile = u.profiles as Record<string, unknown> | null;
    return {
      email: (profile?.email as string) || "unknown",
      plan: (profile?.plan as string) || "free",
      used: (u.used_count as number) || 0,
      periodStart: (u.period_start as string) || "",
    };
  });

  return { ok: true, data: { users, total: count ?? 0 } };
}

export async function getAbuseStats(): Promise<
  AdminResult<{
    rateLimitCount: number;
    suspendedCount: number;
    recentAuditActions: AuditLogEntry[];
    suspendedUsers: { email: string; username: string | null; created_at: string }[];
  }>
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authorized" };
  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [rateLimitResult, suspendedResult, auditResult, suspendedUsersResult] = await Promise.all([
    serviceClient
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .gte("window_start", since24h),
    serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("suspended", true),
    serviceClient
      .from("audit_log")
      .select("*")
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })
      .limit(20),
    serviceClient
      .from("profiles")
      .select("email, username, created_at")
      .eq("suspended", true)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    ok: true,
    data: {
      rateLimitCount: rateLimitResult.count ?? 0,
      suspendedCount: suspendedResult.count ?? 0,
      recentAuditActions: (auditResult.data ?? []) as AuditLogEntry[],
      suspendedUsers: (suspendedUsersResult.data ?? []) as { email: string; username: string | null; created_at: string }[],
    },
  };
}

export async function getPayoutData(
  page = 1,
  pageSize = 20
): Promise<AdminResult<{ requests: { id: string; athleteEmail: string; athleteUsername: string | null; amount: number; status: string; payoutMethod: string | null; createdAt: string }[]; total: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authorized" };
  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: payouts, error, count } = await serviceClient
    .from("payouts")
    .select("id, athlete_id, amount, status, payout_method, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return { ok: false, error: error.message };

  const athleteIds = (payouts ?? []).map((p: Record<string, unknown>) => p.athlete_id as string);

  let emailMap = new Map<string, { email: string; username: string | null }>();
  if (athleteIds.length > 0) {
    const { data: profiles } = await serviceClient
      .from("profiles")
      .select("id, email, username")
      .in("id", athleteIds);

    for (const prof of profiles ?? []) {
      const p = prof as { id: string; email: string; username: string | null };
      emailMap.set(p.id, { email: p.email, username: p.username });
    }
  }

  const result = (payouts ?? []).map((p: Record<string, unknown>) => {
    const prof = emailMap.get(p.athlete_id as string) || { email: "unknown", username: null };
    return {
      id: p.id as string,
      athleteEmail: prof.email,
      athleteUsername: prof.username,
      amount: p.amount as number,
      status: (p.status as string) || "pending",
      payoutMethod: (p.payout_method as string | null) ?? null,
      createdAt: p.created_at as string,
    };
  });

  return { ok: true, data: { requests: result, total: count ?? 0 } };
}

export async function updatePayoutStatus(
  payoutId: string,
  status: "paid" | "failed"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authorized" };
  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await serviceClient
    .from("payouts")
    .update({
      status,
      arrival_date: status === "paid" ? new Date().toISOString().split("T")[0] : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payoutId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction(`payout_${status}`, "payout", payoutId, { status });

  return { ok: true };
}

export async function getAllTipsSummary(): Promise<
  AdminResult<{ totalTips: number; totalAmount: number; thisMonth: number; thisMonthAmount: number }>
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authorized" };
  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;

  const [allResult, monthResult] = await Promise.all([
    serviceClient.from("tips").select("amount", { count: "exact" }),
    serviceClient.from("tips").select("amount", { count: "exact" }).gte("created_at", monthStart),
  ]);

  const allTips = allResult.data ?? [];
  const monthTips = monthResult.data ?? [];

  return {
    ok: true,
    data: {
      totalTips: allResult.count ?? 0,
      totalAmount: allTips.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0),
      thisMonth: monthResult.count ?? 0,
      thisMonthAmount: monthTips.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0),
    },
  };
}

export async function getProfilesForReview(
  page = 1,
  pageSize = 20
): Promise<AdminResult<{ profiles: { id: string; email: string; full_name: string | null; username: string | null; avatar_url: string | null; sport: string | null; bio: string | null; moderation_status: string }[]; total: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authorized" };
  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await serviceClient
    .from("profiles")
    .select("id, email, full_name, username, avatar_url, sport, bio, moderation_status", { count: "exact" })
    .or("moderation_status.neq.approved,moderation_status.is.null")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { profiles: data ?? [], total: count ?? 0 } };
}

export async function moderateProfile(
  userId: string,
  action: "approve" | "flag"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authorized" };
  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await serviceClient
    .from("profiles")
    .update({ moderation_status: action === "approve" ? "approved" : "flagged" })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction(
    `moderate_profile_${action}`,
    "profile",
    userId,
    { action }
  );

  return { ok: true };
}

/**
 * Write an entry to the audit_log table.
 * Caller must already be an authenticated admin (verified inside).
 */
export async function logAdminAction(
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {}
): Promise<AdminResult<Record<string, unknown>>> {
  const parsed = LogActionSchema.safeParse({ action, targetType, targetId, metadata });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authorized" };

  const isAuthorized = await verifyAdmin(supabase, user);
  if (!isAuthorized) return { ok: false, error: "Not authorized" };

  const { data, error } = await supabase
    .from("audit_log")
    .insert({
      admin_id: user.id,
      action: parsed.data.action,
      target_type: parsed.data.targetType,
      target_id: parsed.data.targetId ?? null,
      metadata: parsed.data.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    console.error("[admin] logAdminAction failed", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}
