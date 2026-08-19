"use client";

import { useEffect, useState } from "react";
import { supabaseApi } from "./supabase";
import { Users, DollarSign, Eye, MousePointerClick, Zap, ClipboardCheck, Activity, TrendingUp } from "lucide-react";

type KpiCard = {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  trend?: { value: number; positive: boolean };
};

type AnalyticsOverview = {
  totalViews: number;
  uniqueViewers: number;
  totalClicks: number;
  totalProfiles?: number;
  proAthletesCount?: number;
  stripeOnboardedCount?: number;
  waitlistCount?: number;
  newsletterCount?: number;
  totalTipsCents?: number;
  totalNilCents?: number;
  totalAiGenerations?: number;
  viewsOverTime: { date: string; views: number; clicks: number }[];
};

type PlatformHealth = {
  supabaseStatus: "connected" | "error";
  stripeWebhookHealth: "healthy" | "error";
  waitlistCount: number;
  newsletterCount: number;
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabaseApi.getAnalyticsOverview(),
      supabaseApi.getPlatformHealth(),
    ]).then(([analyticsData, healthData]) => {
      if (cancelled) return;
      setAnalytics(analyticsData);
      setHealth(healthData);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const formatCents = (cents: number | undefined) => {
    if (cents === undefined) return "$0.00";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "0";
    return new Intl.NumberFormat("en-US").format(num);
  };

  const kpiCards: KpiCard[] = [
    {
      label: "Total Athletes",
      value: formatNumber(analytics?.totalProfiles),
      subtext: `${formatNumber(analytics?.proAthletesCount)} pro`,
      icon: Users,
    },
    {
      label: "Card Views",
      value: formatNumber(analytics?.totalViews),
      subtext: `${formatNumber(analytics?.uniqueViewers)} unique viewers`,
      icon: Eye,
      accent: true,
    },
    {
      label: "Link Clicks",
      value: formatNumber(analytics?.totalClicks),
      subtext: analytics && analytics.totalViews > 0 ? `${((analytics.totalClicks / analytics.totalViews) * 100).toFixed(1)}% CTR` : "0% CTR",
      icon: MousePointerClick,
    },
    {
      label: "Tips Revenue",
      value: formatCents(analytics?.totalTipsCents),
      subtext: "Lifetime",
      icon: DollarSign,
      accent: true,
    },
    {
      label: "NIL Deals",
      value: formatCents(analytics?.totalNilCents),
      subtext: "Disclosed value",
      icon: TrendingUp,
    },
    {
      label: "AI Generations",
      value: formatNumber(analytics?.totalAiGenerations),
      subtext: "All-time",
      icon: Zap,
    },
    {
      label: "Waitlist",
      value: formatNumber(health?.waitlistCount ?? analytics?.waitlistCount),
      subtext: "Pending signups",
      icon: ClipboardCheck,
    },
    {
      label: "Stripe Onboarded",
      value: formatNumber(analytics?.stripeOnboardedCount),
      subtext: "Ready for payouts",
      icon: Activity,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.05] bg-[#111113]/80 p-5 min-h-[120px] animate-pulse">
            <div className="h-3 w-24 rounded bg-white/5" />
            <div className="mt-4 h-8 w-16 rounded bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`rounded-2xl border p-5 min-h-[120px] flex flex-col justify-between transition-all hover:border-white/[0.12] ${
                kpi.accent
                  ? "border-accent/20 bg-accent/[0.03]"
                  : "border-white/[0.05] bg-[#111113]/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  {kpi.label}
                </span>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  kpi.accent ? "bg-accent/10 text-accent" : "bg-white/[0.04] text-white/50"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {kpi.value}
                </div>
                {kpi.subtext && (
                  <div className="mt-1 text-[11px] text-white/40 font-medium">
                    {kpi.subtext}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health Strip */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-[#111113]/80 px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Supabase</span>
          <span className={`h-2 w-2 rounded-full ${
            health?.supabaseStatus === "connected" ? "bg-accent shadow-[0_0_8px_rgba(198,255,61,0.6)]" : "bg-red-500"
          }`} />
          <span className="text-[11px] font-semibold text-white/70">
            {health?.supabaseStatus === "connected" ? "Live" : "Offline"}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-[#111113]/80 px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Stripe</span>
          <span className={`h-2 w-2 rounded-full ${
            health?.stripeWebhookHealth === "healthy" ? "bg-accent shadow-[0_0_8px_rgba(198,255,61,0.6)]" : "bg-red-500"
          }`} />
          <span className="text-[11px] font-semibold text-white/70">
            {health?.stripeWebhookHealth === "healthy" ? "Connected" : "Error"}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-[#111113]/80 px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Newsletter</span>
          <span className="text-[11px] font-semibold text-white/70">
            {formatNumber(health?.newsletterCount)} subscribers
          </span>
        </div>
      </div>
    </div>
  );
}
