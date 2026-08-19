"use client";

import { useEffect, useState } from "react";
import { supabaseApi } from "./supabase";
import { DollarSign, TrendingUp, CreditCard, Wallet, PiggyBank, Info } from "lucide-react";

type RevenueData = {
  tips: {
    grossCents: number;
    platformFeeCents: number;
    stripeFeeCents: number;
    netToAthletesCents: number;
    freePlanGrossCents: number;
    proPlanGrossCents: number;
    count: number;
  };
  subscriptions: {
    grossCents: number;
    stripeFeeCents: number;
    netRevenueCents: number;
    activeCount: number;
  };
  platform: {
    netRevenueCents: number;
    commissionRate: number;
    note: string;
  };
};

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function StackedBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  return (
    <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/[0.03]">
      {segments.map((segment) => {
        const width = (segment.value / total) * 100;
        if (width === 0) return null;
        return (
          <div
            key={segment.label}
            className="h-full transition-all duration-500"
            style={{ width: `${width}%`, backgroundColor: segment.color }}
            title={`${segment.label}: ${formatCents(segment.value)}`}
          />
        );
      })}
    </div>
  );
}

export function RevenueChart() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabaseApi
      .getRevenueData()
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load revenue data");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.05] bg-[#111113]/80 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-white/5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[0.05] bg-[#0A0A0B] p-4 min-h-[100px]">
                <div className="h-3 w-16 rounded bg-white/5" />
                <div className="mt-3 h-6 w-12 rounded bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <p className="text-sm text-red-400 font-medium">Revenue data unavailable</p>
        <p className="text-xs text-white/40 mt-1">{error || "No data returned from server."}</p>
      </div>
    );
  }

  const tipBreakdown = [
    { label: "To Athletes", value: data.tips.netToAthletesCents, color: "#C6FF3D" },
    { label: "Platform (20%)", value: data.tips.platformFeeCents, color: "#F59E0B" },
    { label: "Stripe Fees", value: data.tips.stripeFeeCents, color: "#EF4444" },
  ];

  const subscriptionBreakdown = [
    { label: "Net Subscription", value: data.subscriptions.netRevenueCents, color: "#C6FF3D" },
    { label: "Stripe Fees", value: data.subscriptions.stripeFeeCents, color: "#EF4444" },
  ];

  const totalPlatformRevenue = data.platform.netRevenueCents;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Revenue Breakdown</h3>
        <p className="text-xs text-white/40 mt-1">{data.platform.note}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-4 min-h-[100px] flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Tips Gross</span>
          </div>
          <div>
            <div className="text-xl font-black text-white tracking-tight">{formatCents(data.tips.grossCents)}</div>
            <div className="text-[11px] text-white/40 font-medium">{data.tips.count} tips</div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.05] bg-[#0A0A0B] p-4 min-h-[100px] flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/50">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Subscriptions</span>
          </div>
          <div>
            <div className="text-xl font-black text-white tracking-tight">{formatCents(data.subscriptions.grossCents)}</div>
            <div className="text-[11px] text-white/40 font-medium">{data.subscriptions.activeCount} active</div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.05] bg-[#0A0A0B] p-4 min-h-[100px] flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/50">
              <CreditCard className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Stripe Fees</span>
          </div>
          <div>
            <div className="text-xl font-black text-white tracking-tight">
              {formatCents(data.tips.stripeFeeCents + data.subscriptions.stripeFeeCents)}
            </div>
            <div className="text-[11px] text-white/40 font-medium">Tips + Subs</div>
          </div>
        </div>

        <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-4 min-h-[100px] flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <PiggyBank className="h-3.5 w-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Platform Net</span>
          </div>
          <div>
            <div className="text-xl font-black text-accent tracking-tight">{formatCents(totalPlatformRevenue)}</div>
            <div className="text-[11px] text-white/40 font-medium">Commission + Subs</div>
          </div>
        </div>
      </div>

      {/* Stacked Bar Charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Tips Breakdown */}
        <div className="rounded-2xl border border-white/[0.05] bg-[#111113]/80 p-5">
          <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">Tips Revenue Flow</h4>
          <StackedBar segments={tipBreakdown} />
          <div className="mt-4 space-y-2.5">
            {tipBreakdown.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="text-xs text-white/70">{segment.label}</span>
                </div>
                <span className="text-xs font-semibold text-white/50">{formatCents(segment.value)}</span>
              </div>
            ))}
            <div className="border-t border-white/[0.06] pt-2.5 mt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">Total Tips</span>
                <span className="text-xs font-bold text-white">{formatCents(data.tips.grossCents)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-white/[0.02] border border-white/[0.05] p-3">
            <Info className="h-3.5 w-3.5 text-white/30 mt-0.5 shrink-0" />
            <p className="text-[11px] text-white/40 leading-relaxed">
              Free-plan athletes: platform keeps <span className="text-amber-400 font-semibold">20%</span>, athlete receives <span className="text-emerald-400 font-semibold">80%</span> minus Stripe fees. Pro-plan athletes: keep <span className="text-emerald-400 font-semibold">100%</span> minus Stripe fees only.
            </p>
          </div>
        </div>

        {/* Subscriptions Breakdown */}
        <div className="rounded-2xl border border-white/[0.05] bg-[#111113]/80 p-5">
          <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">Subscription Revenue</h4>
          <StackedBar segments={subscriptionBreakdown} />
          <div className="mt-4 space-y-2.5">
            {subscriptionBreakdown.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="text-xs text-white/70">{segment.label}</span>
                </div>
                <span className="text-xs font-semibold text-white/50">{formatCents(segment.value)}</span>
              </div>
            ))}
            <div className="border-t border-white/[0.06] pt-2.5 mt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">Gross Subscriptions</span>
                <span className="text-xs font-bold text-white">{formatCents(data.subscriptions.grossCents)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-white/[0.02] border border-white/[0.05] p-3">
            <Info className="h-3.5 w-3.5 text-white/30 mt-0.5 shrink-0" />
            <p className="text-[11px] text-white/40 leading-relaxed">
              Platform receives subscription revenue minus Stripe processing fees (<span className="text-red-400 font-semibold">2.9% + $0.30</span> per payment). Transaction fees are passed through to subscribers; platform does not cover them.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Net Revenue Summary */}
      <div className="rounded-2xl border border-accent/20 bg-accent/[0.03] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-accent uppercase tracking-wider">Platform Net Revenue</h4>
            <p className="text-[11px] text-white/40 mt-1">Commission from tips + net subscription revenue</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-accent tracking-tight">{formatCents(totalPlatformRevenue)}</div>
            <div className="text-[11px] text-white/40 font-medium">
              {data.platform.commissionRate}% tip commission + subscription net
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Tip Commission</div>
            <div className="text-sm font-black text-white">{formatCents(data.tips.platformFeeCents)}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{data.platform.commissionRate}% of {formatCents(data.tips.grossCents)}</div>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Subscription Net</div>
            <div className="text-sm font-black text-white">{formatCents(data.subscriptions.netRevenueCents)}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{formatCents(data.subscriptions.grossCents)} gross minus fees</div>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Total Stripe Fees</div>
            <div className="text-sm font-black text-white">{formatCents(data.tips.stripeFeeCents + data.subscriptions.stripeFeeCents)}</div>
            <div className="text-[10px] text-white/30 mt-0.5">Passed through to users</div>
          </div>
        </div>
      </div>
    </div>
  );
}
