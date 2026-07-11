"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, Zap, TrendingUp } from "lucide-react";
import { getUsageStats, getUserUsageList } from "@/lib/actions/admin";

type UsageStats = {
  totalGenerations: number;
  activeUsers: number;
  avgPerUser: number;
  planDistribution: { plan: string; count: number }[];
  topUsers: { email: string; plan: string; used: number }[];
};

type UsageUser = {
  email: string;
  plan: string;
  used: number;
  periodStart: string;
};

export function UsageMonitor() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [users, setUsers] = useState<UsageUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [statsResult, usersResult] = await Promise.all([
        getUsageStats(),
        getUserUsageList(1, 20),
      ]);
      if (statsResult.ok && statsResult.data) setStats(statsResult.data);
      if (usersResult.ok && usersResult.data) {
        setUsers(usersResult.data.users);
        setTotal(usersResult.data.total);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function loadPage(p: number) {
    setPage(p);
    const result = await getUserUsageList(p, 20);
    if (result.ok && result.data) setUsers(result.data.users);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl border border-white/[0.06] bg-[#0D0D0F] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Zap} label="Total Generations" value={stats?.totalGenerations ?? 0} accent />
        <StatCard icon={Users} label="Active AI Users" value={stats?.activeUsers ?? 0} />
        <StatCard icon={TrendingUp} label="Avg Per User" value={stats?.avgPerUser ?? 0} />
        <StatCard icon={BarChart3} label="Total Users" value={stats?.planDistribution.reduce((s, p) => s + p.count, 0) ?? 0} />
      </div>

      {stats && stats.planDistribution.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6">
          <h3 className="mb-4 text-sm font-medium text-white">Plan Distribution</h3>
          <div className="flex gap-4">
            {stats.planDistribution.map((p) => (
              <div key={p.plan} className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  p.plan === "pro" ? "bg-accent/15 text-accent" :
                  p.plan === "elite" ? "bg-purple-500/15 text-purple-400" :
                  "bg-white/[0.06] text-ink-muted"
                }`}>
                  {p.plan}
                </span>
                <span className="text-sm font-bold text-white">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-sm font-medium text-white">Top AI Users This Month</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Generations</th>
              </tr>
            </thead>
            <tbody>
              {stats?.topUsers.map((u, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td className="px-6 py-3 text-white">{u.email}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      u.plan === "pro" ? "bg-accent/15 text-accent" :
                      u.plan === "elite" ? "bg-purple-500/15 text-purple-400" :
                      "bg-white/[0.06] text-ink-muted"
                    }`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-accent">{u.used}</td>
                </tr>
              ))}
              {(!stats?.topUsers || stats.topUsers.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-ink-dim">No AI usage this month</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-sm font-medium text-white">All Users ({total})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Period</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td className="px-6 py-3 text-white">{u.email}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      u.plan === "pro" ? "bg-accent/15 text-accent" :
                      u.plan === "elite" ? "bg-purple-500/15 text-purple-400" :
                      "bg-white/[0.06] text-ink-muted"
                    }`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-white">{u.used}</td>
                  <td className="px-6 py-3 text-ink-dim">{u.periodStart}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-ink-dim">No usage data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3">
            <button onClick={() => loadPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg px-3 py-1.5 text-xs text-ink-muted hover:text-white disabled:opacity-30">Previous</button>
            <span className="text-xs text-ink-dim">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => loadPage(page + 1)} disabled={page * 20 >= total} className="rounded-lg px-3 py-1.5 text-xs text-ink-muted hover:text-white disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof BarChart3; label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        <Icon className="h-4 w-4 text-ink-dim" />
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent ? "text-accent" : "text-white"}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
