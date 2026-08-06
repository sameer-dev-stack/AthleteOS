"use server";

import { z } from "zod";
import { randomBytes } from "crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const IP_HASH_SECRET = process.env.ANALYTICS_IP_HASH_SECRET;
if (!IP_HASH_SECRET) {
  console.error("[analytics] ANALYTICS_IP_HASH_SECRET not set — IP hashing will use an insecure fallback");
}

function getSupabaseServiceRole() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createServiceClient(url, key);
}

async function hashIp(ip: string): Promise<string | null> {
  if (!IP_HASH_SECRET) return null;
  const { createHash } = await import("crypto");
  return createHash("sha256").update(`${IP_HASH_SECRET}:${ip}`).digest("hex");
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = h.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

async function getUserAgent(): Promise<string | null> {
  return (await headers()).get("user-agent");
}

async function getReferrer(): Promise<string | null> {
  return (await headers()).get("referer");
}

function parseReferrer(ref: string | null): string {
  if (!ref) return "direct";
  try {
    const url = new URL(ref);
    return url.hostname;
  } catch {
    return ref;
  }
}

type ViewResult = {
  ok: boolean;
  deduped?: boolean;
  error?: string;
};

const TrackViewSchema = z.object({
  athleteId: z.string().uuid(),
});

const TrackClickSchema = z.object({
  athleteId: z.string().uuid(),
  linkLabel: z.string().max(200),
  linkUrl: z.string().url(),
});

export async function trackView(athleteId: string): Promise<ViewResult> {
  const parsed = TrackViewSchema.safeParse({ athleteId });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const supabase = getSupabaseServiceRole();
    const ip = await getClientIp();
    const viewerIpHash = await hashIp(ip);

    const now = new Date();
    const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (viewerIpHash) {
      const { data: existing } = await supabase
        .from("page_views")
        .select("id")
        .eq("athlete_id", athleteId)
        .eq("viewer_ip_hash", viewerIpHash)
        .gte("created_at", windowStart.toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        return { ok: true, deduped: true };
      }
    }

    const h = await headers();
    const { error } = await supabase.from("page_views").insert({
      athlete_id: athleteId,
      viewer_ip_hash: viewerIpHash,
      referrer: await getReferrer(),
      user_agent: await getUserAgent(),
      country: h.get("x-vercel-ip-country"),
      city: h.get("x-vercel-ip-city"),
    });

    if (error) {
      console.error("[analytics] trackView failed:", error);
      return { ok: false, error: error.message };
    }

    // Check milestones asynchronously (non-blocking)
    try {
      const { checkMilestones } = await import("./milestones");
      checkMilestones(athleteId);
    } catch { /* non-blocking */ }

    return { ok: true, deduped: false };
  } catch (err) {
    console.error("[analytics] trackView error:", err);
    return { ok: false, error: "Failed to track view" };
  }
}

type LinkClickResult = {
  ok: boolean;
  error?: string;
};

export async function trackLinkClick(
  athleteId: string,
  linkLabel: string,
  linkUrl: string
): Promise<LinkClickResult> {
  const parsed = TrackClickSchema.safeParse({ athleteId, linkLabel, linkUrl });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const supabase = getSupabaseServiceRole();
    const ip = await getClientIp();
    const viewerIpHash = await hashIp(ip);

    const { error } = await supabase.from("link_clicks").insert({
      athlete_id: athleteId,
      link_label: linkLabel,
      link_url: linkUrl,
      viewer_ip_hash: viewerIpHash,
      referrer: await getReferrer(),
    });

    if (error) {
      console.error("[analytics] trackLinkClick failed:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    console.error("[analytics] trackLinkClick error:", err);
    return { ok: false, error: "Failed to track click" };
  }
}

// --- Shareable Report Links ---

export async function generateShareableReport(
  athleteId: string,
  range: AnalyticsRange,
  customStart?: string,
  customEnd?: string
): Promise<{ ok: boolean; token?: string; url?: string; error?: string }> {
  try {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== athleteId) {
      return { ok: false, error: "Not authorized" };
    }

    const serviceRole = getSupabaseServiceRole();
    const token = randomBytes(24).toString("hex");

    const { error } = await serviceRole.from("analytics_reports").insert({
      athlete_id: athleteId,
      token,
      range,
      custom_start: customStart || null,
      custom_end: customEnd || null,
    });

    if (error) {
      console.error("[analytics] generateShareableReport insert error:", error);
      return { ok: false, error: error.message };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app";
    const url = `${siteUrl}/api/analytics-report/${token}`;

    return { ok: true, token, url };
  } catch (err) {
    console.error("[analytics] generateShareableReport error:", err);
    return { ok: false, error: "Failed to generate report link" };
  }
}

export async function getShareableReport(
  token: string
): Promise<{ ok: boolean; data?: AnalyticsData; range?: string; error?: string }> {
  try {
    const serviceRole = getSupabaseServiceRole();

    const { data: report, error: fetchError } = await serviceRole
      .from("analytics_reports")
      .select("athlete_id, range, custom_start, custom_end")
      .eq("token", token)
      .single();

    if (fetchError || !report) {
      return { ok: false, error: "Report not found" };
    }

    const result = await getAnalytics(
      report.athlete_id,
      report.range as AnalyticsRange,
      report.custom_start || undefined,
      report.custom_end || undefined
    );

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return { ok: true, data: result.data, range: report.range };
  } catch (err) {
    console.error("[analytics] getShareableReport error:", err);
    return { ok: false, error: "Failed to load report" };
  }
}

// --- Scheduled Report Emails ---

export type ScheduledReport = {
  id: string;
  athlete_id: string;
  frequency: "daily" | "weekly" | "monthly";
  range: AnalyticsRange;
  email: string;
  enabled: boolean;
  last_sent_at: string | null;
  created_at: string;
};

export async function scheduleAnalyticsReport(
  athleteId: string,
  frequency: "daily" | "weekly" | "monthly",
  range: AnalyticsRange,
  email: string
): Promise<{ ok: boolean; data?: ScheduledReport; error?: string }> {
  try {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== athleteId) {
      return { ok: false, error: "Not authorized" };
    }

    const parsed = z.object({
      frequency: z.enum(["daily", "weekly", "monthly"]),
      range: z.enum(["7d", "30d", "90d"]),
      email: z.string().email("Invalid email address"),
    }).safeParse({ frequency, range, email });

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0].message };
    }

    const serviceRole = getSupabaseServiceRole();

    const { data, error } = await serviceRole
      .from("scheduled_reports")
      .insert({
        athlete_id: athleteId,
        frequency: parsed.data.frequency,
        range: parsed.data.range,
        email: parsed.data.email,
        enabled: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[analytics] scheduleAnalyticsReport error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data as ScheduledReport };
  } catch (err) {
    console.error("[analytics] scheduleAnalyticsReport error:", err);
    return { ok: false, error: "Failed to schedule report" };
  }
}

export async function getScheduledReports(
  athleteId: string
): Promise<{ ok: boolean; data?: ScheduledReport[]; error?: string }> {
  try {
    const { createClient: createServerClient } = await import("@/lib/supabase/server");
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== athleteId) {
      return { ok: false, error: "Not authorized" };
    }

    const serviceRole = getSupabaseServiceRole();
    const { data, error } = await serviceRole
      .from("scheduled_reports")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data || []) as ScheduledReport[] };
  } catch (err) {
    console.error("[analytics] getScheduledReports error:", err);
    return { ok: false, error: "Failed to load scheduled reports" };
  }
}

export async function deleteScheduledReport(
  athleteId: string,
  reportId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const serviceRole = getSupabaseServiceRole();
    const { error } = await serviceRole
      .from("scheduled_reports")
      .delete()
      .eq("id", reportId)
      .eq("athlete_id", athleteId);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    console.error("[analytics] deleteScheduledReport error:", err);
    return { ok: false, error: "Failed to delete report" };
  }
}

export async function sendAnalyticsReportEmail(
  athleteId: string,
  range: AnalyticsRange = "7d",
  customStart?: string,
  customEnd?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const serviceRole = getSupabaseServiceRole();
    const { data: profile } = await serviceRole
      .from("profiles")
      .select("full_name, email, username")
      .eq("id", athleteId)
      .single();

    if (!profile?.email) {
      return { ok: false, error: "No email found for athlete" };
    }

    const result = await getAnalytics(athleteId, range, customStart, customEnd);
    if (!result.ok || !result.data) {
      return { ok: false, error: result.error || "Failed to fetch analytics" };
    }

    const d = result.data;
    const dateRange = range === "custom" && customStart && customEnd
      ? `${customStart} to ${customEnd}`
      : range === "7d" ? "Last 7 days" : range === "90d" ? "Last 90 days" : "Last 30 days";

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not set" };

    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app";

    const referrerRows = d.topReferrers.slice(0, 5).map(r =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:13px;">${r.referrer}</td><td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#C6FF3D;font-size:13px;text-align:right;">${r.count.toLocaleString()}</td></tr>`
    ).join("");

    const countryRows = d.geoBreakdown.slice(0, 5).map(g =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:13px;">${g.country}</td><td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#C6FF3D;font-size:13px;text-align:right;">${g.count.toLocaleString()}</td></tr>`
    ).join("");

    const linkRows = d.topLinks.slice(0, 5).map(l =>
      `<tr><td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#fff;font-size:13px;">${l.label}</td><td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#C6FF3D;font-size:13px;text-align:right;">${l.clicks.toLocaleString()}</td></tr>`
    ).join("");

    await resend.emails.send({
      from: "AthleteOS <onboarding@resend.dev>",
      to: profile.email,
      subject: `Your AthleteOS Analytics Report — ${dateRange}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background-color:#0A0A0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0B;padding:40px 20px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#111113;border-radius:20px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
                <tr><td style="padding:40px 40px 20px;">
                  <div style="margin-bottom:24px;"><span style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:900;font-size:11px;padding:4px 10px;border-radius:6px;letter-spacing:1px;text-transform:uppercase;">ATHLETEOS</span></div>
                  <h1 style="color:#FFFFFF;font-size:24px;font-weight:900;margin:0 0 8px;text-transform:uppercase;letter-spacing:-0.5px;">Analytics Report</h1>
                  <p style="color:#88888A;font-size:14px;margin:0;">Hey ${profile.full_name || "there"}, here is your ${dateRange} performance summary.</p>
                </td></tr>
                <tr><td style="padding:0 40px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#16161A;border-radius:12px;border:1px solid rgba(255,255,255,0.04);">
                    <tr>
                      <td width="33%" align="center" style="border-right:1px solid rgba(255,255,255,0.06);padding:16px 8px;">
                        <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Views</div>
                        <div style="font-size:22px;color:#fff;font-weight:900;">${d.totalViews.toLocaleString()}</div>
                      </td>
                      <td width="33%" align="center" style="border-right:1px solid rgba(255,255,255,0.06);padding:16px 8px;">
                        <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Clicks</div>
                        <div style="font-size:22px;color:#C6FF3D;font-weight:900;">${d.totalClicks.toLocaleString()}</div>
                      </td>
                      <td width="33%" align="center" style="padding:16px 8px;">
                        <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Tips</div>
                        <div style="font-size:22px;color:#fff;font-weight:900;">$${d.totalTipsReceived.toFixed(2)}</div>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding:0 40px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#16161A;border-radius:12px;border:1px solid rgba(255,255,255,0.04);padding:16px 20px;">
                    <tr>
                      <td width="50%" align="center" style="border-right:1px solid rgba(255,255,255,0.06);padding:8px 0;">
                        <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Click Rate</div>
                        <div style="font-size:18px;color:#C6FF3D;font-weight:900;">${d.engagement.clickRate.toFixed(1)}%</div>
                      </td>
                      <td width="50%" align="center" style="padding:8px 0;">
                        <div style="font-size:11px;color:#88888A;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Inquiry Rate</div>
                        <div style="font-size:18px;color:#fff;font-weight:900;">${d.engagement.inquiryRate.toFixed(2)}%</div>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                ${d.topReferrers.length > 0 ? `
                <tr><td style="padding:0 40px 24px;">
                  <h3 style="color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Top Referrers</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#16161A;border-radius:8px;border:1px solid rgba(255,255,255,0.04);">${referrerRows}</table>
                </td></tr>` : ""}
                ${d.topLinks.length > 0 ? `
                <tr><td style="padding:0 40px 24px;">
                  <h3 style="color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Top Links</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#16161A;border-radius:8px;border:1px solid rgba(255,255,255,0.04);">${linkRows}</table>
                </td></tr>` : ""}
                ${d.geoBreakdown.length > 0 ? `
                <tr><td style="padding:0 40px 24px;">
                  <h3 style="color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Top Countries</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#16161A;border-radius:8px;border:1px solid rgba(255,255,255,0.04);">${countryRows}</table>
                </td></tr>` : ""}
                <tr><td style="padding:0 40px 40px;">
                  <a href="${SITE_URL}/dashboard" style="display:inline-block;background-color:#C6FF3D;color:#0A0A0B;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">View Full Dashboard</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    return { ok: true };
  } catch (err) {
    console.error("[analytics] sendAnalyticsReportEmail error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send report email" };
  }
}

export type AnalyticsRange = "7d" | "30d" | "90d" | "custom";

export type DeviceBreakdown = { device: string; count: number }[];
export type BrowserBreakdown = { browser: string; count: number }[];

export type Demographics = {
  devices: DeviceBreakdown;
  browsers: BrowserBreakdown;
};

export type EngagementMetrics = {
  clickRate: number;
  inquiryRate: number;
  tipRate: number;
  avgViewsPerDay: number;
};

export type AnalyticsData = {
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  totalInquiries: number;
  totalTipsReceived: number;
  topReferrers: { referrer: string; count: number }[];
  geoBreakdown: { country: string; count: number }[];
  viewsByDay: { date: string; count: number }[];
  topLinks: { label: string; url: string; clicks: number }[];
  demographics: Demographics;
  engagement: EngagementMetrics;
  previousPeriod?: {
    totalViews: number;
    uniqueVisitors: number;
    totalClicks: number;
    totalInquiries: number;
    totalTipsReceived: number;
    engagement: EngagementMetrics;
  };
};

function getRangeDays(range: AnalyticsRange): number {
  switch (range) {
    case "7d": return 7;
    case "30d": return 30;
    case "90d": return 90;
    case "custom": return 30;
    default: return 30;
  }
}

function getRangeDate(range: AnalyticsRange, customStart?: string): Date {
  if (range === "custom" && customStart) {
    return new Date(customStart);
  }
  const now = new Date();
  return new Date(now.getTime() - getRangeDays(range) * 24 * 60 * 60 * 1000);
}

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: "Unknown", browser: "Unknown" };

  let device = "Desktop";
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    device = /ipad/i.test(ua) ? "Tablet" : "Mobile";
  }

  let browser = "Other";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  return { device, browser };
}

export async function getAnalytics(
  athleteId: string,
  range: AnalyticsRange = "30d",
  customStart?: string,
  customEnd?: string,
  compare = false
): Promise<{ ok: boolean; data?: AnalyticsData; error?: string }> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user || user.id !== athleteId) {
      return { ok: false, error: "Not authorized" };
    }

    const serviceRole = getSupabaseServiceRole();

    const parseIsoDate = (d?: string, fallback = new Date()): string => {
      if (!d) return fallback.toISOString();
      try {
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
      } catch {
        return fallback.toISOString();
      }
    };

    const since = parseIsoDate(customStart, getRangeDate(range, customStart));
    const endDate = parseIsoDate(customEnd, new Date());
    const rangeDays = range === "custom" && customStart && customEnd
      ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(since).getTime()) / (24 * 60 * 60 * 1000)))
      : getRangeDays(range);
    const previousSince = new Date(new Date(since).getTime() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

    const fetchPeriod = async (start: string, end: string) => {
      const [viewsResult, clicksResult, referrersResult, geoResult, linksResult, inquiriesResult, tipsResult, uaResult] =
        await Promise.allSettled([
          serviceRole
            .from("page_views")
            .select("id, viewer_ip_hash, created_at, user_agent", { count: "exact" })
            .eq("athlete_id", athleteId)
            .gte("created_at", start)
            .lte("created_at", end),
          serviceRole
            .from("link_clicks")
            .select("id", { count: "exact" })
            .eq("athlete_id", athleteId)
            .gte("created_at", start)
            .lte("created_at", end),
          serviceRole
            .from("page_views")
            .select("referrer")
            .eq("athlete_id", athleteId)
            .gte("created_at", start)
            .lte("created_at", end)
            .not("referrer", "is", null),
          serviceRole
            .from("page_views")
            .select("country")
            .eq("athlete_id", athleteId)
            .gte("created_at", start)
            .lte("created_at", end)
            .not("country", "is", null),
          serviceRole
            .from("link_clicks")
            .select("link_label, link_url")
            .eq("athlete_id", athleteId)
            .gte("created_at", start)
            .lte("created_at", end),
          serviceRole
            .from("inquiries")
            .select("id", { count: "exact", head: true })
            .eq("athlete_id", athleteId)
            .gte("created_at", start)
            .lte("created_at", end),
          serviceRole
            .from("tips")
            .select("amount")
            .eq("athlete_id", athleteId)
            .gte("created_at", start)
            .lte("created_at", end),
          serviceRole
            .from("page_views")
            .select("user_agent")
            .eq("athlete_id", athleteId)
            .gte("created_at", start)
            .lte("created_at", end),
        ]);

      const viewsData = viewsResult.status === "fulfilled" ? (viewsResult.value.data ?? []) : [];
      const totalViews = viewsResult.status === "fulfilled" ? (viewsResult.value.count ?? 0) : 0;
      const uniqueIps = new Set(viewsData.filter(v => v?.viewer_ip_hash).map((v) => v.viewer_ip_hash));
      const uniqueVisitors = uniqueIps.size;
      const totalClicks = clicksResult.status === "fulfilled" ? (clicksResult.value.count ?? 0) : 0;
      const totalInquiries = inquiriesResult.status === "fulfilled" ? (inquiriesResult.value.count ?? 0) : 0;
      
      const tipsData = tipsResult.status === "fulfilled" ? (tipsResult.value.data ?? []) : [];
      const totalTipsReceived = tipsData.reduce((sum, t) => sum + (t?.amount || 0), 0) / 100;

      const referrersData = referrersResult.status === "fulfilled" ? (referrersResult.value.data ?? []) : [];
      const referrerCounts = new Map<string, number>();
      for (const r of referrersData) {
        if (!r?.referrer) continue;
        const ref = parseReferrer(r.referrer);
        referrerCounts.set(ref, (referrerCounts.get(ref) || 0) + 1);
      }
      const topReferrers = Array.from(referrerCounts.entries())
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const geoData = geoResult.status === "fulfilled" ? (geoResult.value.data ?? []) : [];
      const countryCounts = new Map<string, number>();
      for (const g of geoData) {
        const country = g?.country || "unknown";
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
      }
      const geoBreakdown = Array.from(countryCounts.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const dayCounts = new Map<string, number>();
      for (const v of viewsData) {
        if (!v?.created_at) continue;
        const day = typeof v.created_at === "string" ? v.created_at.slice(0, 10) : "";
        if (day) {
          dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
        }
      }
      const viewsByDay = Array.from(dayCounts.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const linksData = linksResult.status === "fulfilled" ? (linksResult.value.data ?? []) : [];
      const linkCounts = new Map<string, { label: string; url: string; clicks: number }>();
      for (const c of linksData) {
        if (!c?.link_url) continue;
        const key = c.link_url;
        const existing = linkCounts.get(key);
        if (existing) {
          existing.clicks++;
        } else {
          linkCounts.set(key, { label: c.link_label || c.link_url, url: c.link_url, clicks: 1 });
        }
      }
      const topLinks = Array.from(linkCounts.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      const uaData = uaResult.status === "fulfilled" ? (uaResult.value.data ?? []) : [];
      const deviceCounts = new Map<string, number>();
      const browserCounts = new Map<string, number>();
      for (const row of uaData) {
        const { device, browser } = parseUserAgent(row?.user_agent ?? null);
        deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
        browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1);
      }
      const devices: DeviceBreakdown = Array.from(deviceCounts.entries())
        .map(([device, count]) => ({ device, count }))
        .sort((a, b) => b.count - a.count);
      const browsers: BrowserBreakdown = Array.from(browserCounts.entries())
        .map(([browser, count]) => ({ browser, count }))
        .sort((a, b) => b.count - a.count);

      const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
      const inquiryRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;
      const tipRate = totalViews > 0 ? (totalTipsReceived / totalViews) * 100 : 0;
      const avgViewsPerDay = viewsByDay.length > 0 ? totalViews / viewsByDay.length : 0;

      return {
        totalViews,
        uniqueVisitors,
        totalClicks,
        totalInquiries,
        totalTipsReceived,
        topReferrers,
        geoBreakdown,
        viewsByDay,
        topLinks,
        demographics: { devices, browsers },
        engagement: { clickRate, inquiryRate, tipRate, avgViewsPerDay },
      };
    };

    const current = await fetchPeriod(since, endDate);

    let previousPeriod: AnalyticsData["previousPeriod"];
    if (compare) {
      const prev = await fetchPeriod(previousSince, since);
      previousPeriod = {
        totalViews: prev.totalViews,
        uniqueVisitors: prev.uniqueVisitors,
        totalClicks: prev.totalClicks,
        totalInquiries: prev.totalInquiries,
        totalTipsReceived: prev.totalTipsReceived,
        engagement: prev.engagement,
      };
    }

    return {
      ok: true,
      data: { ...current, previousPeriod },
    };
  } catch (err) {
    console.error("[analytics] getAnalytics error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to fetch analytics" };
  }
}
