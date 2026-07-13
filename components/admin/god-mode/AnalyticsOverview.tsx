import React, { useState, useEffect, useCallback } from 'react';
import { supabaseApi } from './supabase';
import { Eye, MousePointer, Globe, TrendingUp, Compass, Share2, X } from 'lucide-react';

export default function AnalyticsOverview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    totalViews: number;
    uniqueViewers: number;
    topReferrers: { referrer: string; count: number }[];
    topCountries: { country: string; count: number }[];
    viewsOverTime: { date: string; views: number; clicks: number }[];
  }>({
    totalViews: 0,
    uniqueViewers: 0,
    topReferrers: [],
    topCountries: [],
    viewsOverTime: []
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseApi.getAnalyticsOverview();
      setData(result);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => fetchAnalytics());
  }, [fetchAnalytics]);

  // Calculate Click-Through Rate (Clicks / Views)
  const totalClicks = data.viewsOverTime.reduce((sum, day) => sum + day.clicks, 0);
  const clickThroughRate = data.totalViews > 0 
    ? ((totalClicks / data.totalViews) * 100).toFixed(1) 
    : '0.0';

  // Construct SVG Line Chart Coordinates
  const chartHeight = 120;
  const chartWidth = 500;
  const padding = 20;

  const getChartCoordinates = (points: { date: string; views: number; clicks: number }[]) => {
    if (points.length === 0) return { viewPath: '', clickPath: '' };

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
      viewPoints: viewCoordinates,
      clickPoints: clickCoordinates
    };
  };

  const { viewPath, clickPath, viewPoints, clickPoints } = getChartCoordinates(data.viewsOverTime);

  return (
    <div className="space-y-4">
      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 text-red-400 text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Analytics Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Card Views */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 flex items-center space-x-3">
          <div className="p-2 bg-neutral-900 text-[#C6FF3D] rounded">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total Profile Views</p>
            <h3 className="text-base font-black text-white font-mono mt-0.5">{data.totalViews.toLocaleString()}</h3>
          </div>
        </div>

        {/* Metric 2: Unique Viewers */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 flex items-center space-x-3">
          <div className="p-2 bg-neutral-900 text-blue-400 rounded">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Unique Visitors</p>
            <h3 className="text-base font-black text-white font-mono mt-0.5">{data.uniqueViewers.toLocaleString()}</h3>
          </div>
        </div>

        {/* Metric 3: Total Link Clicks */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 flex items-center space-x-3">
          <div className="p-2 bg-neutral-900 text-purple-400 rounded">
            <MousePointer className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total Click Events</p>
            <h3 className="text-base font-black text-white font-mono mt-0.5">{totalClicks.toLocaleString()}</h3>
          </div>
        </div>

        {/* Metric 4: Platform CTR */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 flex items-center space-x-3">
          <div className="p-2 bg-neutral-900 text-emerald-400 rounded">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Click-Through Rate</p>
            <h3 className="text-base font-black text-[#C6FF3D] font-mono mt-0.5">{clickThroughRate}%</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: line Chart & Referrer Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scalable Line Chart Area */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-[#C6FF3D]" /> Card Traffic & Reach Timeline
              </h3>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Aggregated platform page views and link clicks over time.</p>
            </div>
            
            {/* Chart Legend */}
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase font-mono">
              <span className="flex items-center gap-1.5 text-[#C6FF3D]">
                <span className="w-2 h-2 bg-[#C6FF3D] rounded-sm inline-block" /> Views
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 bg-blue-400 rounded-sm inline-block" /> Clicks
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-44 flex items-center justify-center text-neutral-500 font-mono text-[10px]">
              Loading line chart stats...
            </div>
          ) : data.viewsOverTime.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-neutral-500 font-mono text-[10px] italic border border-dashed border-neutral-800 rounded">
              No daily traffic events recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Responsive SVG Container */}
              <div className="relative w-full h-36">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  {/* Grid Lines */}
                  <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#1A1A1A" strokeWidth="1" />
                  <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#1A1A1A" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#222222" strokeWidth="1" />

                  {/* Views Line Path */}
                  <path
                    d={viewPath}
                    fill="none"
                    stroke="#C6FF3D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Clicks Line Path */}
                  <path
                    d={clickPath}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* View Point Circles */}
                  {viewPoints && viewPoints.map((pt, idx) => {
                    const [x, y] = pt.split(',');
                    return (
                      <circle
                        key={`v-${idx}`}
                        cx={x}
                        cy={y}
                        r="2.5"
                        fill="#050505"
                        stroke="#C6FF3D"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Click Point Circles */}
                  {clickPoints && clickPoints.map((pt, idx) => {
                    const [x, y] = pt.split(',');
                    return (
                      <circle
                        key={`c-${idx}`}
                        cx={x}
                        cy={y}
                        r="2"
                        fill="#050505"
                        stroke="#3B82F6"
                        strokeWidth="1"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Dates indicator */}
              <div className="flex justify-between px-4 text-[9px] text-neutral-500 font-mono uppercase tracking-wider font-bold">
                <span>{data.viewsOverTime[0]?.date || 'Past'}</span>
                <span>{data.viewsOverTime[Math.floor(data.viewsOverTime.length / 2)]?.date || 'Timeline'}</span>
                <span>{data.viewsOverTime[data.viewsOverTime.length - 1]?.date || 'Today'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Side panels: Top Referrers & Countries */}
        <div className="space-y-4">
          {/* Top Referrers Panel */}
          <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 space-y-3">
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#C6FF3D]" /> Acquisition Channels
            </h4>

            <div className="space-y-1.5">
              {loading ? (
                <div className="py-4 text-center text-neutral-500 text-[10px] font-mono">Loading acquisition data...</div>
              ) : data.topReferrers.length === 0 ? (
                <div className="py-4 text-center text-neutral-500 text-[10px] font-mono italic">No referrer links logged.</div>
              ) : (
                data.topReferrers.map((r, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-[#050505]/40 rounded border border-neutral-800/60">
                    <span className="text-[10px] font-bold text-neutral-300 font-mono">{r.referrer}</span>
                    <span className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                      {r.count} hits
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Countries Panel */}
          <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 space-y-3">
            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-[#C6FF3D]" /> Geographic Footprint
            </h4>

            <div className="space-y-1.5">
              {loading ? (
                <div className="py-4 text-center text-neutral-500 text-[10px] font-mono">Loading geo data...</div>
              ) : data.topCountries.length === 0 ? (
                <div className="py-4 text-center text-neutral-500 text-[10px] font-mono italic">No geographic data logged.</div>
              ) : (
                data.topCountries.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-[#050505]/40 rounded border border-neutral-800/60">
                    <span className="text-[10px] font-bold text-neutral-300 font-mono flex items-center gap-1.5">
                      <span className="text-neutral-500 font-bold font-mono text-[9px]">[{c.country}]</span>
                      {c.country === 'US' ? 'United States' : c.country === 'CA' ? 'Canada' : c.country === 'GB' ? 'United Kingdom' : c.country === 'AU' ? 'Australia' : 'Other Locations'}
                    </span>
                    <span className="text-[10px] text-[#C6FF3D] font-mono font-black">
                      {c.count} sessions
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
