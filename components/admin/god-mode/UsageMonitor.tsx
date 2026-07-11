import React, { useState, useEffect, useCallback } from 'react';
import { supabaseApi } from './supabase';
import { Cpu, HelpCircle, TrendingUp, Users, Zap, CheckCircle, X } from 'lucide-react';

export default function UsageMonitor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    toolUsage: { tool: string; used_count: number }[];
    topUsers: { user_id: string; full_name: string; email: string; used_count: number; plan: string }[];
    quotaConsumption: {
      free: { used: number; total: number; count: number };
      pro: { used: number; total: number; count: number };
      elite: { used: number; total: number; count: number };
    };
  }>({
    toolUsage: [],
    topUsers: [],
    quotaConsumption: {
      free: { used: 0, total: 0, count: 0 },
      pro: { used: 0, total: 0, count: 0 },
      elite: { used: 0, total: 0, count: 0 }
    }
  });

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseApi.getAiUsageMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load AI usage metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Compute maximum tool usage for chart scaling
  const maxUsage = Math.max(...metrics.toolUsage.map(t => t.used_count), 1);

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

      {/* Quota Consumption Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Free Plan Consumption */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Free Tier Quota</p>
              <h3 className="text-xs font-black text-white mt-0.5">5 ACTIONS / MONTH</h3>
            </div>
            <span className="text-[10px] bg-neutral-950 text-neutral-400 font-mono py-0.5 px-2 rounded border border-neutral-800 uppercase font-bold">
              {metrics.quotaConsumption.free.count} accounts
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>Usage Volume</span>
              <span className="font-bold text-neutral-200">
                {metrics.quotaConsumption.free.used} / {metrics.quotaConsumption.free.total} units
              </span>
            </div>
            <div className="w-full h-2 bg-[#050505] rounded overflow-hidden border border-neutral-800">
              <div 
                className="h-full bg-neutral-500 rounded transition-all duration-500" 
                style={{ width: `${Math.min((metrics.quotaConsumption.free.used / (metrics.quotaConsumption.free.total || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pro Plan Consumption */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-[#C6FF3D] font-bold uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3" /> Pro Athlete
              </p>
              <h3 className="text-xs font-black text-white mt-0.5">300 ACTIONS / MONTH</h3>
            </div>
            <span className="text-[10px] bg-[#C6FF3D]/10 text-[#C6FF3D] font-mono py-0.5 px-2 rounded border border-[#C6FF3D]/20 uppercase font-bold">
              {metrics.quotaConsumption.pro.count} accounts
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>Usage Volume</span>
              <span className="font-bold text-[#C6FF3D]">
                {metrics.quotaConsumption.pro.used} / {metrics.quotaConsumption.pro.total} units
              </span>
            </div>
            <div className="w-full h-2 bg-[#050505] rounded overflow-hidden border border-neutral-800">
              <div 
                className="h-full bg-[#C6FF3D] rounded transition-all duration-500 shadow-sm" 
                style={{ width: `${Math.min((metrics.quotaConsumption.pro.used / (metrics.quotaConsumption.pro.total || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Elite Plan Consumption */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Elite OS</p>
              <h3 className="text-xs font-black text-white mt-0.5">500 ACTIONS / MONTH</h3>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20`}>
              {metrics.quotaConsumption.elite.count} Athletes
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span className="uppercase">Consumption Aggregate</span>
              <span className="font-bold text-neutral-300">{metrics.quotaConsumption.elite.total > 0 ? Math.round((metrics.quotaConsumption.elite.used / metrics.quotaConsumption.elite.total) * 100) : 0}%</span>
            </div>
            <div className="w-full h-2 bg-[#050505] rounded overflow-hidden border border-neutral-800">
              <div 
                className="h-full bg-purple-500 rounded transition-all duration-500" 
                style={{ width: `${metrics.quotaConsumption.elite.total > 0 ? (metrics.quotaConsumption.elite.used / metrics.quotaConsumption.elite.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Bar Chart & Top 20 Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Custom SVG Tool Usage Chart */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 space-y-4">
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-[#C6FF3D]" /> AI Tool Usage Analytics
            </h3>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Aggregated platform tool clicks and generation counts.</p>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-neutral-500 font-mono text-xs">
              Loading AI Chart Details...
            </div>
          ) : metrics.toolUsage.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-neutral-500 font-mono text-[10px] italic border border-dashed border-neutral-800 rounded">
              No AI usage events logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.toolUsage ? (
                // Responsive Visual List Bar Chart
                <div className="space-y-3">
                  {metrics.toolUsage.map((t, idx) => {
                    const percentage = (t.used_count / maxUsage) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="font-bold text-neutral-300 uppercase">{t.tool}</span>
                          <span className="font-bold text-[#C6FF3D]">{t.used_count} generations</span>
                        </div>
                        <div className="relative w-full h-6 bg-[#050505] rounded overflow-hidden border border-neutral-800 flex items-center px-2.5 group">
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-[#C6FF3D]/10 border-r border-[#C6FF3D]/20 transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          />
                          <span className="relative text-[9px] font-mono font-bold text-neutral-500 group-hover:text-neutral-300 transition-colors uppercase tracking-wider">
                            Volume Weight: {Math.round(percentage)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Top 20 Users Leaderboard */}
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-[#C6FF3D]" /> Active Copywriter Leaders
            </h3>
            <p className="text-[10px] text-neutral-500 font-mono">Top athlete users sorted by their monthly copilot generations.</p>
          </div>

          <div className="border border-neutral-800 rounded overflow-hidden bg-[#050505]/30">
            <div className="overflow-y-auto max-h-64 divide-y divide-neutral-850 scrollbar-thin">
              {loading ? (
                <div className="py-8 text-center text-neutral-500 text-[10px] font-mono">Fetching leaderboard stats...</div>
              ) : metrics.topUsers.length === 0 ? (
                <div className="py-8 text-center text-neutral-600 text-[10px] font-mono italic">No user generation logs available.</div>
              ) : (
                metrics.topUsers.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 hover:bg-neutral-900/40 transition-colors text-xs font-mono">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-neutral-500 font-bold w-4 text-[10px]">#{idx + 1}</span>
                      <div>
                        <h5 className="font-bold text-white flex items-center gap-1.5 text-xs">
                          {user.full_name}
                          <span className={`text-[9px] uppercase px-1 rounded font-bold ${
                            user.plan === 'elite' 
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                              : user.plan === 'pro'
                              ? 'bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20'
                              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                          }`}>
                            {user.plan}
                          </span>
                        </h5>
                        <p className="text-[10px] text-neutral-500">{user.email}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-neutral-300 font-mono">{user.used_count}</span>
                      <span className="text-[9px] text-neutral-500 block uppercase font-bold">units</span>
                    </div>
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
