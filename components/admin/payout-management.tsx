"use client";

import { useEffect, useState } from "react";
import { DollarSign, ExternalLink } from "lucide-react";
import { getPayoutData, getAllTipsSummary } from "@/lib/actions/admin";

type PayoutAthlete = {
  email: string;
  username: string | null;
  plan: string;
  stripe_onboarding_complete: boolean;
  totalTips: number;
  tipCount: number;
};

type TipsSummary = {
  totalTips: number;
  totalAmount: number;
  thisMonth: number;
  thisMonthAmount: number;
};

export function PayoutManagement() {
  const [athletes, setAthletes] = useState<PayoutAthlete[]>([]);
  const [summary, setSummary] = useState<TipsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      const [payoutResult, summaryResult] = await Promise.all([
        getPayoutData(1, 20),
        getAllTipsSummary(),
      ]);
      if (payoutResult.ok && payoutResult.data) {
        setAthletes(payoutResult.data.athletes);
        setTotal(payoutResult.data.total);
      }
      if (summaryResult.ok && summaryResult.data) setSummary(summaryResult.data);
      setLoading(false);
    }
    load();
  }, []);

  async function loadPage(p: number) {
    setPage(p);
    const result = await getPayoutData(p, 20);
    if (result.ok && result.data) setAthletes(result.data.athletes);
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
            <span className="text-xs font-medium text-ink-muted">This Month Tips</span>
            <DollarSign className="h-4 w-4 text-ink-dim" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{summary?.thisMonth ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-muted">This Month Revenue</span>
            <DollarSign className="h-4 w-4 text-ink-dim" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">${((summary?.thisMonthAmount ?? 0) / 100).toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-sm font-medium text-white">Athletes with Stripe Connect ({total})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Athlete</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Onboarding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Tips</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-muted">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((a, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td className="px-6 py-3">
                    <div>
                      <p className="text-white">{a.email}</p>
                      {a.username && <p className="text-xs text-ink-dim">/{a.username}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      a.plan === "pro" ? "bg-accent/15 text-accent" :
                      a.plan === "elite" ? "bg-purple-500/15 text-purple-400" :
                      "bg-white/[0.06] text-ink-muted"
                    }`}>
                      {a.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      a.stripe_onboarding_complete ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"
                    }`}>
                      {a.stripe_onboarding_complete ? "Complete" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-ink-muted">{a.tipCount}</td>
                  <td className="px-6 py-3 font-mono text-accent">${(a.totalTips / 100).toFixed(2)}</td>
                </tr>
              ))}
              {athletes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-ink-dim">No athletes with Stripe Connect yet</td>
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
