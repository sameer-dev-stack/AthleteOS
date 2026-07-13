"use client";

import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, AlertCircle, ArrowUpRight } from "lucide-react";
import { Profile } from "@/lib/actions/profile";
import { NILMetricsRow, runNilValueEngine, getNilMetrics } from "@/lib/actions/nil-engine";
import { getNilValueBreakdown, type NilBreakdown } from "@/lib/actions/athlete-knowledge";
import { getSocialAccounts, SocialAccount } from "@/lib/actions/social-accounts";
import { computeNilScoreAndRates } from "@/lib/nil-score";
import { NilScoreCard } from "@/components/dashboard/nil-score-card";
import { NilRateTable } from "@/components/dashboard/nil-rate-table";
import { NilMetricsStrip } from "@/components/dashboard/nil-metrics-strip";
import { NilAiBreakdown } from "@/components/dashboard/nil-ai-breakdown";
import { NilScoreHistory } from "@/components/dashboard/nil-score-history";
import { NilDealChecker } from "@/components/dashboard/nil-deal-checker";
import { SocialAccountsEditor } from "@/components/dashboard/social-accounts-editor";
import { SmartAiActions } from "@/components/dashboard/smart-ai-actions";

type Props = {
  profile: Profile;
  initialMetrics: NILMetricsRow | null;
  initialSocialAccounts: SocialAccount[];
  quota: {
    used: number;
    limit: number;
    remaining: number;
    plan: "free" | "pro" | "elite";
  };
};

export function NilDashboardClient({
  profile,
  initialMetrics,
  initialSocialAccounts,
  quota,
}: Props) {
  const themeAccent = profile.theme_accent || "#C6FF3D";
  
  const [metrics, setMetrics] = useState<NILMetricsRow | null>(initialMetrics);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(initialSocialAccounts);
  const [quotaState, setQuotaState] = useState(quota);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [knowledgeBreakdown, setKnowledgeBreakdown] = useState<NilBreakdown | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(true);

  // Load personalized knowledge breakdown on mount (non-blocking)
  useEffect(() => {
    let cancelled = false;
    setBreakdownLoading(true);
    getNilValueBreakdown(profile.id)
      .then((res) => {
        if (cancelled) return;
        if (res.ok && res.data) setKnowledgeBreakdown(res.data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBreakdownLoading(false); });
    return () => { cancelled = true; };
  }, [profile.id]);

  const scoreDetails = metrics
    ? computeNilScoreAndRates(
        {
          card_views: metrics.card_views,
          link_clicks: metrics.link_clicks,
          click_through_rate: metrics.click_through_rate,
          tips_amount: metrics.tips_amount,
          tips_count: metrics.tips_count,
          followers_total: metrics.followers_total,
          engagement_rate: metrics.engagement_rate,
        },
        {
          sport: profile.sport,
          school: profile.school,
          position: profile.position,
        }
      )
    : computeNilScoreAndRates(
        {
          card_views: 0,
          link_clicks: 0,
          click_through_rate: 0,
          tips_amount: 0,
          tips_count: 0,
          followers_total: socialAccounts.reduce((acc, a) => acc + (a.followers || 0), 0),
          engagement_rate: socialAccounts.length > 0 ? 0.05 : 0,
        },
        {
          sport: profile.sport,
          school: profile.school,
          position: profile.position,
        }
      );

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await runNilValueEngine(profile.id);
      if (res.ok && res.data) {
        setMetrics(res.data.metrics);
        setQuotaState({
          used: res.data.quotaUsed,
          limit: res.data.quotaLimit,
          remaining: Math.max(0, res.data.quotaLimit - res.data.quotaUsed),
          plan: res.data.plan as any,
        });
        // Refresh breakdown after recalculation
        setBreakdownLoading(true);
        let breakdownCancelled = false;
        getNilValueBreakdown(profile.id)
          .then((r) => { if (!breakdownCancelled && r.ok && r.data) setKnowledgeBreakdown(r.data); })
          .catch(() => {})
          .finally(() => { if (!breakdownCancelled) setBreakdownLoading(false); });
      } else {
        setError(res.error || "Failed to calculate NIL metrics");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialUpdate = async () => {
    try {
      const res = await getSocialAccounts();
      if (res.ok && res.data) {
        setSocialAccounts(res.data);
      }
    } catch (e) {
      console.error("Error updating social accounts list:", e);
    }
  };

  // If no metrics ever computed, show an empty state panel
  const showEmptyState = !metrics && socialAccounts.length === 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: themeAccent }} />
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">
              NIL Value Engine
            </h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Analyze profile engagement, calculate market value score, and get automated contract guidance.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider rounded-xl px-5 py-2.5 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {loading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Recalculate NIL Score
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-red-400">Calculation Warning</h5>
            <p className="text-[11px] text-red-400/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {showEmptyState ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-12 text-center max-w-2xl mx-auto flex flex-col items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center mb-6">
            <TrendingUp className="h-6 w-6 text-white/30" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">No NIL Valuation Setup Yet</h2>
          <p className="text-xs text-white/40 max-w-md mb-6 leading-relaxed">
            Configure your social network connections (Instagram, TikTok, YouTube, Twitter) and recalculate to build your first NIL Score and recommended price ranges.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mb-8">
            <div className="text-left bg-[#0A0A0C] border border-white/[0.04] p-4 rounded-xl">
              <h5 className="text-xs font-bold text-white mb-1">1. Add Followers</h5>
              <p className="text-[10px] text-white/40">Enter handles and network follower counts to establish audience reach.</p>
            </div>
            <div className="text-left bg-[#0A0A0C] border border-white/[0.04] p-4 rounded-xl">
              <h5 className="text-xs font-bold text-white mb-1">2. Run Analysis</h5>
              <p className="text-[10px] text-white/40">Our algorithm combines reach, CTR, tips, and sport division context.</p>
            </div>
          </div>

          {/* Baseline market-value preview — shows core value immediately, even before data */}
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.06] bg-[#0A0A0C] p-5 text-left">
            <div className="flex items-center justify-between mb-1">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Your Baseline Market Value</h5>
              <span className="text-[10px] text-white/40">based on your sport</span>
            </div>
            <p className="text-[11px] text-white/50 mb-4 leading-relaxed">
              Connect accounts and we tune this to your real reach. Athletes in{" "}
              <span className="text-white/80">{profile.sport || "your sport"}</span> typically land in these ranges:
            </p>
            <NilRateTable rates={scoreDetails.rates} plan={quotaState.plan} themeAccent={themeAccent} />
          </div>

          <div className="w-full max-w-md">
            <SocialAccountsEditor
              accounts={socialAccounts}
              themeAccent={themeAccent}
              onUpdate={handleSocialUpdate}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Analytics Stats bar */}
          <NilMetricsStrip
            cardViews={metrics?.card_views || 0}
            linkClicks={metrics?.link_clicks || 0}
            clickThroughRate={metrics?.click_through_rate || 0}
            tipsAmount={metrics?.tips_amount || 0}
            followersTotal={metrics?.followers_total || socialAccounts.reduce((acc, a) => acc + (a.followers || 0), 0)}
            themeAccent={themeAccent}
            followerDelta={metrics?.follower_delta_percent}
            engagementDelta={metrics?.engagement_delta_percent}
          />

          {/* Core valuation layout grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Score Circle + Social Editor */}
            <div className="space-y-6">
              <NilScoreCard
                score={scoreDetails.nilScore}
                label={scoreDetails.label}
                themeAccent={themeAccent}
                onRefresh={handleRefresh}
                loading={loading}
              />
              <SocialAccountsEditor
                accounts={socialAccounts}
                themeAccent={themeAccent}
                onUpdate={handleSocialUpdate}
              />
            </div>

            {/* Column 2: Rates + Deal checker */}
            <div className="space-y-6">
              <NilRateTable
                rates={scoreDetails.rates}
                plan={quotaState.plan}
                themeAccent={themeAccent}
              />
              <NilDealChecker
                plan={quotaState.plan}
                themeAccent={themeAccent}
              />
              <SmartAiActions
                themeAccent={themeAccent}
                context="nil"
                cardViews={metrics?.card_views || 0}
                linkClicks={metrics?.link_clicks || 0}
                nilScore={metrics?.nil_score || null}
              />
            </div>

            {/* Column 3: AI Breakdown */}
            <div className="space-y-6">
              <NilAiBreakdown
                breakdown={knowledgeBreakdown}
                quotaUsed={quotaState.used}
                quotaLimit={quotaState.limit}
                plan={quotaState.plan}
                themeAccent={themeAccent}
                loading={breakdownLoading}
              />
              <NilScoreHistory profileId={profile.id} themeAccent={themeAccent} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
