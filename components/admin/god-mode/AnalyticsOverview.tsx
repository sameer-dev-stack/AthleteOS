import React, { useState, useEffect, useCallback } from 'react';
import { supabaseApi } from './supabase';
import { 
  Eye, MousePointer, Globe, TrendingUp, Compass, Share2, X, 
  Users, DollarSign, Award, RefreshCw, Loader2, Zap, Shield, Trophy, Activity, Mail,
  ChevronDown, ChevronUp
} from 'lucide-react';

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

export default function AnalyticsOverview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [showAllReferrals, setShowAllReferrals] = useState(false);
  const [data, setData] = useState<AnalyticsData>(emptyAnalytics);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 0;
      const result = await supabaseApi.getAnalyticsOverview(days);

      const filteredTimeline = (result.viewsOverTime || []).slice(-(days || 365));

      setData({
        totalViews: result.totalViews || 0,
        uniqueViewers: result.uniqueViewers || 0,
        totalClicks: result.totalClicks || 0,
        totalProfiles: result.totalProfiles || 0,
        proAthletesCount: result.proAthletesCount || 0,
        stripeOnboardedCount: result.stripeOnboardedCount || 0,
        waitlistCount: result.waitlistCount || 0,
        newsletterCount: result.newsletterCount || 0,
        totalTipsCents: result.totalTipsCents || 0,
        totalNilCents: result.totalNilCents || 0,
        totalAiGenerations: result.totalAiGenerations || 0,
        viewsOverTime: filteredTimeline,
        topReferrers: result.topReferrers || [],
        topCountries: result.topCountries || [],
        topSports: result.topSports || [],
        topAthletes: result.topAthletes || [],
        referralAnalytics: result.referralAnalytics || {
          totalReferralClicks: 0,
          completedReferrals: 0,
          pendingReferrals: 0,
          topReferrerAthletes: [],
        },
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load full platform analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    queueMicrotask(() => fetchAnalytics());
  }, [fetchAnalytics]);

  const totalClicks = data.totalClicks;
  const totalViews = data.totalViews;
  const clickThroughRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

  const formatUSD = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
  };

  // SVG Chart Calculation
  const chartHeight = 140;
  const chartWidth = 600;
  const padding = 20;

  const getChartCoordinates = (points: { date: string; views: number; clicks: number }[]) => {
    if (points.length === 0) return { viewPath: '', clickPath: '', viewPoints: [] as string[] };

    const maxVal = Math.max(...points.map(p => Math.max(p.views, p.clicks)), 1);
    const xStep = (chartWidth - padding * 2) / (points.length - 1 || 1);

    const viewCoordinates = points.map((p, idx) => {
      const x = padding + idx * xStep;
      const y = chartHeight - padding - (p.views / maxVal) * (chartHeight - padding * 2);
      return `${x},${y}`;
    });

    const clickCoordinates = points.map((p, idx) => {
      const x = padding + idx * xStep;
      const y = chartHeight - padding - (p.clicks / maxVal) * (chartHeight - padding * 2);
      return `${x},${y}`;
    });

    return {
      viewPath: `M ${viewCoordinates.join(' L ')}`,
      clickPath: `M ${clickCoordinates.join(' L ')}`,
      viewPoints: viewCoordinates
    };
  };

  const { viewPath, clickPath, viewPoints } = getChartCoordinates(data.viewsOverTime);
  const hasData = data.totalProfiles > 0 || data.totalViews > 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0A0A0B]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08] shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              Platform Analytics & Master Insights
            </h2>
            <span className="text-[10px] bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/25 py-0.5 px-2.5 rounded-full font-bold font-mono uppercase tracking-wider">
              360° Control Engine
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Full-spectrum telemetry across user acquisition, revenue volume, AI toolkit consumption, sports distribution, and public reach.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/[0.08]">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-[#C6FF3D] text-black shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {range}
            </button>
          ))}
          <button
            onClick={() => fetchAnalytics()}
            disabled={loading}
            className="p-1.5 text-ink-dim hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer ml-1"
            title="Refresh Master Analytics Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C6FF3D]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-xs font-mono flex items-center justify-between shadow-lg">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !hasData && !error && (
        <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-12 rounded-2xl border border-white/[0.08] text-center">
          <Activity className="w-12 h-12 text-ink-dim mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No Analytics Data Yet</h3>
          <p className="text-sm text-ink-muted">Platform analytics will appear here once athletes start using their cards.</p>
        </div>
      )}

      {/* SECTION 1: MASTER KPI OVERVIEW */}
      {(hasData || loading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08] flex items-center space-x-4 shadow-xl">
            <div className="p-3 bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 rounded-xl shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-ink-muted font-bold uppercase tracking-wider">Total Athletes</p>
              <h3 className="text-xl font-black text-white font-mono mt-0.5">{data.totalProfiles.toLocaleString()}</h3>
              <p className="text-[10px] text-ink-dim font-mono mt-0.5">{data.proAthletesCount} Pro Tier Subscribers</p>
            </div>
          </div>

          <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08] flex items-center space-x-4 shadow-xl">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl shadow-md">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-ink-muted font-bold uppercase tracking-wider">Fan Tips Revenue</p>
              <h3 className="text-xl font-black text-[#C6FF3D] font-mono mt-0.5">{formatUSD(data.totalTipsCents)}</h3>
              <p className="text-[10px] text-ink-dim font-mono mt-0.5">{data.stripeOnboardedCount} Stripe Onboarded</p>
            </div>
          </div>

          <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08] flex items-center space-x-4 shadow-xl">
            <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-ink-muted font-bold uppercase tracking-wider">AI Toolkit Generations</p>
              <h3 className="text-xl font-black text-white font-mono mt-0.5">{data.totalAiGenerations.toLocaleString()}</h3>
              <p className="text-[10px] text-ink-dim font-mono mt-0.5">Pitch & Bio Engine Active</p>
            </div>
          </div>

          <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08] flex items-center space-x-4 shadow-xl">
            <div className="p-3 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-ink-muted font-bold uppercase tracking-wider">Waitlist Growth</p>
              <h3 className="text-xl font-black text-white font-mono mt-0.5">{data.waitlistCount.toLocaleString()}</h3>
              <p className="text-[10px] text-ink-dim font-mono mt-0.5">{data.newsletterCount} Newsletter Leads</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1.5: REFERRAL SYSTEM TELEMETRY */}
      {(hasData || loading) && data.referralAnalytics && (
        <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/[0.08] space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <Share2 className="w-4 h-4 text-[#C6FF3D]" /> Referral Engine & Viral Growth Analytics
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">Track referral link clicks, qualified profile conversions, and top referrer milestone progress.</p>
            </div>
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full font-mono font-bold uppercase">
              6 Months Max Cap Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-ink-muted font-bold uppercase tracking-wider">Referral Link Clicks</p>
                <h4 className="text-lg font-black text-white font-mono mt-0.5">{data.referralAnalytics.totalReferralClicks.toLocaleString()}</h4>
              </div>
              <span className="text-xs text-sky-400 font-mono font-bold">100% Attributed</span>
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-ink-muted font-bold uppercase tracking-wider">Qualified Conversions</p>
                <h4 className="text-lg font-black text-[#C6FF3D] font-mono mt-0.5">{data.referralAnalytics.completedReferrals}</h4>
              </div>
              <span className="text-xs text-[#C6FF3D] font-mono font-bold">Completed & Rewarded</span>
            </div>

            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-ink-muted font-bold uppercase tracking-wider">Pending Profile Audits</p>
                <h4 className="text-lg font-black text-amber-400 font-mono mt-0.5">{data.referralAnalytics.pendingReferrals}</h4>
              </div>
              <span className="text-xs text-amber-400 font-mono font-bold">Card Completion Pending</span>
            </div>
          </div>

          {/* Top Referral Champions Leaderboard */}
          {data.referralAnalytics.topReferrerAthletes.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-ink-muted uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Referral Champions Leaderboard
                </h4>
                {data.referralAnalytics.topReferrerAthletes.length > 4 && (
                  <button
                    onClick={() => setShowAllReferrals(!showAllReferrals)}
                    className="text-xs font-mono font-bold text-[#C6FF3D] hover:text-[#b0ed2f] flex items-center gap-1 transition-colors cursor-pointer bg-[#C6FF3D]/10 hover:bg-[#C6FF3D]/20 px-2.5 py-1 rounded-lg border border-[#C6FF3D]/20"
                  >
                    {showAllReferrals ? (
                      <>Show Top 4 <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>View All ({data.referralAnalytics.topReferrerAthletes.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(showAllReferrals ? data.referralAnalytics.topReferrerAthletes : data.referralAnalytics.topReferrerAthletes.slice(0, 4)).map((leader, idx) => (
                  <div 
                    key={leader.id} 
                    className="p-3.5 bg-black/40 rounded-xl border border-white/[0.06] flex items-center justify-between hover:border-[#C6FF3D]/30 transition-all overflow-hidden"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-[11px] shrink-0 ${
                        idx === 0 ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' :
                        idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                        idx === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30' :
                        'bg-white/10 text-white border border-white/10'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-white tracking-tight truncate">{leader.full_name}</h5>
                        <p className="text-[10px] text-ink-muted font-mono truncate">@{leader.username}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-mono font-bold text-[#C6FF3D] block">
                        {leader.completedCount} referrals
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-ink-dim">
                        +{leader.completedCount} Mo Pro
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: TRAFFIC TIMELINE & ENGAGEMENT METRICS */}
      {(hasData || loading) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            {/* Vector Timeline Chart Card */}
            <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/[0.08] space-y-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-[#C6FF3D]" /> Profile Traffic & Link Click Trends
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">Aggregated daily engagement across public athlete cards.</p>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-bold uppercase font-mono">
                  <span className="flex items-center gap-2 text-[#C6FF3D]">
                    <span className="w-2.5 h-2.5 bg-[#C6FF3D] rounded-sm inline-block shadow-[0_0_8px_rgba(198,255,61,0.5)]" /> Views ({totalViews.toLocaleString()})
                  </span>
                  <span className="flex items-center gap-2 text-sky-400">
                    <span className="w-2.5 h-2.5 bg-sky-400 rounded-sm inline-block shadow-[0_0_8px_rgba(56,189,248,0.5)]" /> Clicks ({totalClicks.toLocaleString()})
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="h-44 flex flex-col items-center justify-center text-ink-muted font-mono text-xs gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#C6FF3D]" />
                  Syncing master platform telemetry...
                </div>
              ) : data.viewsOverTime.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-ink-muted font-mono text-xs gap-2">
                  <Activity className="w-6 h-6" />
                  No traffic data recorded yet
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative w-full h-44 bg-black/30 rounded-xl p-3 border border-white/[0.04]">
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="w-full h-full"
                      preserveAspectRatio="none"
                    >
                      <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#1F1F24" strokeWidth="1" />
                      <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#1F1F24" strokeWidth="1" strokeDasharray="4 4" />
                      <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#27272A" strokeWidth="1" />

                      <path d={viewPath} fill="none" stroke="#C6FF3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d={clickPath} fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                      {viewPoints && viewPoints.map((pt, idx) => {
                        const [x, y] = pt.split(',');
                        return (
                          <circle key={`v-${idx}`} cx={x} cy={y} r="3" fill="#0A0A0B" stroke="#C6FF3D" strokeWidth="2" />
                        );
                      })}
                    </svg>
                  </div>

                  <div className="flex justify-between px-2 text-[10px] text-ink-dim font-mono uppercase tracking-wider font-bold">
                    <span>{data.viewsOverTime[0]?.date || 'Start'}</span>
                    <span>CTR: {clickThroughRate}%</span>
                    <span>{data.viewsOverTime[data.viewsOverTime.length - 1]?.date || 'Today'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Top Performing Athlete Profiles Card */}
            {data.topAthletes.length > 0 && (
              <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/[0.08] space-y-4 shadow-xl">
                <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                  <Award className="w-4 h-4 text-[#C6FF3D]" /> Top Performing Athlete Profiles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.topAthletes.map((athlete, idx) => (
                    <div key={athlete.athlete_id} className="p-3.5 bg-black/40 rounded-xl border border-white/[0.06] flex items-center justify-between hover:border-[#C6FF3D]/30 transition-all overflow-hidden">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 flex items-center justify-center font-mono font-black text-xs shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-white tracking-tight truncate">{athlete.full_name}</h5>
                          <p className="text-[10px] text-ink-muted font-mono truncate">@{athlete.username} • {athlete.sport || 'Athlete'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#C6FF3D] shrink-0 ml-2">
                        {athlete.views.toLocaleString()} views
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sports, Channels & Geographic Telemetry */}
          <div className="space-y-6">
            {data.topSports.length > 0 && (
              <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08] space-y-4 shadow-xl">
                <h4 className="text-xs font-mono font-bold text-ink-muted uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#C6FF3D]" /> Sports Demographics
                </h4>
                <div className="space-y-2">
                  {data.topSports.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-black/40 rounded-xl border border-white/[0.06]">
                      <span className="text-xs font-bold text-white font-mono">{s.sport}</span>
                      <span className="text-[10px] bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20 px-2 py-0.5 rounded-lg font-mono font-bold">
                        {s.count} athletes
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.topReferrers.length > 0 && (
              <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08] space-y-4 shadow-xl overflow-hidden">
                <h4 className="text-xs font-mono font-bold text-ink-muted uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-400 shrink-0" /> Acquisition Channels
                </h4>
                <div className="space-y-2">
                  {data.topReferrers.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 p-2.5 bg-black/40 rounded-xl border border-white/[0.06] overflow-hidden">
                      <span 
                        className="text-xs font-bold text-white font-mono truncate min-w-0 flex-1"
                        title={r.referrer}
                      >
                        {r.referrer}
                      </span>
                      <span className="text-xs text-sky-400 font-mono font-bold shrink-0 text-right whitespace-nowrap">
                        {r.count.toLocaleString()} hits
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.topCountries.length > 0 && (
              <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/[0.08] space-y-3 shadow-xl">
                <h4 className="text-xs font-mono font-bold text-ink-muted uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" /> Geographic Footprint
                </h4>
                <div className="space-y-2">
                  {data.topCountries.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-white/[0.06]">
                      <span className="text-xs font-bold text-white font-mono">{c.country}</span>
                      <span className="text-xs text-emerald-400 font-mono font-bold">{c.count.toLocaleString()} visits</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
