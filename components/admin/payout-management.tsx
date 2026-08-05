"use client";

import { useEffect, useState } from "react";
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { getPayoutData, getAllTipsSummary, updatePayoutStatus } from "@/lib/actions/admin";

type PayoutRequest = {
  id: string;
  athleteEmail: string;
  athleteUsername: string | null;
  amount: number;
  status: string;
  payoutMethod: string | null;
  createdAt: string;
};

type TipsSummary = {
  totalTips: number;
  totalAmount: number;
  thisMonth: number;
  thisMonthAmount: number;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function PayoutManagement() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [summary, setSummary] = useState<TipsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(p: number = page) {
    setLoading(true);
    const [payoutResult, summaryResult] = await Promise.all([
      getPayoutData(p, 20),
      getAllTipsSummary(),
    ]);
    if (payoutResult.ok && payoutResult.data) {
      setRequests(payoutResult.data.requests);
      setTotal(payoutResult.data.total);
    }
    if (summaryResult.ok && summaryResult.data) setSummary(summaryResult.data);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPayoutData(1, 20), getAllTipsSummary()]).then(([payoutResult, summaryResult]) => {
      if (cancelled) return;
      if (payoutResult.ok && payoutResult.data) {
        setRequests(payoutResult.data.requests);
        setTotal(payoutResult.data.total);
      }
      if (summaryResult.ok && summaryResult.data) setSummary(summaryResult.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  async function loadPage(p: number) {
    setPage(p);
    await load(p);
  }

  async function handleStatus(id: string, status: "paid" | "failed") {
    setBusy(id);
    setError(null);
    const result = await updatePayoutStatus(id, status);
    setBusy(null);
    if (!result.ok) {
      setError(result.error || "Failed to update payout");
      return;
    }
    await load();
  }

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl border border-white/[0.06] bg-[#0D0D0F] animate-pulse" />
        ))}
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "pending" || r.status === "processing").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Total Tips</span>
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{summary?.totalTips ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Total Revenue</span>
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 text-2xl font-bold text-accent">${((summary?.totalAmount ?? 0) / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Withdrawal Requests</span>
            <Clock className="h-4 w-4 text-ink-dim" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{total}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">Awaiting Fulfillment</span>
            <Clock className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 text-2xl font-bold text-accent">{pendingCount}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-sm font-medium text-white">Withdrawal Requests ({total})</h3>
          <p className="mt-0.5 text-xs text-ink-dim">
            Fans tip into the platform Stripe account. Send the payout to the athlete within 48 hours, then mark it paid.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Athlete</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Payout Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-ink-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-white/[0.04]">
                  <td className="px-6 py-3">
                    <div>
                      <p className="text-white">{r.athleteEmail}</p>
                      {r.athleteUsername && <p className="text-xs text-ink-dim">/{r.athleteUsername}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-3 font-mono text-accent">${(r.amount / 100).toFixed(2)}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium capitalize text-ink-muted">
                      {r.payoutMethod || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-ink-muted">{timeAgo(r.createdAt)}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      r.status === "paid" ? "bg-green-500/15 text-green-400" :
                      r.status === "failed" ? "bg-red-500/15 text-red-400" :
                      "bg-yellow-500/15 text-yellow-400"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      {r.status === "paid" || r.status === "failed" ? (
                        <span className="text-xs text-ink-dim">Done</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStatus(r.id, "paid")}
                            disabled={busy === r.id}
                            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-bold text-bg transition-all hover:opacity-90 disabled:opacity-40"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Mark paid
                          </button>
                          <button
                            onClick={() => handleStatus(r.id, "failed")}
                            disabled={busy === r.id}
                            className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-40"
                          >
                            <XCircle className="h-3 w-3" />
                            Failed
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-ink-dim">No withdrawal requests yet</td>
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
