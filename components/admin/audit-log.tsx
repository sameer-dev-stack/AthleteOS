"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Ban,
  CheckCircle,
  Settings,
  User,
} from "lucide-react";
import { getAuditLogs, type AuditLogEntry } from "@/lib/actions/admin";

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, { label: string; icon: typeof Shield }> = {
  update_user_plan: { label: "Plan updated", icon: Settings },
  suspend_user: { label: "User suspended", icon: Ban },
  activate_user: { label: "User activated", icon: CheckCircle },
};

function ActionBadge({ action }: { action: string }) {
  const config = ACTION_LABELS[action] || { label: action, icon: User };
  const Icon = config.icon;

  const styles: Record<string, string> = {
    update_user_plan: "bg-accent/10 text-accent",
    suspend_user: "bg-red-500/10 text-red-400",
    activate_user: "bg-accent/10 text-accent",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
        styles[action] || "bg-white/[0.06] text-ink-muted"
      }`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function formatTimestamp(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    const result = await getAuditLogs(p, PAGE_SIZE);
    if (result.ok && result.data) {
      setLogs(result.data.logs);
      setTotal(result.data.total);
    } else {
      setError(result.error || "Failed to load audit logs");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => fetchLogs(page));
  }, [page, fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function renderTarget(entry: AuditLogEntry) {
    if (!entry.target_id) return <span className="text-ink-dim">—</span>;
    const meta = entry.metadata as Record<string, unknown>;
    if (entry.target_type === "profile" && meta.plan) {
      return (
        <span className="text-white">
          plan &rarr;{" "}
          <span className="capitalize text-accent">{String(meta.plan)}</span>
        </span>
      );
    }
    if (entry.target_type === "profile" && "active" in meta) {
      return (
        <span className="text-white">
          {meta.active ? "activated" : "suspended"}
        </span>
      );
    }
    return (
      <span className="text-ink-muted text-xs font-mono">
        {entry.target_type}/{entry.target_id.slice(0, 8)}
      </span>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-white/[0.06]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] bg-[#1A1A1C]">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                Actor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                Target
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                Details
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-muted">
                When
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-muted">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-muted">
                  No audit entries yet
                </td>
              </tr>
            ) : (
              logs.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <ActionBadge action={entry.action} />
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted font-mono">
                    {entry.admin_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">{renderTarget(entry)}</td>
                  <td className="px-4 py-3 text-xs text-ink-dim">
                    {Object.keys(entry.metadata).length > 0
                      ? JSON.stringify(entry.metadata)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-ink-muted">
                    {formatTimestamp(entry.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-ink-dim">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
