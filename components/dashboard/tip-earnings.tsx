"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, ArrowRight, AlertCircle, Loader2, User, Share2 } from "lucide-react";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { getTipEarnings, type TipEarnings } from "@/lib/actions/tips";
import { getBalanceSummary, type BalanceSummary } from "@/lib/actions/balance";
import { PaymentMethodSetup } from "./payment-method-setup";
import Link from "next/link";

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

export function TipEarnings({
  earnings: propEarnings,
  balance: propBalance,
  loading: propLoading,
}: {
  earnings?: TipEarnings | null;
  balance?: BalanceSummary | null;
  loading?: boolean;
}) {
  const [localEarnings, setLocalEarnings] = useState<TipEarnings | null>(null);
  const [localBalance, setLocalBalance] = useState<BalanceSummary | null>(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (propLoading === undefined) {
      let cancelled = false;
      Promise.all([getTipEarnings(), getBalanceSummary()]).then(([earningsResult, balanceResult]) => {
        if (cancelled) return;
        if (earningsResult.ok && earningsResult.data) setLocalEarnings(earningsResult.data);
        if (!earningsResult.ok) setLocalError(earningsResult.error || "Failed to load tip earnings");
        if (balanceResult.ok && balanceResult.data) setLocalBalance(balanceResult.data);
        setLocalLoading(false);
      }).catch((err) => {
        if (!cancelled) {
          setLocalError(err instanceof Error ? err.message : "Failed to load earnings");
          setLocalLoading(false);
        }
      });
      return () => { cancelled = true; };
    }
  }, [propLoading]);

  const activeLoading = propLoading !== undefined ? propLoading : localLoading;
  const activeEarnings = propEarnings !== undefined ? propEarnings : localEarnings;
  const activeBalance = propBalance !== undefined ? propBalance : localBalance;
  const activeError = localError;

  if (activeLoading) {
    return (
      <SkeletonCard>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-10 rounded-lg" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        </div>
      </SkeletonCard>
    );
  }

  const e = activeEarnings || {
    totalEarned: 0,
    totalTips: 0,
    averageTip: 0,
    lastTipAt: null,
    lastTipAmount: null,
    lastTipFrom: null,
    recentTips: [],
  };

  const b = activeBalance || { available: 0, pending: 0, connected: false, onboardingComplete: false };

  async function handleShareTipJar() {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Tip me on AthleteOS", text: "Support me through my AthleteOS tip jar!", url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {}
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113]">
      {/* ── Header ──────────────────────────── */}
      <div className="border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-bold text-white">Tip Earnings</h2>
          </div>
          <button
            onClick={handleShareTipJar}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Share2 className="h-3 w-3" />
            Share tip jar
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {activeError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
            <p className="text-xs text-red-400">{activeError}</p>
            <button
              onClick={() => {
                setLocalError(null);
                setLocalLoading(true);
                Promise.all([getTipEarnings(), getBalanceSummary()]).then(([earningsResult, balanceResult]) => {
                  if (earningsResult.ok && earningsResult.data) setLocalEarnings(earningsResult.data);
                  if (!earningsResult.ok) setLocalError(earningsResult.error || "Failed to load tip earnings");
                  if (balanceResult.ok && balanceResult.data) setLocalBalance(balanceResult.data);
                  setLocalLoading(false);
                }).catch((err) => {
                  setLocalError(err instanceof Error ? err.message : "Failed to load earnings");
                  setLocalLoading(false);
                });
              }}
              className="mt-2 text-xs font-semibold text-red-300 hover:text-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!activeError && (
          <>
        {!b.onboardingComplete && (
          <PaymentMethodSetup onSuccess={() => window.location.reload()} />
        )}

        {/* ── Stats Row ──────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
            <p className="text-xs text-white/40">Available to withdraw</p>
            <p className="mt-2 text-2xl font-bold text-accent">
              {formatCents(b.available)}
            </p>
          </div>

          <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
            <p className="text-xs text-white/40">Pending</p>
            <p className="mt-2 text-2xl font-bold text-white/40">
              {formatCents(b.pending)}
            </p>
          </div>
        </div>

        {/* ── CTA Button ──────────────────────── */}
        {b.onboardingComplete && (
          <div>
            <Link
              href="/dashboard/billing"
              className="w-full flex justify-center items-center gap-1.5 bg-accent text-bg font-bold text-xs rounded-xl py-2.5 hover:opacity-90 transition-opacity"
            >
              <span>Withdraw Funds to PayPal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* ── Recent Tips ────────────────────── */}
        {e.recentTips.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/30">
              Recent tips
            </p>
            <div className="space-y-2">
              {e.recentTips.map((tip) => (
                <div
                  key={tip.id}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.04] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15">
                      <User className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {tip.senderName || "Anonymous"}
                      </p>
                      <p className="text-[11px] text-white/30">
                        {timeAgo(tip.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-accent">
                      {formatCents(tip.amount)}
                    </p>
                    <p className="text-[11px] text-white/30">
                      {formatCents(tip.netAmount)} net
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty State ────────────────────── */}
        {e.totalTips === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.01] p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a2412]">
              <DollarSign className="h-7 w-7 text-accent" />
            </div>
            <p className="mt-5 text-sm font-bold text-white">No tips yet</p>
            <p className="mt-1.5 max-w-xs mx-auto text-xs leading-relaxed text-white/40">
              Share your public card with fans. When they tip you, earnings show up here.
            </p>
            <button
              onClick={() => {
                const url = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
                if (navigator.share) {
                  navigator.share({ title: "Check out my athlete card", url });
                } else {
                  navigator.clipboard.writeText(url);
                }
              }}
              className="mt-4 rounded-lg bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              Share your card
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
