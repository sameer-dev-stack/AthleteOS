"use client";

import { useState, useEffect, useRef } from "react";
import { DollarSign, Clock, ArrowDownToLine, TrendingUp, Loader2, AlertCircle, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { getBalanceSummary, getPayoutHistory, createPayout, type BalanceSummary, type PayoutRecord } from "@/lib/actions/balance";
import { PaymentMethodSetup } from "./payment-method-setup";

const MINIMUM_PAYOUT_CENTS = 2500;

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

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

export function BalanceOverview() {
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getBalanceSummary(), getPayoutHistory()]).then(([summaryRes, payoutsRes]) => {
      if (cancelled) return;
      if (summaryRes.ok && summaryRes.data) setSummary(summaryRes.data);
      if (payoutsRes.ok && payoutsRes.data) setPayouts(payoutsRes.data);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  async function handleWithdraw() {
    setWithdrawing(true);
    setWithdrawResult(null);
    const result = await createPayout();
    if (!mountedRef.current) return;
    setWithdrawing(false);

    if (result.ok && result.data) {
      setWithdrawResult({
        ok: true,
        message: `Withdrawal of ${formatCents(result.data.amount)} requested. It will be sent to your PayPal account within 24-48 hours.`,
      });
      const [summaryRes, payoutsRes] = await Promise.all([getBalanceSummary(), getPayoutHistory()]);
      if (mountedRef.current && summaryRes.ok && summaryRes.data) setSummary(summaryRes.data);
      if (mountedRef.current && payoutsRes.ok && payoutsRes.data) setPayouts(payoutsRes.data);
    } else {
      setWithdrawResult({ ok: false, message: result.error || "Payout failed. Try again." });
    }

    setTimeout(() => { if (mountedRef.current) setWithdrawResult(null); }, 8000);
  }

  if (loading) {
    return (
      <SkeletonCard>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        </div>
      </SkeletonCard>
    );
  }

  const s = summary || { earned: 0, pending: 0, available: 0, withdrawn: 0, connected: false, onboardingComplete: false };
  const canWithdraw = s.connected && s.onboardingComplete && s.available >= MINIMUM_PAYOUT_CENTS;
  const progressToMin = Math.min(100, (s.available / MINIMUM_PAYOUT_CENTS) * 100);

  const cards = [
    {
      label: "Earned",
      value: formatCents(s.earned),
      sub: "Free: 80% net · Pro: 100% net",
      Icon: TrendingUp,
      accent: true,
    },
    {
      label: "Pending",
      value: formatCents(s.pending),
      sub: "In-flight PayPal payouts",
      Icon: Clock,
      accent: false,
    },
    {
      label: "Available",
      value: formatCents(s.available),
      sub: "Ready for PayPal withdrawal",
      Icon: DollarSign,
      accent: false,
    },
    {
      label: "Withdrawn",
      value: formatCents(s.withdrawn),
      sub: "Sent to PayPal",
      Icon: ArrowDownToLine,
      accent: false,
    },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113]">
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold text-white">PayPal Tip Balance</h2>
        </div>
        <span className="rounded-md bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">
          PayPal Payouts Only
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Stats Row ──────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
              <div className="flex items-center gap-1.5 text-white/40">
                <card.Icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{card.label}</span>
              </div>
              <p className={`mt-2.5 text-2xl font-bold ${card.accent ? "text-accent" : "text-white"}`}>
                {card.value}
              </p>
              <p className="mt-0.5 text-[11px] text-white/30">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Payment Method Setup Banner ──────── */}
        {!s.onboardingComplete && (
          <PaymentMethodSetup onSuccess={() => window.location.reload()} />
        )}

        {s.connected && s.onboardingComplete && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-white">Withdraw to PayPal</p>
                <p className="mt-0.5 text-[11px] text-white/30">
                  Minimum ${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)} · Transfer within 24-48 hours
                </p>
              </div>
              {s.available < MINIMUM_PAYOUT_CENTS && (
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="text-[11px] text-white/40 underline hover:text-white/60"
                >
                  {showBreakdown ? "Hide" : "Details"}
                </button>
              )}
            </div>

            {s.available < MINIMUM_PAYOUT_CENTS && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] text-white/40 mb-1.5">
                  <span>Progress to ${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)} PayPal minimum</span>
                  <span>{formatCents(s.available)} / ${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressToMin}%`, background: progressToMin < 100 ? "rgba(255,255,255,0.15)" : "var(--accent, #C6FF3D)" }}
                  />
                </div>
                {showBreakdown && (
                  <div className="mt-3 space-y-1.5 text-[11px] text-white/40">
                    <div className="flex justify-between"><span>Available balance</span><span className="text-white/60">{formatCents(s.available)}</span></div>
                    <div className="flex justify-between"><span>Minimum PayPal threshold</span><span className="text-white/60">${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Still needed</span><span className="text-white/60">{formatCents(Math.max(0, MINIMUM_PAYOUT_CENTS - s.available))}</span></div>
                    <div className="flex justify-between"><span>Tip Split</span><span className="text-white/60">Free 80% · Pro 100%</span></div>
                    <div className="flex justify-between"><span>Transfer arrival</span><span className="text-white/60">Within 24-48 hours</span></div>
                  </div>
                )}
              </div>
            )}

            {s.available >= MINIMUM_PAYOUT_CENTS && !withdrawResult && (
              <div className="text-[11px] text-white/40 mb-3 flex items-center gap-4">
                <span>Exclusive PayPal Payout</span>
                <span>Sent within 24-48 hours</span>
              </div>
            )}

            {withdrawResult && (
              <div
                className={`mb-3 flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm ${
                  withdrawResult.ok
                    ? "bg-accent/10 border border-accent/20 text-accent"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {withdrawResult.ok ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{withdrawResult.message}</span>
              </div>
            )}

            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !canWithdraw}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {withdrawing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
              {withdrawing
                ? "Processing PayPal Request..."
                : `Withdraw ${formatCents(s.available)} to PayPal`}
            </button>
          </div>
        )}

        {payouts.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">
              Payout history
            </p>
            <div className="space-y-2">
              {payouts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.04] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        p.status === "paid" ? "bg-accent/15" : p.status === "failed" ? "bg-red-500/15" : "bg-white/[0.06]"
                      }`}
                    >
                      {p.status === "paid" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-accent" />
                      ) : p.status === "failed" ? (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-white/40" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {p.status === "paid" ? "Completed" : p.status === "failed" ? "Failed" : "Processing"}
                      </p>
                      <p className="text-[11px] text-white/30">
                        {timeAgo(p.createdAt)}
                        {p.arrivalDate && p.status === "paid" && ` · Arrived ${new Date(p.arrivalDate).toLocaleDateString()}`}
                        {p.arrivalDate && p.status === "pending" && ` · Est. arrival ${new Date(p.arrivalDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {formatCents(p.amount)}
                    </p>
                    <p className={`text-[11px] capitalize ${
                      p.status === "paid" ? "text-accent" : p.status === "failed" ? "text-red-400" : "text-white/30"
                    }`}>
                      {p.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {payouts.length === 0 && s.connected && s.onboardingComplete && (
          <div className="rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.01] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a2412]">
              <ArrowDownToLine className="h-7 w-7 text-accent" />
            </div>
            <p className="mt-5 text-sm font-bold text-white">No payouts yet</p>
            <p className="mt-1.5 max-w-xs mx-auto text-xs leading-relaxed text-white/40">
              Once you reach the ${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)} minimum, you can request a withdrawal. Your earnings are sent within 48 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
