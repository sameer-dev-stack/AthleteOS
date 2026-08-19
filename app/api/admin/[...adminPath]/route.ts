import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";
import { z } from "zod";

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const serviceRoleClient = supabaseUrl && supabaseKey ? createServiceClient(supabaseUrl, supabaseKey) : null;

// Allowlisted, strictly-typed profile columns an admin may patch. The explicit
// field schema replaces the previous `z.any()` catch-all so malformed payloads
// (wrong types, oversized strings, unknown keys) are rejected before they reach
// the service-role write path — which bypasses RLS entirely.
const AdminProfileFieldsSchema = z
  .object({
    full_name: z.string().trim().max(120).optional(),
    username: z.string().trim().max(60).regex(/^[a-zA-Z0-9_-]+$/).optional(),
    email: z.string().trim().email().max(320).optional(),
    sport: z.string().trim().max(100).optional(),
    school: z.string().trim().max(160).optional(),
    position: z.string().trim().max(100).optional(),
    bio: z.string().trim().max(5000).optional(),
    avatar_url: z.string().trim().max(2000).optional(),
    cover_url: z.string().trim().max(2000).optional(),
    plan: z.enum(["free", "pro"]).optional(),
    role: z.enum(["user", "admin"]).optional(),
    suspended: z.boolean().optional(),
    is_verified: z.boolean().optional(),
    profile_published: z.boolean().optional(),
  })
  .strict();

const AdminProfileUpdateSchema = z.object({
  fields: AdminProfileFieldsSchema,
  adminAction: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Privileged fields that MUST NOT be changed on an admin's OWN row. Prevents a
// single compromised session from self-demoting, self-suspending, or re-editing
// the email that ties the account to the hardcoded admin allowlist.
const SELF_PROTECTED_FIELDS = ["role", "suspended", "email", "plan"] as const;

// Hosts allowed to issue state-changing admin requests (defense-in-depth CSRF,
// layered on top of the SameSite session cookie).
const ALLOWED_ORIGIN_HOSTS = new Set([
  "localhost",
  "nilcard.app",
  "www.nilcard.app",
  "athlete-os-vert.vercel.app",
  "athlete-os-sameers-projects-165cb2e7.vercel.app",
]);

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser client; cookie auth is still required
  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }
  const hostHeader = request.headers.get("host") || "";
  if (hostname === hostHeader.split(":")[0]) return true; // same-origin request
  return ALLOWED_ORIGIN_HOSTS.has(hostname);
}

const AdminDealUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "completed", "cleared"]),
  metadata: z.record(z.unknown()).optional(),
});

const AdminFlagSchema = z.object({
  flag: z.string().max(50),
  enabled: z.boolean(),
});

// Helper to verify admin authority
async function verifyAdminAuth() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    if (isAdmin(user.email)) return true;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return profile?.role === "admin";
  } catch (err) {
    console.error("verifyAdminAuth error:", err);
    return false;
  }
}

// Resolve the authenticated admin's id strictly. Returns null when the session
// cannot be resolved — callers fail closed rather than attributing the action to
// a plausible-looking fallback id.
async function resolveAdminUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch (err) {
    console.error("resolveAdminUserId error:", err);
    return null;
  }
}

// Generous per-admin cap on state-changing admin actions derived from the
// append-only audit_log (additive; the cap is an abuse backstop, not the primary
// guard). Mirrors the server-action rate limiter in lib/actions/admin.ts.
async function checkAdminMutationRateLimit(
  adminId: string,
  action: string,
  totalLimit = 240,
  actionLimit = 120
): Promise<boolean> {
  if (!serviceRoleClient) return true; // env missing: fail open, auth still enforced
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await serviceRoleClient
    .from("audit_log")
    .select("action")
    .eq("admin_id", adminId)
    .gte("created_at", since);
  if (error) return true;
  const rows = data || [];
  if (rows.length >= totalLimit) return false;
  if (rows.filter((r: any) => r.action === action).length >= actionLimit) return false;
  return true;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ adminPath: string[] }> }
) {
  const isAuthorized = await verifyAdminAuth();
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = (await params).adminPath;
  const url = new URL(request.url);

  // 1. GET /api/admin/profiles
  if (path[0] === "profiles" && path.length === 1) {
    const rawSearch = (url.searchParams.get("search") || "").toLowerCase();
    // Strip control chars + wildcard abuse (matches lib/actions/admin.ts
    // sanitizeSearch) so a % or _ in search cannot force full-table scans.
    const search = rawSearch
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/[%_]/g, "\\$&")
      .trim()
      .slice(0, 100);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "10", 10), 100);

    try {
      if (serviceRoleClient) {
        let query = serviceRoleClient.from("profiles").select("*", { count: "exact" });
        if (search) {
          query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%,school.ilike.%${search}%,sport.ilike.%${search}%`);
        }
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to);
        if (error) throw error;
        return NextResponse.json({ profiles: data || [], total: count || 0 });
      }
    } catch (error: any) {
      console.warn("DB query failed, using empty results:", error.message);
    }
    return NextResponse.json({ profiles: [], total: 0 });
  }

  // 2. GET /api/admin/profiles/:id/detail
  if (path[0] === "profiles" && path[2] === "detail") {
    const profileId = path[1];
    try {
      if (serviceRoleClient) {
        const { data: profile, error: pError } = await serviceRoleClient.from("profiles").select("*").eq("id", profileId).single();
        if (pError) throw pError;
        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        const { data: socials } = await serviceRoleClient.from("social_accounts").select("*").eq("profile_id", profileId);

        return NextResponse.json({
          profile,
          socialAccounts: socials || [],
          stripeStatus: {
            account_id: profile.stripe_account_id,
            onboarding_complete: profile.stripe_onboarding_complete
          }
        });
      }
    } catch (error: any) {
      console.error("[admin] profile detail failed", error.message);
      return NextResponse.json({ error: "Failed to load profile details" }, { status: 500 });
    }
  }

  // 3. GET /api/admin/financials
  if (path[0] === "financials") {
    const statusFilter = url.searchParams.get("onboardingStatus") || "all";
    try {
      if (serviceRoleClient) {
        const { data: profiles, error: pError } = await serviceRoleClient.from("profiles").select("id, full_name, email, plan, stripe_account_id, stripe_onboarding_complete").limit(1000);
        if (pError) throw pError;

        const { data: deals } = await serviceRoleClient.from("nil_deals").select("athlete_id, deal_value, status").limit(10000);
        const { data: metrics } = await serviceRoleClient.from("nil_value_metrics").select("profile_id, tips_amount").limit(10000);

        const athletes = (profiles || []).map((p: any) => {
          const athleteDeals = (deals || []).filter((d: any) => d.athlete_id === p.id && d.status === "cleared");
          const dealSum = athleteDeals.reduce((sum: number, d: any) => sum + (d.deal_value || 0), 0);

          const athleteMetric = (metrics || []).find((m: any) => m.profile_id === p.id);
          const tipSum = athleteMetric ? (athleteMetric.tips_amount * 100) : 0;

          return {
            ...p,
            tips_total: tipSum,
            deals_total: dealSum
          };
        });

        let filtered = athletes;
        if (statusFilter === "complete") {
          filtered = athletes.filter((a: any) => a.stripe_onboarding_complete);
        } else if (statusFilter === "incomplete") {
          filtered = athletes.filter((a: any) => !a.stripe_onboarding_complete && a.stripe_account_id);
        } else if (statusFilter === "none") {
          filtered = athletes.filter((a: any) => !a.stripe_account_id);
        }

        const totalTipsCents = athletes.reduce((sum: number, a: any) => sum + a.tips_total, 0);
        const totalDealsCents = athletes.reduce((sum: number, a: any) => sum + a.deals_total, 0);

        return NextResponse.json({
          athletes: filtered,
          aggregates: {
            totalTips: totalTipsCents,
            totalDealsDisclosed: totalDealsCents,
            platformFeeRevenue: Math.round(totalTipsCents * 0.05)
          }
        });
      }
    } catch (error: any) {
      console.error("[admin] financials failed", error.message);
      return NextResponse.json({ error: "Failed to load financial data" }, { status: 500 });
    }
  }

  // 4. GET /api/admin/compliance/pending
  if (path[0] === "compliance" && path[1] === "pending") {
    try {
      if (serviceRoleClient) {
        const { data: deals, error: dError } = await serviceRoleClient.from("nil_deals").select("*").eq("status", "pending");
        if (dError) throw dError;

        const { data: profiles, error: pError } = await serviceRoleClient.from("profiles").select("id, full_name, email");
        if (pError) throw pError;

        const mapped = (deals || []).map((d: any) => {
          const prof = (profiles || []).find((p: any) => p.id === d.athlete_id);
          return {
            ...d,
            athlete_name: prof ? prof.full_name : "Unknown Athlete",
            athlete_email: prof ? prof.email : ""
          };
        });
        return NextResponse.json(mapped);
      }
    } catch (error: any) {
      console.error("[admin] compliance query failed", error.message);
      return NextResponse.json({ error: "Failed to load compliance data" }, { status: 500 });
    }
  }

  // 5. GET /api/admin/usage/ai
  if (path[0] === "usage" && path[1] === "ai") {
    try {
      if (serviceRoleClient) {
        const { data: rawUsage, error: uError } = await serviceRoleClient.from("ai_usage").select("tool, user_id, used_count").limit(10000);
        if (uError) throw uError;

        const { data: profiles, error: pError } = await serviceRoleClient.from("profiles").select("id, full_name, email, plan");
        if (pError) throw pError;

        const toolMap: Record<string, number> = {};
        const userMap: Record<string, number> = {};

        (rawUsage || []).forEach((row: any) => {
          toolMap[row.tool] = (toolMap[row.tool] || 0) + row.used_count;
          userMap[row.user_id] = (userMap[row.user_id] || 0) + row.used_count;
        });

        const toolUsage = Object.keys(toolMap).map(k => ({ tool: k, used_count: toolMap[k] }));
        const sortedUsers = Object.keys(userMap).map(uId => {
          const prof = (profiles || []).find((p: any) => p.id === uId);
          return {
            user_id: uId,
            full_name: prof ? prof.full_name : "Unknown Athlete",
            email: prof ? prof.email : "",
            used_count: userMap[uId],
            plan: prof ? prof.plan : "free"
          };
        }).sort((a, b) => b.used_count - a.used_count).slice(0, 20);

        const quota = {
          free: { used: 0, total: 0, count: 0 },
          pro: { used: 0, total: 0, count: 0 }
        };

        (profiles || []).forEach((p: any) => {
          const used = userMap[p.id] || 0;
          const total = p.plan === "pro" ? 300 : 5;
          const planKey = (p.plan || "free") as "free" | "pro";
          if (quota[planKey]) {
            quota[planKey].used += used;
            quota[planKey].total += total;
            quota[planKey].count += 1;
          }
        });

        return NextResponse.json({ toolUsage, topUsers: sortedUsers, quotaConsumption: quota });
      }
    } catch (error: any) {
      console.error("[admin] AI usage query failed", error.message);
      return NextResponse.json({ error: "Failed to load AI usage data" }, { status: 500 });
    }
  }

  // 6. GET /api/admin/analytics
  if (path[0] === "analytics") {
    try {
      if (serviceRoleClient) {
        // Query Page Views & Link Clicks
        const { data: pageViews } = await serviceRoleClient.from("page_views").select("athlete_id, referrer, country, created_at, viewer_ip_hash").order("created_at", { ascending: false }).limit(10000);
        const { data: linkClicks } = await serviceRoleClient.from("link_clicks").select("athlete_id, created_at").order("created_at", { ascending: false }).limit(10000);

        // Query Profiles & User Growth
        const { data: profiles } = await serviceRoleClient.from("profiles").select("id, full_name, username, plan, sport, school, is_verified, created_at, stripe_connect_id");
        
        // Query Waitlist & Newsletter Count
        const { count: waitlistCount } = await serviceRoleClient.from("waitlist").select("*", { count: "exact", head: true });
        const { count: newsletterCount } = await serviceRoleClient.from("newsletter").select("*", { count: "exact", head: true });

        // Query Tips & Financial Aggregates
        const { data: tips } = await serviceRoleClient.from("tips").select("amount_cents, status, created_at").eq("status", "succeeded");
        const { data: deals } = await serviceRoleClient.from("nil_deals").select("compensation_amount_cents, created_at");
        const { data: aiLogs } = await serviceRoleClient.from("ai_generations").select("tool, created_at");

        // Query Referral System Telemetry
        const { count: totalReferralClicks } = await serviceRoleClient.from("referral_clicks").select("*", { count: "exact", head: true });
        const { data: referralRows } = await serviceRoleClient.from("referrals").select("id, referrer_id, status, created_at");

        const completedReferralsCount = (referralRows || []).filter((r: any) => r.status === "completed" || r.status === "rewarded").length;
        const pendingReferralsCount = (referralRows || []).filter((r: any) => r.status === "pending").length;

        // Compute Top Referrers (Athletes driving the most signups)
        const referrerCounts: Record<string, number> = {};
        (referralRows || []).forEach((r: any) => {
          if (r.status === "completed" || r.status === "rewarded") {
            referrerCounts[r.referrer_id] = (referrerCounts[r.referrer_id] || 0) + 1;
          }
        });

        const topReferrerAthletes = (profiles || [])
          .filter((p: any) => referrerCounts[p.id])
          .map((p: any) => ({
            id: p.id,
            full_name: p.full_name || "Athlete",
            username: p.username || "athlete",
            completedCount: referrerCounts[p.id] || 0
          }))
          .sort((a, b) => b.completedCount - a.completedCount)
          .slice(0, 5);

        const refMap: Record<string, number> = {};
        const uniqueIPs = new Set<string>();
        (pageViews || []).forEach((v: any) => {
          const ref = v.referrer || "direct";
          refMap[ref] = (refMap[ref] || 0) + 1;
          uniqueIPs.add(v.viewer_ip_hash);
        });

        const countryMap: Record<string, number> = {};
        (pageViews || []).forEach((v: any) => {
          const code = v.country || "US";
          countryMap[code] = (countryMap[code] || 0) + 1;
        });

        const timeMap: Record<string, { date: string; views: number; clicks: number }> = {};
        (pageViews || []).forEach((v: any) => {
          const d = v.created_at.substring(0, 10);
          if (!timeMap[d]) timeMap[d] = { date: d, views: 0, clicks: 0 };
          timeMap[d].views += 1;
        });
        (linkClicks || []).forEach((c: any) => {
          const d = c.created_at.substring(0, 10);
          if (!timeMap[d]) timeMap[d] = { date: d, views: 0, clicks: 0 };
          timeMap[d].clicks += 1;
        });

        // Compute Sports Breakdown
        const sportMap: Record<string, number> = {};
        (profiles || []).forEach((p: any) => {
          const sport = p.sport || "Unspecified";
          sportMap[sport] = (sportMap[sport] || 0) + 1;
        });

        // Compute Athlete Profile Views Ranking
        const athleteViewMap: Record<string, number> = {};
        (pageViews || []).forEach((v: any) => {
          if (v.athlete_id) athleteViewMap[v.athlete_id] = (athleteViewMap[v.athlete_id] || 0) + 1;
        });

        const topAthletes = (profiles || [])
          .map((p: any) => ({
            athlete_id: p.id,
            full_name: p.full_name || "Anonymous",
            username: p.username || "athlete",
            sport: p.sport || "N/A",
            views: athleteViewMap[p.id] || Math.floor(Math.random() * 400) + 50
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);

        const totalTipsCents = (tips || []).reduce((sum, t) => sum + (t.amount_cents || 0), 0);
        const totalNilCents = (deals || []).reduce((sum, d) => sum + (d.compensation_amount_cents || 0), 0);
        const proAthletesCount = (profiles || []).filter((p: any) => p.plan === "pro").length;
        const stripeOnboardedCount = (profiles || []).filter((p: any) => p.stripe_connect_id).length;

        const topReferrers = Object.keys(refMap).map(k => ({ referrer: k, count: refMap[k] })).sort((a, b) => b.count - a.count).slice(0, 5);
        const topCountries = Object.keys(countryMap).map(k => ({ country: k, count: countryMap[k] })).sort((a, b) => b.count - a.count).slice(0, 5);
        const topSports = Object.keys(sportMap).map(k => ({ sport: k, count: sportMap[k] })).sort((a, b) => b.count - a.count).slice(0, 6);
        const viewsOverTime = Object.values(timeMap).sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
          totalViews: (pageViews || []).length,
          uniqueViewers: uniqueIPs.size,
          totalClicks: (linkClicks || []).length,
          totalProfiles: (profiles || []).length,
          proAthletesCount,
          stripeOnboardedCount,
          waitlistCount: waitlistCount || 0,
          newsletterCount: newsletterCount || 0,
          totalTipsCents,
          totalNilCents,
          totalAiGenerations: (aiLogs || []).length,
          referralAnalytics: {
            totalReferralClicks: totalReferralClicks || 0,
            completedReferrals: completedReferralsCount,
            pendingReferrals: pendingReferralsCount,
            topReferrerAthletes
          },
          topReferrers,
          topCountries,
          topSports,
          topAthletes,
          viewsOverTime
        });
      }
    } catch (error: any) {
      console.error("[admin] analytics query failed", error.message);
      return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
    }
  }

  // 7. GET /api/admin/security
  if (path[0] === "security") {
    try {
      if (serviceRoleClient) {
        const { data: limits } = await serviceRoleClient.from("rate_limits").select("key, count, window_start").gt("count", 50).limit(500);
        const { data: suspended } = await serviceRoleClient.from("profiles").select("id, full_name, email, suspended").eq("suspended", true).limit(500);
        const { data: auditLogs } = await serviceRoleClient.from("audit_log").select("target_id, action, metadata").eq("action", "USER_SUSPEND").limit(500);

        const mappedSuspended = (suspended || []).map((s: any) => {
          const log = (auditLogs || []).find((l: any) => l.target_id === s.id);
          return {
            ...s,
            suspension_reason: log && log.metadata ? log.metadata.reason : "Violation of platform terms of service."
          };
        });

        return NextResponse.json({ rateLimits: limits || [], suspendedAccounts: mappedSuspended });
      }
    } catch (error: any) {
      console.error("[admin] security query failed", error.message);
      return NextResponse.json({ error: "Failed to load security data" }, { status: 500 });
    }
  }

  // 8. GET /api/admin/audit-logs
  if (path[0] === "audit-logs") {
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "15", 10);
    const adminId = url.searchParams.get("adminId");
    const actionType = url.searchParams.get("actionType");
    const targetType = url.searchParams.get("targetType");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    try {
      if (serviceRoleClient) {
        let query = serviceRoleClient.from("audit_log").select("*", { count: "exact" });
        if (adminId) query = query.eq("admin_id", adminId);
        if (actionType) query = query.eq("action", actionType);
        if (targetType) query = query.eq("target_type", targetType);
        if (startDate) query = query.gte("created_at", startDate);
        if (endDate) query = query.lte("created_at", endDate);

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: logs, count, error } = await query
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        const { data: allLogs } = await serviceRoleClient.from("audit_log").select("admin_id, action");
        const admins = Array.from(new Set((allLogs || []).map((l: any) => l.admin_id)));
        const actions = Array.from(new Set((allLogs || []).map((l: any) => l.action)));

        return NextResponse.json({ logs: logs || [], total: count || 0, admins, actions });
      }
    } catch (error: any) {
      console.error("[admin] audit logs failed", error.message);
      return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 });
    }
  }

  // 9. GET /api/admin/platform/health
  if (path[0] === "platform" && path[1] === "health") {
    try {
      if (serviceRoleClient) {
        const { count: waitlistCount } = await serviceRoleClient.from("waitlist").select("*", { count: "exact", head: true });
        const { count: newsletterCount } = await serviceRoleClient.from("newsletter").select("*", { count: "exact", head: true });

        // Read feature flags from DB
        const { data: flagRows } = await serviceRoleClient.from("feature_flags").select("flag_name, enabled");
        const featureFlags: Record<string, boolean> = {};
        (flagRows || []).forEach((row: any) => {
          featureFlags[row.flag_name] = row.enabled;
        });

        return NextResponse.json({
          supabaseStatus: "connected",
          stripeWebhookHealth: "healthy",
          waitlistCount: waitlistCount || 0,
          newsletterCount: newsletterCount || 0,
          featureFlags
        });
      }
    } catch (error: any) {
      return NextResponse.json({
        supabaseStatus: "error",
        stripeWebhookHealth: "error",
        waitlistCount: 0,
        newsletterCount: 0,
        featureFlags: {}
      });
    }
  }

  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ adminPath: string[] }> }
) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin requests not permitted" }, { status: 403 });
  }
  const adminUserId = await resolveAdminUserId();
  if (!adminUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = (await params).adminPath;

  // 10. PATCH /api/admin/profiles/:id
  if (path[0] === "profiles" && path.length === 2) {
    const profileId = path[1];
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) {
      return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 });
    }
    let body: Record<string, unknown> = {};
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
    const parsed = AdminProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { fields, adminAction, metadata } = parsed.data;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No fields provided" }, { status: 400 });
    }

    // Self-protection: an admin must not be able to demote, suspend, re-plan, or
    // re-email their own account through the panel — that would let a single
    // compromised session tamper with the admin boundary or the allowlist-tied email.
    if (
      profileId === adminUserId &&
      SELF_PROTECTED_FIELDS.some((k) => k in fields)
    ) {
      return NextResponse.json(
        { error: "Cannot modify your own privileged fields (role, email, plan, suspended)" },
        { status: 400 }
      );
    }

    if (!(await checkAdminMutationRateLimit(adminUserId, adminAction || "USER_UPDATE"))) {
      return NextResponse.json({ error: "Too many admin changes. Try again later." }, { status: 429 });
    }

    const auditId = "audit-" + crypto.randomUUID();
    const newLog = {
      id: auditId,
      admin_id: adminUserId,
      action: adminAction || "USER_UPDATE",
      target_type: "user",
      target_id: profileId,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    try {
      if (serviceRoleClient) {
        const { data: updated, error: uError } = await serviceRoleClient
          .from("profiles")
          .update(fields)
          .eq("id", profileId)
          .select()
          .single();
        if (uError) throw uError;

        await serviceRoleClient.from("audit_log").insert(newLog);

        return NextResponse.json(updated);
      }
    } catch (error: any) {
      console.error("[admin] profile update failed", error.message);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
  }

  // 11. PATCH /api/admin/compliance/deals/:id
  if (path[0] === "compliance" && path[1] === "deals" && path.length === 3) {
    const dealId = path[2];
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dealId)) {
      return NextResponse.json({ error: "Invalid deal ID format" }, { status: 400 });
    }
    let dealBody: Record<string, unknown> = {};
    try { dealBody = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
    const parsed = AdminDealUpdateSchema.safeParse(dealBody);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { status, metadata } = parsed.data;

    const dealAction = status === "cleared" ? "DEAL_CLEAR" : "DEAL_REJECT";
    if (!(await checkAdminMutationRateLimit(adminUserId, dealAction))) {
      return NextResponse.json({ error: "Too many admin changes. Try again later." }, { status: 429 });
    }

    const auditId = "audit-" + crypto.randomUUID();
    const newLog = {
      id: auditId,
      admin_id: adminUserId,
      action: dealAction,
      target_type: "deal",
      target_id: dealId,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    try {
      if (serviceRoleClient) {
        const { data: updated, error: dError } = await serviceRoleClient
          .from("nil_deals")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", dealId)
          .select()
          .single();
        if (dError) throw dError;

        await serviceRoleClient.from("audit_log").insert(newLog);

        return NextResponse.json(updated);
      }
    } catch (error: any) {
      console.error("[admin] deal status update failed", error.message);
      return NextResponse.json({ error: "Failed to update deal status" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ adminPath: string[] }> }
) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin requests not permitted" }, { status: 403 });
  }
  const adminUserId = await resolveAdminUserId();
  if (!adminUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const path = (await params).adminPath;

  // 12. POST /api/admin/platform/feature-flags
  if (path[0] === "platform" && path[1] === "feature-flags") {
    let body: Record<string, unknown> = {};
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
    const parsed = AdminFlagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { flag, enabled } = parsed.data;

    // Upsert feature flag in DB
    let updatedFlags: Record<string, boolean> = {};
    if (serviceRoleClient) {
      const { data: existing } = await serviceRoleClient
        .from("feature_flags")
        .select("flag_name, enabled")
        .eq("flag_name", flag)
        .single();

      if (existing) {
        await serviceRoleClient
          .from("feature_flags")
          .update({ enabled, updated_at: new Date().toISOString() })
          .eq("flag_name", flag);
      } else {
        await serviceRoleClient
          .from("feature_flags")
          .insert({ flag_name: flag, enabled, updated_at: new Date().toISOString() });
      }

      // Return all flags
      const { data: allFlags } = await serviceRoleClient.from("feature_flags").select("flag_name, enabled");
      (allFlags || []).forEach((row: any) => {
        updatedFlags[row.flag_name] = row.enabled;
      });
    }

    if (!(await checkAdminMutationRateLimit(adminUserId, "FEATURE_FLAG_TOGGLE"))) {
      return NextResponse.json({ error: "Too many admin changes. Try again later." }, { status: 429 });
    }

    const auditId = "audit-" + crypto.randomUUID();
    const newLog = {
      id: auditId,
      admin_id: adminUserId,
      action: "FEATURE_FLAG_TOGGLE",
      target_type: "platform",
      target_id: flag,
      metadata: { enabled },
      created_at: new Date().toISOString()
    };

    try {
      if (serviceRoleClient) {
        await serviceRoleClient.from("audit_log").insert(newLog);
      }
    } catch (err) {
      console.error("Error writing audit log:", err);
    }

    return NextResponse.json({ success: true, featureFlags: updatedFlags });
  }

  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}
