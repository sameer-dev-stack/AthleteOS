"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  BarChart3,
  Eye,
  Users,
  MousePointerClick,
  Globe,
  ExternalLink,
  MessageCircle,
  DollarSign,
  Download,
  FileText,
  Calendar,
  ArrowRightLeft,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  Link2,
  Mail,
  Clock,
  Trash2,
  Send,
  X,
  Lock,
  Crown,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  athleteId: string;
  initialData?: AnalyticsData;
  themeAccent?: string;
  isPro?: boolean;
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

export function AnalyticsPanel({ athleteId, initialData, themeAccent = "#C6FF3D", isPro = false }: Props) {
  const defaultRange: AnalyticsRange = isPro ? "30d" : "7d";
  const [range, setRange] = useState<AnalyticsRange>(defaultRange);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [compare, setCompare] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLockedOverlay, setShowLockedOverlay] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        params.set("range", range);
        if (range === "custom") {
          if (customStart) params.set("customStart", customStart);
          if (customEnd) params.set("customEnd", customEnd);
        }
        if (compare) params.set("compare", "true");

        const res = await fetch(`/api/analytics?${params.toString()}`);
        if (cancelled) return;
        const result = await res.json();
        if (result.ok && result.data) {
          setData(result.data);
          setError(null);
        } else {
          setError(result?.error || "Failed to load analytics");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[AnalyticsPanel] fetchData error:", err);
        setError("Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (!initialData || range !== defaultRange || compare || customStart || customEnd) {
      setLoading(true);
      fetchData();
    }

    return () => {
      cancelled = true;
    };
  }, [athleteId, range, customStart, customEnd, compare, initialData]);

  useEffect(() => {
    if (showScheduled) {
      getScheduledReports(athleteId).then((res) => {
        if (res.ok && res.data) setScheduledReports(res.data);
      });
    }
  }, [athleteId, showScheduled]);

  const handleExportCSV = () => {
    if (!isPro) {
      setShowUpgradeModal(true);
      return;
    }
    if (!data) return;
    setExporting(true);
    const rangeLabel = range === "custom" ? `${customStart}_to_${customEnd}` : range;
    const rows: string[] = [
      "NIL CARD Analytics Report",
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

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nilcard-analytics-${rangeLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 500);
  };

  const handleRangeClick = (rVal: AnalyticsRange) => {
    if (!isPro && rVal !== "7d") {
      setShowUpgradeModal(true);
      return;
    }
    setRange(rVal);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        {/* Header Controls */}
        <div className="border-b border-white/[0.06] px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              <h2 className="text-lg font-semibold text-white">Analytics Overview</h2>
              {isPro ? (
                <span className="ml-2 text-[10px] font-bold text-accent px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30">
                  PRO UNLOCKED
                </span>
              ) : (
                <Link
                  href="/dashboard/billing"
                  className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 transition-colors hover:bg-amber-400/25"
                >
                  <Lock className="h-3 w-3" />
                  FREE PLAN
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {RANGES.map((r) => {
                  const locked = !isPro && r.value !== "7d";
                  return (
                    <button
                      key={r.value}
                      onClick={() => handleRangeClick(r.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        range === r.value
                          ? "bg-accent/15 text-accent"
                          : locked
                          ? "text-ink-dim/70 hover:bg-white/[0.03] hover:text-white/70"
                          : "text-ink-muted hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>

              {!isPro && (
                <Link
                  href="/dashboard/billing"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-bold text-black shadow-[0_0_18px_rgba(198,255,61,0.35)] transition-all hover:bg-[#b8f52b]"
                >
                  <Crown className="h-3.5 w-3.5" />
                  Upgrade
                </Link>
              )}

              {isPro && (
                <button
                  onClick={() => setCompare(!compare)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 ${
                    compare ? "bg-accent/15 text-accent" : "text-ink-muted hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Compare
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
              </div>
              <Skeleton className="h-24 rounded-lg" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Basic Summary Cards (Visible to all users) */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Eye className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-medium">Total views</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-bold text-white">
                      {data.totalViews.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-[10px] text-ink-dim mt-1">Total page impressions</p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Users className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-medium">Unique visitors</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-bold text-white">
                      {data.uniqueVisitors.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-[10px] text-ink-dim mt-1">Unique IP address sessions</p>
                </div>

                <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <MousePointerClick className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-medium">Link clicks</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-2xl font-bold text-white">
                      {isPro ? data.totalClicks.toLocaleString() : "•••"}
                    </p>
                  </div>
                  <p className="text-[10px] text-ink-dim mt-1">External link interactions</p>
                  {!isPro && (
                    <span className="absolute right-3 top-3 flex items-center gap-0.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                      <Lock className="h-2.5 w-2.5" />
                      Pro
                    </span>
                  )}
                </div>
              </div>

              {/* Advanced Analytics Section — Blurred & Locked for Free Users */}
              {!isPro ? (
                <div className="relative mt-6 pt-6 border-t border-white/[0.06]">
                  {/* Overlay Upgrade Card (single lock pattern) */}
                  {showLockedOverlay && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setShowLockedOverlay(false)}
                        aria-label="Close locked analytics notice"
                        className="absolute right-2 top-2 z-30 rounded-lg p-1.5 text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="rounded-2xl border border-accent/40 bg-[#121318]/95 p-6 md:p-8 max-w-md shadow-2xl backdrop-blur-md space-y-4">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-accent shadow-[0_0_20px_rgba(198,255,61,0.3)]">
                          <Lock className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white">Full Analytics Locked</h3>
                          <p className="mt-1.5 text-xs text-white/70 leading-relaxed">
                            30 & 90-day traffic charts, link click heatmaps, referrer traffic sources, device breakdowns, and CSV exports are exclusive to NIL CARD Pro members.
                          </p>
                        </div>
                        <Link
                          href="/dashboard/billing"
                          className="inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-xl bg-accent text-black font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(198,255,61,0.4)] hover:bg-[#b8f52b] transition-all"
                        >
                          <span>Upgrade to Pro to Unlock</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <p className="text-[11px] text-accent/80 font-medium">
                          See what&apos;s driving your clicks.
                        </p>
                      </div>
                    </div>
                  )}

                    {/* Dummy Blurred Preview of Detailed Analytics (chart teaser) */}
                    <div className={`filter blur-md pointer-events-none select-none space-y-6 transition-opacity ${showLockedOverlay ? "opacity-30" : "opacity-60"}`}>
                      <div className="grid gap-4 sm:grid-cols-4">
                        <div className="rounded-lg bg-white/[0.03] p-4">
                          <div className="text-xs text-ink-muted">Click rate</div>
                          <div className="text-2xl font-bold text-white mt-1">4.2%</div>
                        </div>
                        <div className="rounded-lg bg-white/[0.03] p-4">
                          <div className="text-xs text-ink-muted">Inquiry rate</div>
                          <div className="text-2xl font-bold text-white mt-1">1.8%</div>
                        </div>
                        <div className="rounded-lg bg-white/[0.03] p-4">
                          <div className="text-xs text-ink-muted">Tip rate</div>
                          <div className="text-2xl font-bold text-emerald-400 mt-1">$2.40</div>
                        </div>
                        <div className="rounded-lg bg-white/[0.03] p-4">
                          <div className="text-xs text-ink-muted">Avg views/day</div>
                          <div className="text-2xl font-bold text-white mt-1">24</div>
                        </div>
                      </div>

                      {/* Bar chart preview */}
                      <div className="h-32 bg-accent/20 rounded-xl w-full flex items-end gap-1 px-3 pb-2">
                        {[35, 55, 40, 70, 50, 65, 45, 80, 55, 70, 40, 75].map((h, i) => (
                          <div key={i} className="flex-1 bg-accent/40 rounded-t" style={{ height: `${h}%` }} />
                        ))}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Referrer sources preview */}
                        <div className="h-24 bg-white/[0.05] rounded-xl p-3 space-y-2">
                          <div className="text-[10px] text-ink-muted">Top referrers</div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-3/4 bg-accent/30 rounded-full" />
                              </div>
                              <span className="text-[9px] text-ink-dim">instagram.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-1/2 bg-accent/30 rounded-full" />
                              </div>
                              <span className="text-[9px] text-ink-dim">tiktok.com</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-1/4 bg-accent/30 rounded-full" />
                              </div>
                              <span className="text-[9px] text-ink-dim">direct</span>
                            </div>
                          </div>
                        </div>

                        {/* Device breakdown preview */}
                        <div className="h-24 bg-white/[0.05] rounded-xl p-3 space-y-2">
                          <div className="text-[10px] text-ink-muted">Audience devices</div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-ink-dim">Mobile</span>
                              <div className="flex-1 mx-2 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-accent/30 rounded-full" />
                              </div>
                              <span className="text-[9px] text-ink-dim">68%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-ink-dim">Desktop</span>
                              <div className="flex-1 mx-2 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-1/4 bg-accent/30 rounded-full" />
                              </div>
                              <span className="text-[9px] text-ink-dim">24%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-ink-dim">Tablet</span>
                              <div className="flex-1 mx-2 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-1/12 bg-accent/30 rounded-full" />
                              </div>
                              <span className="text-[9px] text-ink-dim">8%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              ) : (
                /* PRO USERS: Full Detailed Analytics Charts & Data */
                <div className="space-y-6 pt-6 border-t border-white/[0.06]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-ink-muted">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Inquiries</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-2xl font-bold text-white">
                          {data.totalInquiries.toLocaleString()}
                        </p>
                      </div>
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
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="rounded-lg bg-white/[0.03] p-4">
                      <span className="text-xs font-medium text-ink-muted">Click rate</span>
                      <p className="mt-2 text-2xl font-bold text-accent">
                        {data.engagement.clickRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-4">
                      <span className="text-xs font-medium text-ink-muted">Inquiry rate</span>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {data.engagement.inquiryRate.toFixed(2)}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-4">
                      <span className="text-xs font-medium text-ink-muted">Tip rate</span>
                      <p className="mt-2 text-2xl font-bold text-emerald-400">
                        ${data.engagement.tipRate.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-4">
                      <span className="text-xs font-medium text-ink-muted">Avg views/day</span>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {data.engagement.avgViewsPerDay.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {data.viewsByDay.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-dim">
                        Views by day
                      </p>
                      {(() => {
                        const maxCount = Math.max(...data.viewsByDay.map((d) => d.count), 1);
                        return (
                          <>
                            <div className="flex items-end gap-1 h-28">
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
                            <div className="mt-2 flex justify-between text-[10px] text-ink-dim">
                              <span>{data.viewsByDay[0]?.date}</span>
                              <span>{data.viewsByDay[data.viewsByDay.length - 1]?.date}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  <div className="grid gap-6 sm:grid-cols-2">
                    {data.topReferrers.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-dim">
                          Top referrers
                        </p>
                        <div className="space-y-2">
                          {data.topReferrers.map((r) => (
                            <div
                              key={r.referrer}
                              className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white"
                            >
                              <span className="flex items-center gap-2">
                                <Globe className="h-3 w-3 text-ink-dim" />
                                {r.referrer}
                              </span>
                              <span className="text-ink-muted">{r.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {data.demographics.devices.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-dim">
                          Audience Devices
                        </p>
                        <div className="space-y-2">
                          {data.demographics.devices.map((d) => (
                            <div
                              key={d.device}
                              className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white"
                            >
                              <span className="flex items-center gap-2">
                                <DeviceIcon device={d.device} />
                                {d.device}
                              </span>
                              <span className="text-accent font-semibold">{d.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-white border border-white/[0.1] hover:bg-white/[0.08]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV Report
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-2xl border border-accent/40 bg-[#121318] p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setShowUpgradeModal(false)}
              aria-label="Close upgrade modal"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-accent shadow-[0_0_20px_rgba(198,255,61,0.3)]">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">Unlock Full Analytics</h4>
              <p className="mt-1.5 text-xs text-white/70 leading-relaxed">
                Historical trends, link click heatmaps, referrer traffic sources, device breakdowns, and CSV exports are exclusive to NIL CARD Pro.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-xs font-semibold text-white/80 hover:bg-white/5"
              >
                Cancel
              </button>
              <Link
                href="/dashboard/billing"
                className="flex-1 rounded-xl bg-accent py-3 text-center text-xs font-black text-black uppercase tracking-wide shadow-[0_0_20px_rgba(198,255,61,0.4)] hover:bg-[#b8f52b]"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
