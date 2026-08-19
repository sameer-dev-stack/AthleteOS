"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  MousePointerClick,
  Trophy,
  Sparkles,
  Gift,
  Wallet,
  Timer,
  Compass,
  Globe2,
  Share2,
  Award,
  Activity,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { supabaseApi } from "./supabase";

// Data contract mirrors GET /api/admin/analytics (see app/api/admin/[...adminPath]/route.ts).
type AnalyticsData = {
  totalViews: number;
  uniqueViewers: number;
  totalClicks: number;
  totalProfiles: number;
  proAthletesCount: number;
  stripeOnboardedCount: number;
  waitlistCount: number;
  newsletterCount: number;
  totalTipsCents: number;
  totalNilCents: number;
  totalAiGenerations: number;
  topReferrers: { referrer: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topSports: { sport: string; count: number }[];
  topAthletes: { athlete_id: string; full_name: string; username: string; sport?: string; views: number }[];
  viewsOverTime: { date: string; views: number; clicks: number }[];
  referralAnalytics?: {
    totalReferralClicks: number;
    completedReferrals: number;
    pendingReferrals: number;
    topReferrerAthletes: { id: string; full_name: string; username: string; completedCount: number }[];
  };
};

const emptyAnalytics: AnalyticsData = {
  totalViews: 0,
  uniqueViewers: 0,
  totalClicks: 0,
  totalProfiles: 0,
  proAthletesCount: 0,
  stripeOnboardedCount: 0,
  waitlistCount: 0,
  newsletterCount: 0,
  totalTipsCents: 0,
  totalNilCents: 0,
  totalAiGenerations: 0,
  topReferrers: [],
  topCountries: [],
  topSports: [],
  topAthletes: [],
  viewsOverTime: [],
  referralAnalytics: {
    totalReferralClicks: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    topReferrerAthletes: [],
  },
};

const RANGES = [
  { key: "7d", days: 7, label: "7D" },
  { key: "30d", days: 30, label: "30D" },
  { key: "90d", days: 90, label: "90D" },
  { key: "all", days: 0, label: "All time" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

const fmtNum = (n: number | undefined) => (n || 0).toLocaleString();

const fmtUSD = (cents: number | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    (cents || 0) / 100
  );

// ---------------------------------------------------------------------------
// Visual primitives — dashboard design language (bg-bg, ink, single accent).
// ---------------------------------------------------------------------------

function Panel({
  title,
  icon,
  iconCls,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconCls: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-[#111113]">
      <header className="flex items-center justify-between gap-3 px-5 pt-5">
        <h3 className="flex items-center gap-2.5 text-sm font-semibold text-white">
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${iconCls}`}>{icon}</span>
          {title}
        </h3>
        {action}
      </header>
      <div className="p-5 pt-4">{children}</div>
    </section>
  );
}

function Kpi({
  icon,
  iconCls,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconCls: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${iconCls}`}>{icon}</span>
        <span className="text-xs font-medium text-ink-muted">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-ink-dim">{sub}</p> : null}
    </div>
  );
}
function TrafficChart({ points }: { points: { date: string; views: number; clicks: number }[] }) {
  if (!points.length) return null;

  const W = 600;
  const H = 170;
  const P = 12;
  const max = Math.max(...points.map((p) => Math.max(p.views, p.clicks)), 1);
  const step = (W - P * 2) / (points.length - 1 || 1);
  const x = (i: number) => (P + i * step).toFixed(1);
  const y = (v: number) => (H - P - (v / max) * (H - P * 2)).toFixed(1);

  const viewLine = points.map((p, i) => `${x(i)},${y(p.views)}`).join(" L ");
  const clickLine = points.map((p, i) => `${x(i)},${y(p.clicks)}`).join(" L ");
  const areaPath = `M ${viewLine} L ${x(points.length - 1)},${H - P} L ${x(0)},${H - P} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-48 w-full">
      <defs>
        <linearGradient id="analyticsViewFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C6FF3D" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#C6FF3D" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={P}
          x2={W - P}
          y1={(H - P * 2) * t + P}
          y2={(H - P * 2) * t + P}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}
      <path d={areaPath} fill="url(#analyticsViewFill)" />
      <path d={`M ${viewLine}`} fill="none" stroke="#C6FF3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${clickLine}`} fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AnalyticsOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");
  const [data, setData] = useState<AnalyticsData>(emptyAnalytics);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = RANGES.find((r) => r.key === range)?.days ?? 0;
      const res = await supabaseApi.getAnalyticsOverview(days);
      setData({
        ...emptyAnalytics,
        ...res,
        viewsOverTime: (res.viewsOverTime || []).slice(-(days || 366)),
        referralAnalytics: res.referralAnalytics || emptyAnalytics.referralAnalytics,
        topReferrers: res.topReferrers || [],
        topCountries: res.topCountries || [],
        topSports: res.topSports || [],
        topAthletes: res.topAthletes || [],
      });
    } catch (e) {
      console.error(e);
      setError("Couldn't load platform analytics.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    queueMicrotask(fetchAnalytics);
  }, [fetchAnalytics]);

  const clickRate = data.totalViews > 0 ? ((data.totalClicks / data.totalViews) * 100).toFixed(1) : "0.0";
  const ref = data.referralAnalytics;
  const timeline = data.viewsOverTime;
  const firstDate = timeline[0]?.date;
  const lastDate = timeline[timeline.length - 1]?.date;

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.06] bg-[#111113] p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-400">
          <Activity className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Analytics unavailable</p>
          <p className="mt-1 text-xs text-ink-muted">{error}</p>
        </div>
        <button
          onClick={() => fetchAnalytics()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-black text-black transition hover:bg-[#b8f52b]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }
const hasData = !loading && (data.totalProfiles > 0 || data.totalViews > 0);

  return (
    <div className="space-y-6 animate-page-in">
      {/* Header + range control */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">Platform analytics</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Full-spectrum telemetry across reach, signups, revenue, AI, and distribution.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === r.key ? "bg-accent text-black" : "text-ink-muted hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} className="h-[118px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            icon={<Eye className="h-4 w-4" />}
            iconCls="bg-accent/10 border-accent/25 text-accent"
            label="Card views"
            value={fmtNum(data.totalViews)}
            sub={`${fmtNum(data.uniqueViewers)} unique viewers`}
          />
          <Kpi
            icon={<MousePointerClick className="h-4 w-4" />}
            iconCls="bg-sky-500/10 border-sky-500/25 text-sky-400"
            label="Link clicks"
            value={fmtNum(data.totalClicks)}
            sub={`${clickRate}% click-through`}
          />
          <Kpi
            icon={<Users className="h-4 w-4" />}
            iconCls="bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
            label="Athlete profiles"
            value={fmtNum(data.totalProfiles)}
            sub={`${fmtNum(data.proAthletesCount)} on Pro`}
          />
          <Kpi
            icon={<Sparkles className="h-4 w-4" />}
            iconCls="bg-purple-500/10 border-purple-500/25 text-purple-400"
            label="AI generations"
            value={fmtNum(data.totalAiGenerations)}
            sub="Toolkit usage"
          />
          <Kpi
            icon={<Wallet className="h-4 w-4" />}
            iconCls="bg-accent/10 border-accent/25 text-accent"
            label="Tip revenue"
            value={fmtUSD(data.totalTipsCents)}
            sub="Succeeded tips"
          />
          <Kpi
            icon={<Timer className="h-4 w-4" />}
            iconCls="bg-amber-500/10 border-amber-500/25 text-amber-400"
            label="Deal value"
            value={fmtUSD(data.totalNilCents)}
            sub="Disclosed deals"
          />
          <Kpi
            icon={<Gift className="h-4 w-4" />}
            iconCls="bg-pink-500/10 border-pink-500/25 text-pink-400"
            label="Waitlist"
            value={fmtNum(data.waitlistCount)}
            sub={`${fmtNum(data.newsletterCount)} newsletter leads`}
          />
          <Kpi
            icon={<Trophy className="h-4 w-4" />}
            iconCls="bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
            label="Stripe onboarded"
            value={fmtNum(data.stripeOnboardedCount)}
            sub="Connect accounts"
          />
        </div>
      )}

      {/* Traffic trend */}
      <Panel
        title="Traffic over time"
        icon={<Activity className="h-4 w-4" />}
        iconCls="bg-accent/10 border-accent/25 text-accent"
      >
        {loading ? (
          <SkeletonCard className="h-48 p-3" />
        ) : timeline.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center gap-2 text-center text-ink-muted">
            <Activity className="h-6 w-6 text-ink-dim" />
            <p className="text-xs">No traffic recorded in this window yet.</p>
          </div>
        ) : (
          <>
            <TrafficChart points={timeline} />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                  <span className="h-2 w-2 rounded-sm bg-accent shadow-[0_0_8px_rgba(198,255,61,0.5)]" />
                  Views · {fmtNum(data.totalViews)}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                  <span className="h-2 w-2 rounded-sm bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                  Clicks · {fmtNum(data.totalClicks)}
                </span>
              </div>
              <span className="text-xs text-ink-dim">
                {firstDate} → {lastDate}
              </span>
            </div>
          </>
        )}
      </Panel>
{/* Distributions */}
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard className="h-56 lg:col-span-2" />
          <SkeletonCard className="h-56" />
        </div>
      ) : hasData ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {data.topAthletes.length > 0 && (
              <Panel
                title="Top performing athletes"
                icon={<Award className="h-4 w-4" />}
                iconCls="bg-accent/10 border-accent/25 text-accent"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.topAthletes.map((a, idx) => (
                    <div
                      key={a.athlete_id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${
                            idx === 0
                              ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                              : idx === 1
                                ? "bg-slate-300/15 text-slate-200 border border-slate-300/30"
                                : idx === 2
                                  ? "bg-amber-700/15 text-amber-500 border border-amber-700/30"
                                  : "bg-white/[0.06] text-ink-muted border border-white/[0.08]"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{a.full_name}</p>
                          <p className="truncate text-xs text-ink-muted">
                            @{a.username || "athlete"} · {a.sport || "N/A"}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-accent">{fmtNum(a.views)} views</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {ref && (
              <Panel
                title="Referral Engine"
                icon={<Share2 className="h-4 w-4" />}
                iconCls="border-amber-500/25 bg-amber-500/10 text-amber-400"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Link clicks</p>
                    <p className="mt-1.5 text-xl font-black text-white">{fmtNum(ref.totalReferralClicks)}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Qualified</p>
                    <p className="mt-1.5 text-xl font-black text-accent">{fmtNum(ref.completedReferrals)}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Pending</p>
                    <p className="mt-1.5 text-xl font-black text-amber-400">{fmtNum(ref.pendingReferrals)}</p>
                  </div>
                </div>

                {ref.topReferrerAthletes.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">Top referrers</p>
                    {ref.topReferrerAthletes.slice(0, 5).map((leader) => (
                      <div
                        key={leader.id}
                        className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{leader.full_name}</p>
                          <p className="truncate text-xs text-ink-muted">@{leader.username}</p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-accent">
                          {fmtNum(leader.completedCount)} referrals
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            )}
          </div>
{/* Right column */}
          <div className="space-y-6">
            {data.topReferrers.length > 0 && (
              <Panel
                title="Acquisition channels"
                icon={<Compass className="h-4 w-4" />}
                iconCls="bg-sky-500/10 border-sky-500/25 text-sky-400"
              >
                <div className="space-y-2">
                  {data.topReferrers.map((r, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                    >
                      <span className="min-w-0 truncate text-xs font-semibold text-white" title={r.referrer}>
                        {r.referrer}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-sky-400">{fmtNum(r.count)} hits</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {data.topSports.length > 0 && (
              <Panel
                title="Sports distribution"
                icon={<Trophy className="h-4 w-4" />}
                iconCls="bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              >
                <div className="space-y-3">
                  {(() => {
                    const maxCount = Math.max(...data.topSports.map((s) => s.count), 1);
                    return data.topSports.map((s) => (
                      <div key={s.sport}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">{s.sport}</span>
                          <span className="text-ink-muted">{fmtNum(s.count)}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${Math.round((s.count / maxCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </Panel>
            )}

            {data.topCountries.length > 0 && (
              <Panel
                title="Geographic footprint"
                icon={<Globe2 className="h-4 w-4" />}
                iconCls="bg-purple-500/10 border-purple-500/25 text-purple-400"
              >
                <div className="space-y-2">
                  {data.topCountries.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                    >
                      <span className="text-xs font-semibold text-white">{c.country}</span>
                      <span className="shrink-0 text-xs font-bold text-purple-400">{fmtNum(c.count)} visits</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-[#111113] p-10 text-center">
          <Activity className="h-6 w-6 text-ink-dim" />
          <p className="text-sm font-semibold text-white">No platform data yet</p>
          <p className="text-xs text-ink-muted">
            Analytics will appear here once athletes create profiles and drive traffic.
          </p>
        </div>
      )}
    </div>
  );
}