"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Award, Briefcase, Share2, ArrowRight } from "lucide-react";
import { getBusinessSummary, type BusinessSummary } from "@/lib/actions/business";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  themeAccent?: string;
  username?: string | null;
};

export function BusinessDashboard({ themeAccent = "#C6FF3D", username }: Props) {
  const [summary, setSummary] = useState<BusinessSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getBusinessSummary().then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) {
        setSummary(res.data);
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  function handleShareCard() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nilcard.app";
    const url = username ? `${siteUrl}/${username}` : siteUrl;
    if (navigator.share) {
      navigator.share({ title: "Check out my athlete card", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  function handleOpenDealRoom() {
    const el = document.getElementById("deal-room-section") || document.querySelector("[data-deal-room]");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5 space-y-3">
        <Skeleton className="h-4 w-28 rounded" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasData = summary && (summary.totalMoneyThisWeek > 0 || summary.wonDealsTotal > 0 || summary.pipeline.new > 0 || summary.pipeline.negotiating > 0 || summary.pipeline.replied > 0 || summary.tipsTotal > 0);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5 space-y-4 hover:border-white/[0.1] transition-colors">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" style={{ color: themeAccent }} />
          <h3 className="text-sm font-bold text-white tracking-tight">Business Overview</h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">NIL Operations</span>
      </div>

      {!hasData ? (
        /* Empty State: Encouraging first-run behavior without zero-looking-broken UI */
        <div className="rounded-xl border border-dashed border-white/[0.1] bg-[#0D0D11] p-4 text-center">
          <p className="text-xs font-semibold text-white">Ready for Brand Deals</p>
          <p className="text-[11px] text-white/40 mt-1">
            Share your published card to start receiving inbound sponsorship inquiries and fan tips.
          </p>
          <button
            onClick={handleShareCard}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent/15 border border-accent/30 px-3.5 py-1.5 text-xs font-bold text-accent hover:bg-accent/25 transition-colors"
          >
            <Share2 className="h-3 w-3" />
            Share Your Card
          </button>
        </div>
      ) : (
        /* Driver Stats View */
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Money Moved (7 Days) */}
            <div className="rounded-xl border border-white/[0.05] bg-[#0D0D11] p-3 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">7-Day Revenue</span>
              <span className="text-lg font-black text-accent tracking-tight mt-1">
                ${summary.totalMoneyThisWeek.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Deals Won (Total) */}
            <div className="rounded-xl border border-white/[0.05] bg-[#0D0D11] p-3 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Total Won Deals</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-black text-white tracking-tight">{summary.totalDealsWonCount}</span>
                <span className="text-[10px] font-bold text-emerald-400">${summary.wonDealsTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Pipeline Active Badge */}
          <div className="rounded-xl border border-white/[0.05] bg-[#0D0D11] px-3.5 py-2.5 flex items-center justify-between text-xs">
            <span className="text-white/50 font-medium">Active Pipeline:</span>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              {summary.pipeline.new > 0 && (
                <span className="text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                  {summary.pipeline.new} new
                </span>
              )}
              {summary.pipeline.negotiating > 0 && (
                <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {summary.pipeline.negotiating} negotiating
                </span>
              )}
              {summary.pipeline.new === 0 && summary.pipeline.negotiating === 0 && (
                <span className="text-white/40 font-normal">No active negotiations</span>
              )}
            </div>
          </div>

          {/* CTA Row */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={handleShareCard}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share Your Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
