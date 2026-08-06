"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { BarChart3, Eye, MousePointerClick, Globe, ExternalLink, MessageCircle, DollarSign, Download, FileText, Calendar, ArrowRightLeft, Smartphone, Monitor, Tablet, TrendingUp, Link2, Mail, Clock, Trash2, Send, X } from "lucide-react";
import {
  getAnalytics,
  generateShareableReport,
  scheduleAnalyticsReport,
  getScheduledReports,
  deleteScheduledReport,
  sendAnalyticsReportEmail,
  type AnalyticsData,
  type AnalyticsRange,
  type ScheduledReport,
} from "@/lib/actions/analytics";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "./empty-state";

type Props = {
  athleteId: string;
  themeAccent?: string;
};

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  if (pct === 0) return null;
  return (
    <span className={`text-xs font-semibold ${pct > 0 ? "text-emerald-400" : "text-red-400"}`}>
      {pct > 0 ? "+" : ""}{pct}%
    </span>
  );
}

function DeviceIcon({ device }: { device: string }) {
  if (device === "Mobile") return <Smartphone className="h-3.5 w-3.5" />;
  if (device === "Tablet") return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
}

export function AnalyticsPanel({ athleteId, themeAccent = "#C6FF3D" }: Props) {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [compare, setCompare] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFreq, setScheduleFreq] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [scheduleRange, setScheduleRange] = useState<AnalyticsRange>("30d");
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [showScheduled, setShowScheduled] = useState(false);

  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = () => {
      const start = range === "custom" ? customStart || undefined : undefined;
      const end = range === "custom" ? customEnd || undefined : undefined;
      getAnalytics(athleteId, range, start, end, compare).then((result) => {
        if (cancelled) return;
        if (result.ok && result.data) {
          setData(result.data);
          setError(null);
        } else {
          setError(result?.error || "Failed to load analytics");
        }
        setLoading(false);
      }).catch((err) => {
        if (cancelled) return;
        console.error("[AnalyticsPanel] fetchData error:", err);
        setError(err?.message || "Failed to load analytics");
        setLoading(false);
      });
    };

    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });
    fetchData();

    return () => {
      cancelled = true;
    };
  }, [athleteId, range, customStart, customEnd, compare]);

  useEffect(() => {
    if (showScheduled) {
      getScheduledReports(athleteId).then((res) => {
        if (res.ok && res.data) setScheduledReports(res.data);
      });
    }
  }, [athleteId, showScheduled]);

  const handleExportCSV = () => {
    if (!data) return;
    setExporting(true);
    const rangeLabel = range === "custom" ? `${customStart}_to_${customEnd}` : range;
    const rows: string[] = [
      "AthleteOS Analytics Report",
      `Generated,${new Date().toISOString()}`,
      `Range,${rangeLabel}`,
      "",
      "Overview",
      "Metric,Value",
      `Total Views,${data.totalViews}`,
      `Unique Visitors,${data.uniqueVisitors}`,
      `Link Clicks,${data.totalClicks}`,
      `Inquiries,${data.totalInquiries}`,
      `Tips Received,$${data.totalTipsReceived.toFixed(2)}`,
      "",
      "Engagement",
      "Metric,Value",
      `Click Rate,${data.engagement.clickRate.toFixed(2)}%`,
      `Inquiry Rate,${data.engagement.inquiryRate.toFixed(2)}%`,
      `Tip Rate,$${data.engagement.tipRate.toFixed(2)}`,
      `Avg Views/Day,${data.engagement.avgViewsPerDay.toFixed(1)}`,
    ];

    if (data.previousPeriod) {
      const prev = data.previousPeriod;
      const pct = (c: number, p: number) => p > 0 ? Math.round(((c - p) / p) * 100) : 0;
      rows.push("", "Previous Period Comparison", "Metric,Previous,Change%");
      rows.push(`Total Views,${prev.totalViews},${pct(data.totalViews, prev.totalViews)}`);
      rows.push(`Link Clicks,${prev.totalClicks},${pct(data.totalClicks, prev.totalClicks)}`);
      rows.push(`Inquiries,${prev.totalInquiries},${pct(data.totalInquiries, prev.totalInquiries)}`);
    }

    if (data.viewsByDay.length > 0) {
      rows.push("", "Daily Views", "Date,Views");
      data.viewsByDay.forEach((d) => rows.push(`${d.date},${d.count}`));
    }

    if (data.topReferrers.length > 0) {
      rows.push("", "Top Referrers", "Referrer,Count");
      data.topReferrers.forEach((r) => rows.push(`"${r.referrer}",${r.count}`));
    }

    if (data.topLinks.length > 0) {
      rows.push("", "Top Links", "Link,Clicks");
      data.topLinks.forEach((l) => rows.push(`"${l.label}",${l.clicks}`));
    }

    if (data.geoBreakdown.length > 0) {
      rows.push("", "Geography", "Country,Count");
      data.geoBreakdown.forEach((g) => rows.push(`${g.country},${g.count}`));
    }

    if (data.demographics.devices.length > 0) {
      rows.push("", "Devices", "Device,Count");
      data.demographics.devices.forEach((d) => rows.push(`${d.device},${d.count}`));
    }

    if (data.demographics.browsers.length > 0) {
      rows.push("", "Browsers", "Browser,Count");
      data.demographics.browsers.forEach((b) => rows.push(`${b.browser},${b.count}`));
    }

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `athleteos-analytics-${rangeLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 500);
  };

  const handleExportPDF = () => {
    if (!data) return;
    setExporting(true);
    const w = window.open("", "_blank");
    if (!w) { setExporting(false); return; }

    const maxDay = Math.max(...data.viewsByDay.map((d) => d.count), 1);
    const chartBars = data.viewsByDay.slice(-30).map((d) => {
      const h = Math.max((d.count / maxDay) * 120, 2);
      return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:8px;"><div style="width:100%;max-width:16px;background:#C6FF3D;border-radius:3px 3px 0 0;height:${h}px;"></div><div style="font-size:8px;color:#666;margin-top:4px;writing-mode:vertical-lr;transform:rotate(180deg);max-height:40px;overflow:hidden;">${d.date.slice(5)}</div></div>`;
    }).join("");

    const deviceChart = data.demographics.devices.map((d) => {
      const total = data.demographics.devices.reduce((s, x) => s + x.count, 0);
      const pct = total > 0 ? (d.count / total) * 100 : 0;
      return `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:12px;color:#fff;margin-bottom:4px;"><span>${d.device}</span><span style="color:#C6FF3D">${pct.toFixed(0)}%</span></div><div style="height:6px;background:#222;border-radius:3px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:#C6FF3D;border-radius:3px;"></div></div></div>`;
    }).join("");

    const referrerChart = data.topReferrers.slice(0, 6).map((r) => {
      const maxRef = Math.max(...data.topReferrers.map((x) => x.count), 1);
      const pct = (r.count / maxRef) * 100;
      return `<div style="margin-bottom:6px;"><div style="display:flex;justify-content:space-between;font-size:12px;color:#fff;margin-bottom:3px;"><span style="max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.referrer}</span><span style="color:#C6FF3D">${r.count}</span></div><div style="height:5px;background:#222;border-radius:3px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:#C6FF3D;border-radius:3px;"></div></div></div>`;
    }).join("");

    const prev = data.previousPeriod;
    const pctChange = (c: number, p: number) => {
      if (p === 0 && c === 0) return { text: "0%", color: "#888" };
      const pct = p > 0 ? Math.round(((c - p) / p) * 100) : c > 0 ? 100 : 0;
      return { text: `${pct > 0 ? "+" : ""}${pct}%`, color: pct > 0 ? "#34d399" : pct < 0 ? "#f87171" : "#888" };
    };

    w.document.write(`
      <html><head><title>AthleteOS Analytics Report</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:system-ui,-apple-system,sans-serif;background:#0A0A0B;color:#fff;padding:0}
        .page{max-width:800px;margin:0 auto;padding:48px 40px}
        .header{margin-bottom:40px}
        .badge{display:inline-block;background:#C6FF3D;color:#0A0A0B;font-weight:900;font-size:10px;padding:4px 10px;border-radius:6px;letter-spacing:1px;text-transform:uppercase}
        h1{font-size:28px;font-weight:900;margin:16px 0 4px;text-transform:uppercase;letter-spacing:-0.5px}
        .subtitle{color:#888;font-size:13px}
        h2{font-size:14px;color:#888;margin:32px 0 16px;text-transform:uppercase;letter-spacing:1px;font-weight:700;border-bottom:1px solid #222;padding-bottom:8px}
        .stats-row{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px}
        .stat-card{flex:1;min-width:130px;background:#16161A;border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:20px;text-align:center}
        .stat-card .label{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px}
        .stat-card .value{font-size:28px;font-weight:900;color:#fff}
        .stat-card .value.accent{color:#C6FF3D}
        .stat-card .value.green{color:#34d399}
        .chart-container{background:#16161A;border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:24px;margin-bottom:8px}
        .chart-title{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;font-weight:700}
        .bar-chart{display:flex;align-items:flex-end;gap:3px;height:140px;padding-top:10px}
        .two-col{display:flex;gap:16px}
        .two-col > div{flex:1}
        table{width:100%;border-collapse:collapse}
        td{padding:10px 12px;border-bottom:1px solid #1a1a1e;font-size:13px;color:#ccc}
        td:last-child{text-align:right;color:#C6FF3D;font-weight:600}
        .footer{margin-top:48px;padding-top:24px;border-top:1px solid #222;text-align:center;color:#555;font-size:11px}
        @media print{body{background:#111113} .page{padding:24px}}
      </style></head><body>
      <div class="page">
        <div class="header">
          <span class="badge">AthleteOS</span>
          <h1>Analytics Report</h1>
          <p class="subtitle">Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} | Range: ${range === "custom" ? `${customStart} to ${customEnd}` : range === "7d" ? "Last 7 days" : range === "90d" ? "Last 90 days" : "Last 30 days"}</p>
        </div>

        <div class="stats-row">
          <div class="stat-card"><div class="label">Total Views</div><div class="value">${data.totalViews.toLocaleString()}</div></div>
          <div class="stat-card"><div class="label">Unique Visitors</div><div class="value">${data.uniqueVisitors.toLocaleString()}</div></div>
          <div class="stat-card"><div class="label">Link Clicks</div><div class="value accent">${data.totalClicks.toLocaleString()}</div></div>
          <div class="stat-card"><div class="label">Inquiries</div><div class="value">${data.totalInquiries.toLocaleString()}</div></div>
          <div class="stat-card"><div class="label">Tips Received</div><div class="value green">$${data.totalTipsReceived.toFixed(2)}</div></div>
        </div>

        <div class="stats-row">
          <div class="stat-card"><div class="label">Click Rate</div><div class="value accent">${data.engagement.clickRate.toFixed(1)}%</div></div>
          <div class="stat-card"><div class="label">Inquiry Rate</div><div class="value">${data.engagement.inquiryRate.toFixed(2)}%</div></div>
          <div class="stat-card"><div class="label">Avg Views/Day</div><div class="value">${data.engagement.avgViewsPerDay.toFixed(0)}</div></div>
        </div>

        ${data.viewsByDay.length > 0 ? `
        <h2>Views Over Time</h2>
        <div class="chart-container">
          <div class="bar-chart">${chartBars}</div>
        </div>` : ""}

        ${prev ? `
        <h2>vs Previous Period</h2>
        <div class="chart-container">
          <table>
            <tr><td>Total Views</td><td>${prev.totalViews.toLocaleString()} <span style="color:${pctChange(data.totalViews, prev.totalViews).color};margin-left:8px">${pctChange(data.totalViews, prev.totalViews).text}</span></td></tr>
            <tr><td>Link Clicks</td><td>${prev.totalClicks.toLocaleString()} <span style="color:${pctChange(data.totalClicks, prev.totalClicks).color};margin-left:8px">${pctChange(data.totalClicks, prev.totalClicks).text}</span></td></tr>
            <tr><td>Inquiries</td><td>${prev.totalInquiries.toLocaleString()} <span style="color:${pctChange(data.totalInquiries, prev.totalInquiries).color};margin-left:8px">${pctChange(data.totalInquiries, prev.totalInquiries).text}</span></td></tr>
            <tr><td>Tips</td><td>$${prev.totalTipsReceived.toFixed(2)} <span style="color:${pctChange(data.totalTipsReceived, prev.totalTipsReceived).color};margin-left:8px">${pctChange(data.totalTipsReceived, prev.totalTipsReceived).text}</span></td></tr>
          </table>
        </div>` : ""}

        <div class="two-col">
          ${data.topReferrers.length > 0 ? `
          <div>
            <h2>Top Referrers</h2>
            <div class="chart-container">
              ${referrerChart || `<table>${data.topReferrers.map(r => `<tr><td>${r.referrer}</td><td>${r.count.toLocaleString()}</td></tr>`).join("")}</table>`}
            </div>
          </div>` : ""}
          ${data.demographics.devices.length > 0 ? `
          <div>
            <h2>Devices</h2>
            <div class="chart-container">
              ${deviceChart}
            </div>
          </div>` : ""}
        </div>

        ${data.topLinks.length > 0 ? `
        <h2>Top Links</h2>
        <div class="chart-container">
          <table>${data.topLinks.map(l => `<tr><td>${l.label}</td><td>${l.clicks.toLocaleString()}</td></tr>`).join("")}</table>
        </div>` : ""}

        ${data.geoBreakdown.length > 0 ? `
        <h2>Geography</h2>
        <div class="chart-container">
          <table>${data.geoBreakdown.map(g => `<tr><td>${g.country}</td><td>${g.count.toLocaleString()}</td></tr>`).join("")}</table>
        </div>` : ""}

        ${data.demographics.browsers.length > 0 ? `
        <h2>Browsers</h2>
        <div class="chart-container">
          <table>${data.demographics.browsers.map(b => `<tr><td>${b.browser}</td><td>${b.count.toLocaleString()}</td></tr>`).join("")}</table>
        </div>` : ""}

        <div class="footer">
          AthleteOS Analytics Report | ${range === "custom" ? `${customStart} to ${customEnd}` : range} | Generated ${new Date().toISOString()}
        </div>
      </div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); setExporting(false); }, 300);
  };

  const handleShareLink = async () => {
    setShareLoading(true);
    const start = range === "custom" ? customStart || undefined : undefined;
    const end = range === "custom" ? customEnd || undefined : undefined;
    const result = await generateShareableReport(athleteId, range, start, end);
    if (result.ok && result.url) {
      setShareUrl(result.url);
      setShowShareToast(true);
      await navigator.clipboard.writeText(result.url).catch(() => {});
      setTimeout(() => setShowShareToast(false), 3000);
    }
    setShareLoading(false);
  };

  const handleScheduleReport = async () => {
    if (!scheduleEmail) return;
    setScheduleLoading(true);
    const result = await scheduleAnalyticsReport(athleteId, scheduleFreq, scheduleRange, scheduleEmail);
    if (result.ok) {
      setShowScheduleModal(false);
      setScheduleEmail("");
      const reports = await getScheduledReports(athleteId);
      if (reports.ok && reports.data) setScheduledReports(reports.data);
    }
    setScheduleLoading(false);
  };

  const handleDeleteScheduled = async (id: string) => {
    const result = await deleteScheduledReport(athleteId, id);
    if (result.ok) {
      setScheduledReports((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleSendNow = async (schedRange: AnalyticsRange) => {
    const start = schedRange === "custom" ? customStart || undefined : undefined;
    const end = schedRange === "custom" ? customEnd || undefined : undefined;
    await sendAnalyticsReportEmail(athleteId, schedRange, start, end);
  };

  const totalEngagement = data
    ? data.engagement.clickRate + data.engagement.inquiryRate
    : 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <h2 className="text-lg font-semibold text-white">Analytics</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                    range === r.value
                      ? "bg-accent/15 text-accent"
                      : "text-ink-muted hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {r.label}
                </button>
              ))}
              <button
                onClick={() => setRange(range === "custom" ? "30d" : "custom")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  range === "custom"
                    ? "bg-accent/15 text-accent"
                    : "text-ink-muted hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Calendar className="h-3.5 w-3.5 inline mr-1" />
                Custom
              </button>
            </div>
            <button
              onClick={() => setCompare(!compare)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
                compare
                  ? "bg-accent/15 text-accent"
                  : "text-ink-muted hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Compare
            </button>
            {data && !loading && (
              <>
                <button
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-white/[0.04] hover:text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-white/[0.04] hover:text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FileText className="h-3.5 w-3.5" />
                  PDF
                </button>
                <button
                  onClick={handleShareLink}
                  disabled={shareLoading}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-white/[0.04] hover:text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Share
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-white/[0.04] hover:text-white flex items-center gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Schedule
                </button>
                <button
                  onClick={() => setShowScheduled(!showScheduled)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
                    showScheduled
                      ? "bg-accent/15 text-accent"
                      : "text-ink-muted hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Reports
                </button>
              </>
            )}
          </div>
        </div>
        {range === "custom" && (
          <div className="flex items-center gap-3 mt-3">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none focus:border-accent/40"
            />
            <span className="text-xs text-ink-dim">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none focus:border-accent/40"
            />
          </div>
        )}
      </div>

      <div className="p-6">
        {loading && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
            <Skeleton className="h-24 rounded-lg" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            {data.totalViews === 0 && data.totalClicks === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                  <BarChart3 className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-base font-semibold text-white">No analytics yet</h3>
                <p className="mt-2 max-w-sm mx-auto text-sm text-ink-muted">
                  Views, clicks, and visitor data will appear here once people start viewing your public card.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Link
                    href="/dashboard/profile"
                    className="rounded-lg bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                  >
                    View your card
                  </Link>
                </div>
                <div className="mt-6 mx-auto max-w-xs rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-ink-dim mb-3">What you will see</p>
                  <div className="space-y-2 text-left">
                    {["Total views & unique visitors", "Daily traffic trends", "Top referrers & geo data", "Link click tracking"].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-ink-muted">
                        <div className="h-1 w-1 rounded-full bg-accent/40" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-ink-muted">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Total views</span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl font-bold text-white">
                    {data.totalViews.toLocaleString()}
                  </p>
                  {data.previousPeriod && (
                    <DeltaBadge current={data.totalViews} previous={data.previousPeriod.totalViews} />
                  )}
                </div>
                {data.previousPeriod && <p className="text-[10px] text-ink-dim mt-1">vs previous period</p>}
              </div>
              <div className="rounded-lg bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-ink-muted">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Unique visitors</span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl font-bold text-white">
                    {data.uniqueVisitors.toLocaleString()}
                  </p>
                  {data.previousPeriod && (
                    <DeltaBadge current={data.uniqueVisitors} previous={data.previousPeriod.uniqueVisitors} />
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-ink-muted">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Link clicks</span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl font-bold text-accent">
                    {data.totalClicks.toLocaleString()}
                  </p>
                  {data.previousPeriod && (
                    <DeltaBadge current={data.totalClicks} previous={data.previousPeriod.totalClicks} />
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div className="rounded-lg bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-ink-muted">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Inquiries</span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl font-bold text-white">
                    {data.totalInquiries.toLocaleString()}
                  </p>
                  {data.previousPeriod && (
                    <DeltaBadge current={data.totalInquiries} previous={data.previousPeriod.totalInquiries} />
                  )}
                </div>
                <p className="text-[10px] text-ink-dim mt-1">Brand inquiries received</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-ink-muted">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Tips received</span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl font-bold text-emerald-400">
                    ${data.totalTipsReceived.toFixed(2)}
                  </p>
                  {data.previousPeriod && (
                    <DeltaBadge current={data.totalTipsReceived} previous={data.previousPeriod.totalTipsReceived} />
                  )}
                </div>
                <p className="text-[10px] text-ink-dim mt-1">Fan support earned</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4 mt-4">
              <div className="rounded-lg bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-ink-muted">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Click rate</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-accent">
                  {data.engagement.clickRate.toFixed(1)}%
                </p>
                <p className="text-[10px] text-ink-dim mt-1">Clicks / views</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-ink-muted">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Inquiry rate</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-white">
                  {data.engagement.inquiryRate.toFixed(2)}%
                </p>
                <p className="text-[10px] text-ink-dim mt-1">Inquiries / views</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-ink-muted">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Tip rate</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  ${data.engagement.tipRate.toFixed(2)}
                </p>
                <p className="text-[10px] text-ink-dim mt-1">Revenue / view</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-ink-muted">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Avg views/day</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-white">
                  {data.engagement.avgViewsPerDay.toFixed(0)}
                </p>
                <p className="text-[10px] text-ink-dim mt-1">Daily average</p>
              </div>
            </div>

            {data.viewsByDay.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-dim">
                  Views by day
                </p>
                {(() => {
                  const maxCount = Math.max(...data.viewsByDay.map((d) => d.count), 1);
                  return (
                    <>
                      <div className="flex items-end gap-1 h-24">
                        {data.viewsByDay.map((day) => {
                          const height = Math.max((day.count / maxCount) * 100, 4);
                          return (
                            <div
                              key={day.date}
                              className="flex-1 group/bar relative rounded-t bg-accent/40 transition-all hover:bg-accent"
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                {day.count} views
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-ink-dim">
                        <span>{data.viewsByDay[0]?.date}</span>
                        {data.viewsByDay.length > 2 && (
                          <span>{data.viewsByDay[Math.floor(data.viewsByDay.length / 2)]?.date}</span>
                        )}
                        <span>{data.viewsByDay[data.viewsByDay.length - 1]?.date}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {data.topReferrers.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-dim">
                    Top referrers
                  </p>
                  <div className="space-y-2">
                    {data.topReferrers.map((r) => (
                      <div
                        key={r.referrer}
                        className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
                      >
                        <span className="flex items-center gap-2 text-sm text-white">
                          <Globe className="h-3 w-3 text-ink-dim" />
                          {r.referrer}
                        </span>
                        <span className="text-xs text-ink-muted">
                          {r.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.topLinks.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-dim">
                    Top links
                  </p>
                  <div className="space-y-2">
                    {data.topLinks.map((l) => (
                      <div
                        key={l.url}
                        className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
                      >
                        <span className="flex items-center gap-2 text-sm text-white">
                          <ExternalLink className="h-3 w-3 text-ink-dim" />
                          <span className="truncate">{l.label}</span>
                        </span>
                        <span className="text-xs text-ink-muted">
                          {l.clicks.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.geoBreakdown.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-dim">
                    Top countries
                  </p>
                  <div className="space-y-2">
                    {data.geoBreakdown.map((g) => (
                      <div
                        key={g.country}
                        className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
                      >
                        <span className="flex items-center gap-2 text-sm text-white">
                          <Globe className="h-3 w-3 text-ink-dim" />
                          {g.country}
                        </span>
                        <span className="text-xs text-ink-muted">
                          {g.count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.demographics.devices.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-dim">
                    Audience devices
                  </p>
                  <div className="space-y-2">
                    {data.demographics.devices.map((d) => {
                      const total = data.demographics.devices.reduce((s, x) => s + x.count, 0);
                      const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                      return (
                        <div
                          key={d.device}
                          className="rounded-lg bg-white/[0.03] px-3 py-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-white">
                              <DeviceIcon device={d.device} />
                              {d.device}
                            </span>
                            <span className="text-xs text-ink-muted">
                              {pct}%
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent/60"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {data.demographics.browsers.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-dim">
                    Browsers
                  </p>
                  <div className="space-y-2">
                    {data.demographics.browsers.map((b) => {
                      const total = data.demographics.browsers.reduce((s, x) => s + x.count, 0);
                      const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
                      return (
                        <div
                          key={b.browser}
                          className="rounded-lg bg-white/[0.03] px-3 py-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white">{b.browser}</span>
                            <span className="text-xs text-ink-muted">
                              {pct}%
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent/40"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>



            {showShareToast && (
              <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-black shadow-lg">
                Share link copied to clipboard
              </div>
            )}

            {showScheduled && scheduledReports.length > 0 && (
              <div className="mt-6 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-dim flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Scheduled Reports
                  </p>
                  <button onClick={() => setShowScheduled(false)} className="text-ink-dim hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {scheduledReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-white">
                          <Mail className="h-3 w-3 text-ink-dim" />
                          {report.email}
                        </div>
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase">
                          {report.frequency}
                        </span>
                        <span className="text-[10px] text-ink-dim">
                          {report.range === "7d" ? "7 days" : report.range === "90d" ? "90 days" : "30 days"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSendNow(report.range)}
                          className="rounded p-1.5 text-ink-dim hover:bg-white/[0.06] hover:text-accent transition-colors"
                          title="Send now"
                        >
                          <Send className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteScheduled(report.id)}
                          className="rounded p-1.5 text-ink-dim hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showScheduleModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#16161A] p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent" />
                      <h3 className="text-base font-semibold text-white">Schedule Report</h3>
                    </div>
                    <button onClick={() => setShowScheduleModal(false)} className="text-ink-dim hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5">Send to</label>
                      <input
                        type="email"
                        value={scheduleEmail}
                        onChange={(e) => setScheduleEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-accent/40 placeholder:text-ink-dim"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5">Frequency</label>
                      <div className="flex gap-2">
                        {(["daily", "weekly", "monthly"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setScheduleFreq(f)}
                            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                              scheduleFreq === f
                                ? "bg-accent/15 text-accent"
                                : "border border-white/[0.08] bg-white/[0.03] text-ink-muted hover:bg-white/[0.06] hover:text-white"
                            }`}
                          >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1.5">Analytics range</label>
                      <div className="flex gap-2">
                        {[{ value: "7d" as AnalyticsRange, label: "7 days" }, { value: "30d" as AnalyticsRange, label: "30 days" }, { value: "90d" as AnalyticsRange, label: "90 days" }].map((r) => (
                          <button
                            key={r.value}
                            onClick={() => setScheduleRange(r.value)}
                            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                              scheduleRange === r.value
                                ? "bg-accent/15 text-accent"
                                : "border border-white/[0.08] bg-white/[0.03] text-ink-muted hover:bg-white/[0.06] hover:text-white"
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-ink-muted hover:bg-white/[0.06] hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleScheduleReport}
                      disabled={!scheduleEmail || scheduleLoading}
                      className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-black transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {scheduleLoading ? "Scheduling..." : "Schedule"}
                    </button>
                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
