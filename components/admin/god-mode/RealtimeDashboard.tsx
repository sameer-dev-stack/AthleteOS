"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, Users, DollarSign, Eye, RefreshCw, TrendingUp, Clock } from "lucide-react";
import { getRealtimeMetrics } from "@/lib/actions/realtime-metrics";

type LiveMetrics = {
  activeUsers: number;
  totalProfiles: number;
  publishedCards: number;
  recentTips: { amount: number; athlete: string; created_at: string }[];
  recentSignups: { full_name: string; email: string; created_at: string }[];
  pageViewsToday: number;
  tipsTodayCount: number;
  tipsTodayTotal: number;
  aiUsageToday: number;
};

export default function RealtimeDashboard() {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await getRealtimeMetrics();
      if (data) setMetrics(data);
      setLastRefresh(new Date());
    } catch {
      console.error("Failed to fetch realtime metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => fetchMetrics());
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-[#C6FF3D] animate-spin mx-auto" />
          <p className="text-xs text-neutral-500 font-mono">Loading real-time data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#C6FF3D]" />
            Real-time Dashboard
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Auto-refreshes every 15 seconds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500 font-mono">
            Last: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchMetrics}
            className="p-2 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-[#C6FF3D] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Users", value: metrics?.activeUsers ?? 0, icon: Users, color: "#C6FF3D" },
          { label: "Published Cards", value: metrics?.publishedCards ?? 0, icon: Eye, color: "#3b82f6" },
          { label: "Tips Today", value: `$${((metrics?.tipsTodayTotal ?? 0) / 100).toFixed(2)}`, icon: DollarSign, color: "#f59e0b" },
          { label: "Page Views Today", value: metrics?.pageViewsToday ?? 0, icon: TrendingUp, color: "#8b5cf6" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total Profiles</span>
          <div className="text-xl font-black text-white font-mono mt-1">{metrics?.totalProfiles ?? 0}</div>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Tips Today (count)</span>
          <div className="text-xl font-black text-white font-mono mt-1">{metrics?.tipsTodayCount ?? 0}</div>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">AI Usage Today</span>
          <div className="text-xl font-black text-white font-mono mt-1">{metrics?.aiUsageToday ?? 0}</div>
        </div>
      </div>

      {/* Live Feeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Tips */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
          <h3 className="text-xs font-black text-[#C6FF3D] uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5" />
            Recent Tips
          </h3>
          {metrics?.recentTips && metrics.recentTips.length > 0 ? (
            <div className="space-y-2">
              {metrics.recentTips.map((tip, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                  <div>
                    <span className="text-sm font-bold text-white">${(tip.amount / 100).toFixed(2)}</span>
                    <span className="text-[10px] text-neutral-500 ml-2 font-mono">{tip.athlete}...</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(tip.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-4 text-center">No tips today</p>
          )}
        </div>

        {/* Recent Signups */}
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-5">
          <h3 className="text-xs font-black text-[#C6FF3D] uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Recent Signups
          </h3>
          {metrics?.recentSignups && metrics.recentSignups.length > 0 ? (
            <div className="space-y-2">
              {metrics.recentSignups.map((signup, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0">
                  <div>
                    <span className="text-sm font-bold text-white">{signup.full_name}</span>
                    <span className="text-[10px] text-neutral-500 block">{signup.email}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(signup.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-4 text-center">No signups today</p>
          )}
        </div>
      </div>
    </div>
  );
}
