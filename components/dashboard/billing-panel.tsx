"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Check,
  Crown,
  Zap,
  PartyPopper,
  X,
  CreditCard,
  FileText,
  ChevronRight,
  AlertTriangle,
  ArrowDownToLine,
  BadgeCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createCheckoutSessionAction,
  createPortalSessionAction,
  cancelSubscriptionAction,
  getSubscriptionStatus,
  type SubscriptionStatus,
} from "@/lib/actions/billing";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";

type Props = {
  subscription: SubscriptionStatus;
};

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Public Athlete Card & Link",
      "Standard Card Styling & Colors",
      "Basic View Analytics",
      "Fan Tips Enabled (20% platform fee — standard Stripe processing fees also apply)",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$14",
    period: "/mo",
    features: [
      "NIL Valuation Score & Level",
      "Editable NIL Rate Card",
      "3-in-1 Sponsor Pitch Generator",
      "0% Platform Tip Fee (Keep 100%) — standard payment processing fees still apply",
      "Gold Verified Badge",
      "Premium Themes & Discover Placement",
    ],
  },
];

function CardBrandIcon({ brand }: { brand: string | null }) {
  const b = brand?.toLowerCase() ?? "";
  if (b === "visa") return <span className="text-[10px] font-black italic text-blue-400">VISA</span>;
  if (b === "mastercard") return <span className="text-[10px] font-black text-orange-400">MC</span>;
  if (b === "amex") return <span className="text-[10px] font-black text-blue-300">AMEX</span>;
  if (b === "discover") return <span className="text-[10px] font-black text-orange-300">DISC</span>;
  return <CreditCard className="h-4 w-4 text-ink-dim" />;
}

function UsageRing({ percent }: { percent: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  let strokeColor = "var(--accent, #C6FF3D)";
  if (percent >= 90) strokeColor = "#EF4444";
  else if (percent >= 70) strokeColor = "#F59E0B";

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="flex-shrink-0">
      <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle
        cx="44"
        cy="44"
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 44 44)"
        className="transition-all duration-700 ease-out"
      />
      <text
        x="44"
        y="40"
        textAnchor="middle"
        className="fill-white text-[18px] font-bold"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {percent}%
      </text>
      <text
        x="44"
        y="54"
        textAnchor="middle"
        className="fill-white/40 text-[9px] font-medium"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        used
      </text>
    </svg>
  );
}

export function BillingPanel({ subscription: initial }: Props) {
  const searchParams = useSearchParams();
  const upgradedTier = searchParams.get("upgraded");

  const [subscription, setSubscription] = useState(initial);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "semi_annual" | "annual">("annual");

  const PRO_INTERVALS = [
    {
      key: "monthly" as const,
      label: "1 Month",
      monthlyRate: "$14",
      totalBilled: "$14 billed monthly",
      badge: null,
    },
    {
      key: "semi_annual" as const,
      label: "6 Months",
      monthlyRate: "$11",
      totalBilled: "$66 billed every 6 mo",
      badge: "Save 21%",
    },
    {
      key: "annual" as const,
      label: "1 Year",
      monthlyRate: "$9",
      totalBilled: "$108 billed annually",
      badge: "BEST VALUE · Save 36%",
      highlight: true,
    },
  ];
  const [loading, setLoading] = useState<
    "pro" | "portal" | "cancel" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelStep, setCancelStep] = useState<"confirm" | "processing" | "done">("confirm");
  const subscriptionRef = useRef(subscription);
  subscriptionRef.current = subscription;

  const fetchStatus = useCallback(async () => {
    try {
      const fresh = await getSubscriptionStatus();
      setSubscription(fresh);
      return fresh;
    } catch {
      return subscriptionRef.current;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      if (cancelled) return;
      const fresh = await fetchStatus();
      if (cancelled) return;

      if (upgradedTier && fresh.plan === "free" && retryCount < 5) {
        timer = setTimeout(() => {
          setRetryCount((c) => c + 1);
        }, 2000);
      } else if (upgradedTier && fresh.plan === upgradedTier) {
        setShowSuccess(true);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [upgradedTier, retryCount, fetchStatus]);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 8000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  const currentPlan =
    PLANS.find((p) => p.id === subscription.plan) || PLANS[0];

  async function handleUpgrade(tier: "pro") {
    setLoading(tier);
    setError(null);
    trackFunnel("upgrade_click", { tier });

    const result = await createCheckoutSessionAction({ tier, interval: billingInterval });
    setLoading(null);

    if (result.ok && result.url) {
      trackFunnel("upgrade_complete", { tier });
      window.location.href = result.url;
    } else {
      setError(result.error || "Failed to start checkout");
    }
  }

  async function handleManage() {
    setLoading("portal");
    setError(null);

    const result = await createPortalSessionAction();
    setLoading(null);

    if (result.ok && result.url) {
      window.location.href = result.url;
    } else {
      setError(result.error || "Failed to open billing portal");
    }
  }

  async function handleCancel() {
    setCancelStep("processing");
    setLoading("cancel");
    setError(null);

    const result = await cancelSubscriptionAction();
    setLoading(null);

    if (result.ok) {
      setCancelStep("done");
      setTimeout(() => {
        setShowCancelModal(false);
        setCancelStep("confirm");
        fetchStatus();
      }, 2500);
    } else {
      setCancelStep("confirm");
      setError(result.error || "Failed to cancel subscription");
      setShowCancelModal(false);
    }
  }

  const usagePercent =
    subscription.aiLimit > 0
      ? Math.round((subscription.aiUsed / subscription.aiLimit) * 100)
      : 0;

  const usageColor =
    usagePercent >= 90 ? "text-red-400" :
    usagePercent >= 70 ? "text-amber-400" :
    "text-white";

  return (
    <>
      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-accent/20 bg-accent/10 px-6 py-3">
                <PartyPopper className="h-5 w-5 flex-shrink-0 text-accent" />
                <p className="flex-1 text-sm font-medium text-accent">
                  Welcome to Pro! Your upgrade is active.
                </p>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="text-accent/60 hover:text-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {upgradedTier && subscription.plan === "free" && retryCount > 0 && retryCount < 5 && (
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-6 py-2.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-dim" />
            <p className="text-xs text-ink-dim">Confirming your upgrade...</p>
          </div>
        )}

        <div className="border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Billing</h2>
            <div className="flex items-center gap-1.5">
              {subscription.plan !== "free" && (
                <Crown className="h-3.5 w-3.5 text-accent" />
              )}
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  subscription.plan === "free"
                    ? "bg-white/[0.06] text-ink-muted"
                    : "bg-accent/15 text-accent"
                }`}
              >
                {currentPlan.name}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mb-6 flex items-center gap-6">
            <UsageRing percent={usagePercent} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">AI usage this cycle</p>
              <p className="mt-1 text-xs text-ink-dim">
                {subscription.aiUsed} of {subscription.aiLimit} actions used
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercent >= 90 ? "bg-red-500" :
                    usagePercent >= 70 ? "bg-amber-500" :
                    "bg-accent"
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className={`mt-1.5 text-[11px] font-medium ${usageColor}`}>
                {subscription.aiRemaining} remaining this month
              </p>
            </div>
          </div>

          {subscription.status && subscription.currentPeriodEnd && (
            <p className="mb-4 text-xs text-ink-dim">
              {subscription.status === "active"
                ? `Renews ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}`
                : `Status: ${subscription.status}`}
            </p>
          )}

          {subscription.plan === "pro" && subscription.proExpiresAt && (() => {
            const daysRemaining = Math.ceil(
              (new Date(subscription.proExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return daysRemaining > 0 ? (
              <p className="mb-4 text-xs text-accent">
                Free Pro period expires in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
              </p>
            ) : null;
          })()}

          {subscription.paymentMethod && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
                  <CardBrandIcon brand={subscription.paymentMethod.brand} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white capitalize">
                    {subscription.paymentMethod.brand ?? "Card"} ending in {subscription.paymentMethod.last4}
                  </p>
                  <p className="text-[11px] text-ink-dim">
                    Expires {subscription.paymentMethod.expMonth}/{subscription.paymentMethod.expYear}
                  </p>
                </div>
              </div>
              <button
                onClick={handleManage}
                disabled={loading !== null}
                className="text-[11px] font-medium text-ink-dim hover:text-white transition-colors"
              >
                Update
              </button>
            </div>
          )}

          {subscription.plan !== "free" && (
            <>
              <button
                onClick={handleManage}
                disabled={loading === "portal"}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-ink-muted transition-all hover:bg-white/[0.05] disabled:opacity-40"
              >
                {loading === "portal" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Manage subscription
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={loading !== null}
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-40"
              >
                Cancel at period end
              </button>
            </>
          )}

          {/* ── Pro Billing Interval Selector ────────────────────── */}
          {subscription.plan === "free" && (
            <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/[0.03] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-accent" />
                  Select Pro Billing Cycle
                </span>
                <span className="text-[10px] font-bold text-accent">
                  Save up to 36% on Annual
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PRO_INTERVALS.map((opt) => {
                  const isSelected = billingInterval === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setBillingInterval(opt.key)}
                      className={`relative flex flex-col justify-between rounded-xl p-3.5 text-left border transition-all ${
                        isSelected
                          ? "border-accent bg-accent/15 ring-1 ring-accent/40 shadow-[0_0_20px_rgba(198,255,61,0.2)]"
                          : opt.highlight
                            ? "border-accent/25 bg-accent/[0.04] hover:border-accent/50"
                            : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute -top-2.5 left-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent">
                          <Check className="h-2.5 w-2.5 text-bg" strokeWidth={4} />
                        </span>
                      )}
                      {opt.badge && (
                        <span className="absolute -top-2.5 right-2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-black text-black uppercase shadow-sm">
                          {opt.badge}
                        </span>
                      )}
                      <div>
                        <span className="text-xs font-bold text-white">{opt.label}</span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-xl font-black text-accent">{opt.monthlyRate}</span>
                          <span className="text-[11px] text-white/50">/ mo</span>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] font-medium text-white/40">{opt.totalBilled}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-1">
            {PLANS.filter((p) => p.id !== "free").map((plan) => {
              const isCurrent = subscription.plan === plan.id;
              const activeOpt = PRO_INTERVALS.find((i) => i.key === billingInterval) || PRO_INTERVALS[2];
              const displayPrice = isCurrent ? plan.price : activeOpt.monthlyRate;
              const displayPeriod = isCurrent ? plan.period : "/ mo";

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-5 transition-all ${
                    isCurrent
                      ? "border-accent/30 bg-accent/5 ring-1 ring-accent/10"
                      : "border-accent/40 bg-accent/[0.02]"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                  )}
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent" />
                    <span className="text-base font-bold text-white">
                      NIL CARD Pro
                    </span>
                    {isCurrent ? (
                      <span className="ml-auto rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                        CURRENT PLAN
                      </span>
                    ) : (
                      <span className="ml-auto rounded-full bg-accent/20 border border-accent/30 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                        {activeOpt.label} ({activeOpt.totalBilled})
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">
                      {displayPrice}
                    </span>
                    <span className="text-sm font-medium text-ink-dim">{displayPeriod}</span>
                    {!isCurrent && (
                      <span className="ml-2 text-xs font-semibold text-accent">
                        ({activeOpt.totalBilled})
                      </span>
                    )}
                  </div>
                  <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-1.5 text-xs text-white/80"
                      >
                        {f === "Gold Verified Badge" ? (
                          <BadgeCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#FACC15]" strokeWidth={2.25} />
                        ) : (
                          <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                        )}
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade("pro")}
                    disabled={loading !== null || isCurrent}
                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      isCurrent
                        ? "bg-accent/15 text-accent"
                        : "bg-accent text-bg hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] hover:scale-[1.01]"
                    }`}
                  >
                    {loading === "pro" || loading === "portal" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {isCurrent
                      ? "Active Pro Subscription"
                      : `Upgrade to Pro — ${activeOpt.label} (${activeOpt.totalBilled})`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {subscription.invoices.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
          <div className="border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-ink-dim" />
              <h3 className="text-sm font-semibold text-white">Invoice history</h3>
            </div>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {subscription.invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    inv.status === "paid" ? "bg-accent/10" :
                    inv.status === "open" ? "bg-amber-500/10" :
                    "bg-white/[0.06]"
                  }`}>
                    {inv.status === "paid" ? (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    ) : inv.status === "open" ? (
                      <ArrowDownToLine className="h-3.5 w-3.5 text-amber-400" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-ink-dim" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {new Date(inv.created * 1000).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[11px] text-ink-dim capitalize">{inv.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white font-mono">
                    ${(inv.amount / 100).toFixed(2)}
                  </span>
                  {inv.invoiceUrl && (
                    <a
                      href={inv.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-dim hover:text-white transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => {
              if (cancelStep !== "processing") {
                setShowCancelModal(false);
                setCancelStep("confirm");
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111113] p-6 shadow-2xl"
            >
              {cancelStep === "confirm" && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Cancel subscription?</h3>
                      <p className="text-xs text-ink-dim">You&apos;ll keep access until the period ends</p>
                    </div>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed mb-6">
                    Your {currentPlan.name} plan will remain active until{" "}
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "the end of the billing period"}
                    . After that, you&apos;ll be moved to the Free plan.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowCancelModal(false);
                        setCancelStep("confirm");
                      }}
                      className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-ink-muted transition-all hover:bg-white/[0.05]"
                    >
                      Keep plan
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 rounded-lg bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/25"
                    >
                      Cancel subscription
                    </button>
                  </div>
                </>
              )}
              {cancelStep === "processing" && (
                <div className="flex flex-col items-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-red-400" />
                  <p className="mt-4 text-sm text-ink-muted">Processing cancellation...</p>
                </div>
              )}
              {cancelStep === "done" && (
                <div className="flex flex-col items-center py-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                    <Check className="h-6 w-6 text-red-400" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-white">Subscription cancelled</p>
                  <p className="mt-1 text-xs text-ink-dim">You&apos;ll retain access until the period ends</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
