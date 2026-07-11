"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, Clock, UserX } from "lucide-react";
import { getAbuseStats } from "@/lib/actions/admin";
import type { AuditLogEntry } from "@/lib/actions/admin";

type AbuseStats = {
  rateLimitCount: number;
  suspendedCount: number;
  recentAuditActions: AuditLogEntry[];
  suspendedUsers: { email: string; username: string | null; created_at: string }[];
};

export function AbuseDetection() {
  const [stats, setStats] = useState<AbuseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await getAbuseStats();
      if (result.ok && result.data) setStats(result.data);
      setLoading(false);
    }
    load();
  }, []);

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Rate Limits (24h)</span>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats?.rateLimitCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Suspended Users</span>
            <UserX className="h-4 w-4 text-red-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-red-400">{stats?.suspendedCount ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Audit Events (24h)</span>
            <Clock className="h-4 w-4 text-ink-dim" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{stats?.recentAuditActions.length ?? 0}</p>
        </div>
      </div>

      {stats && stats.suspendedUsers.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <h3 className="text-sm font-medium text-white">Suspended Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Created</th>
                </tr>
              </thead>
              <tbody>
                {stats.suspendedUsers.map((u, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td className="px-6 py-3 text-white">{u.email}</td>
                    <td className="px-6 py-3 text-ink-muted">{u.username || "-"}</td>
                    <td className="px-6 py-3 text-ink-dim">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-sm font-medium text-white">Recent Admin Actions (24h)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Time</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentAuditActions.map((a) => (
                <tr key={a.id} className="border-b border-white/[0.04]">
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      a.action.includes("plan") ? "bg-accent/15 text-accent" :
                      a.action.includes("suspend") ? "bg-red-500/15 text-red-400" :
                      a.action.includes("activate") ? "bg-green-500/15 text-green-400" :
                      "bg-white/[0.06] text-ink-muted"
                    }`}>
                      {a.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-ink-muted">{a.target_type} {a.target_id?.slice(0, 8)}...</td>
                  <td className="px-6 py-3 text-ink-dim">{new Date(a.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
              {(stats?.recentAuditActions.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-ink-dim">No recent admin actions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
