"use client";

import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, AlertCircle, Lock } from "lucide-react";
import { Profile } from "@/lib/actions/profile";
import { NILMetricsRow, runNilValueEngine } from "@/lib/actions/nil-engine";
import { getNilValueBreakdown, type NilBreakdown } from "@/lib/actions/athlete-knowledge";
import { getSocialAccounts, SocialAccount } from "@/lib/actions/social-accounts";
import { computeNilScoreAndRates } from "@/lib/nil-score";
import { NilScoreCard } from "@/components/dashboard/nil-score-card";
import { NilRateTable } from "@/components/dashboard/nil-rate-table";
import { NilMetricsStrip } from "@/components/dashboard/nil-metrics-strip";
import { NilAiBreakdown } from "@/components/dashboard/nil-ai-breakdown";
import { NilScoreHistory } from "@/components/dashboard/nil-score-history";
import { NilPitchGenerator } from "@/components/dashboard/nil-pitch-generator";
import { NilProPreviewCard } from "@/components/dashboard/nil-pro-preview";

function RateTableBlock({
  rates,
  plan,
  themeAccent,
  blurred,
  locked,
  hasFollowerData = true,
}: {
  rates: ReturnType<typeof computeNilScoreAndRates>["rates"];
  plan: string;
  themeAccent: string;
  blurred: boolean;
  locked: boolean;
  hasFollowerData?: boolean;
}) {
  return (
    <div className="relative">
      <NilRateTable rates={rates} plan={plan} themeAccent={themeAccent} hasFollowerData={hasFollowerData} />
      {locked && (
        <div className="absolute inset-0 z-10 rounded-2xl bg-[#0A0A0C]/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-3">
          <div className="rounded-full bg-white/[0.04] border border-white/[0.1] p-3">
            <Lock className="h-6 w-6 text-white/60" />
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed max-w-[18rem]">
            Connect a public Instagram or TikTok account below to unlock your personalized, verified suggested rates.
          </p>
        </div>
      )}
      <div
        className={`absolute inset-0 z-10 rounded-2xl flex items-center justify-center p-4 transition-all duration-500 ${
          blurred && !locked
            ? "bg-[#0A0A0C]/30 backdrop-blur-md opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <p className="text-[10px] text-white/60 text-center leading-relaxed max-w-[16rem]">
          Our engine is validating your metrics and calculating your target CPM market value...
        </p>
      </div>
    </div>
  );
}

type Props = {
  profile: Profile;
  initialMetrics: NILMetricsRow | null;
  initialSocialAccounts: SocialAccount[];
  quota: {
    used: number;
    limit: number;
    remaining: number;
    plan: "free" | "pro";
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

  const isPro = quotaState.plan === "pro";

  // Load personalized knowledge breakdown on mount for Pro users
  useEffect(() => {
    if (!isPro) return;
    let cancelled = false;
    queueMicrotask(() => setBreakdownLoading(true));
    getNilValueBreakdown(profile.id)
      .then((res) => {
        if (cancelled) return;
        if (res.ok && res.data) setKnowledgeBreakdown(res.data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBreakdownLoading(false); });
    return () => { cancelled = true; };
  }, [profile.id, isPro]);

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

  const anyPending = socialAccounts.some((a) => a.verification_status === "PENDING");
  const followersTotal = metrics?.followers_total || socialAccounts.reduce((acc, a) => acc + (a.followers || 0), 0);
  const hasFollowerData = followersTotal > 0;
  const hasRealData = hasFollowerData || (metrics?.card_views || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: themeAccent }} />
            <h1 className="text-xl font-black text-white tracking-tight">NIL VALUE ENGINE</h1>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Calculate your market score, manage custom rate cards, and generate brand pitch proposals.
          </p>
        </div>

        {isPro && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-black hover:bg-white/90 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Calculating..." : "RECALCULATE NIL SCORE"}
          </button>
        )}
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

      {/* Free Plan Upgrade Gate vs Pro Plan Full Suite */}
      {!isPro ? (
        <NilProPreviewCard themeAccent={themeAccent} />
      ) : (
        <div className="space-y-6">
          {/* Analytics Stats bar */}
          <NilMetricsStrip
            cardViews={metrics?.card_views || 0}
            linkClicks={metrics?.link_clicks || 0}
            clickThroughRate={metrics?.click_through_rate || 0}
            tipsAmount={metrics?.tips_amount || 0}
            followersTotal={followersTotal}
            themeAccent={themeAccent}
            followerDelta={metrics?.follower_delta_percent}
            engagementDelta={metrics?.engagement_delta_percent}
            isPro={true}
          />

          {/* Core valuation layout — strict 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Score Circle */}
            <div className="space-y-6">
              <NilScoreCard
                score={scoreDetails.nilScore}
                label={scoreDetails.label}
                themeAccent={themeAccent}
                onRefresh={handleRefresh}
                loading={loading}
                hasRealData={hasRealData}
              />
            </div>

            {/* Column 2: Editable Rates */}
            <div className="space-y-6">
              <RateTableBlock
                rates={scoreDetails.rates}
                plan={quotaState.plan}
                themeAccent={themeAccent}
                blurred={anyPending}
                locked={false}
                hasFollowerData={hasFollowerData}
              />
            </div>

            {/* Column 3: AI Market Breakdown */}
            <div className="space-y-6">
              <NilAiBreakdown
                breakdown={knowledgeBreakdown}
                quotaUsed={quotaState.used}
                quotaLimit={quotaState.limit}
                plan={quotaState.plan}
                themeAccent={themeAccent}
                loading={breakdownLoading}
              />
            </div>
          </div>

          {/* Sponsor Pitch Generator — Pro Tool */}
          <NilPitchGenerator
            themeAccent={themeAccent}
            athleteName={profile.full_name || "Athlete"}
            sport={profile.sport}
            school={profile.school}
          />

          {/* NIL Score Trend — Full Width */}
          <NilScoreHistory profileId={profile.id} themeAccent={themeAccent} />
        </div>
      )}
    </div>
  );
}
