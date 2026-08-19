"use client";

import { useEffect, useState } from "react";
import { getGa4Data, getGa4RealtimeUsers, type Ga4Response } from "@/lib/actions/ga4";
import { Users, Activity, Eye, Clock, TrendingDown, Globe, Monitor, Smartphone, Tablet } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  activity: Activity,
  eye: Eye,
  clock: Clock,
  "trending-down": TrendingDown,
};

export function GoogleAnalyticsDashboard() {
  const [data, setData] = useState<Ga4Response | null>(null);
  const [realtime, setRealtime] = useState<{ activeUsers: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getGa4Data(30),
      getGa4RealtimeUsers(),
    ]).then(([ga4Result, realtimeResult]) => {
      if (cancelled) return;
      if (ga4Result.ok && ga4Result.data) {
        setData(ga4Result.data);
      } else {
        setError(ga4Result.error || "Failed to load GA4 data");
      }
      if (realtimeResult.ok && realtimeResult.data) {
        setRealtime(realtimeResult.data);
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setLoading(false);
        setError("Failed to load GA4 data");
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.05] bg-[#111113]/80 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-white/5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
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

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <p className="text-sm text-red-400 font-medium">Google Analytics: {error}</p>
        <p className="text-xs text-white/40 mt-1">Make sure GA4_SERVICE_ACCOUNT_KEY and GA4_PROPERTY_ID are configured.</p>
      </div>
    );
  }

  if (!data) return null;

  const getDeviceIcon = (device: string) => {
    const lower = device.toLowerCase();
    if (lower.includes("mobile")) return Smartphone;
    if (lower.includes("tablet")) return Tablet;
    return Monitor;
  };

  return (
    <div className="space-y-6">
      {/* Header with Realtime */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Google Analytics 4</h3>
          <p className="text-xs text-white/40 mt-0.5">Last 30 days • {data.dateRange}</p>
        </div>
        {realtime && (
          <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span className="text-xs font-bold text-accent">{realtime.activeUsers} online now</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {data.metrics.map((metric) => {
          const IconComponent = iconMap[metric.icon || ""] || Activity;
          return (
            <div
              key={metric.title}
              className="rounded-xl border border-white/[0.05] bg-[#0A0A0B] p-4 min-h-[100px] flex flex-col justify-between transition-all hover:border-white/[0.12]"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/50">
                  <IconComponent className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{metric.title}</span>
              </div>
              <div className="text-xl font-black text-white tracking-tight">{metric.value}</div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Top Pages */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.05] bg-[#111113]/80 p-5">
          <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">Top Pages</h4>
          <div className="space-y-2.5">
            {data.topPages.length === 0 ? (
              <p className="text-xs text-white/30">No page view data available</p>
            ) : (
              data.topPages.map((page, i) => (
                <div key={page.page} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-bold text-white/20 w-4">{i + 1}</span>
                    <span className="text-xs text-white/70 truncate font-mono">{page.page}</span>
                  </div>
                  <span className="text-xs font-semibold text-white/50">{page.views.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Countries + Devices */}
        <div className="space-y-6">
          {/* Top Countries */}
          <div className="rounded-2xl border border-white/[0.05] bg-[#111113]/80 p-5">
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">Top Countries</h4>
            <div className="space-y-2.5">
              {data.topCountries.length === 0 ? (
                <p className="text-xs text-white/30">No country data available</p>
              ) : (
                data.topCountries.slice(0, 5).map((country) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <span className="text-xs text-white/70">{country.country}</span>
                    <span className="text-xs font-semibold text-white/50">{country.users.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Devices */}
          <div className="rounded-2xl border border-white/[0.05] bg-[#111113]/80 p-5">
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">Devices</h4>
            <div className="space-y-2.5">
              {data.devices.length === 0 ? (
                <p className="text-xs text-white/30">No device data available</p>
              ) : (
                data.devices.map((device) => {
                  const DeviceIcon = getDeviceIcon(device.device);
                  return (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DeviceIcon className="h-3.5 w-3.5 text-white/40" />
                        <span className="text-xs text-white/70">{device.device}</span>
                      </div>
                      <span className="text-xs font-semibold text-white/50">{device.users.toLocaleString()}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
