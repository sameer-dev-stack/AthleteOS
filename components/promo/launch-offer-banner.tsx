"use client";

import { useState, useTransition } from "react";
import { ArrowRight, ShieldCheck, CheckCircle2, X } from "lucide-react";
import { useMounted } from "@/lib/hooks/use-mounted";
import { claimLaunchPromoTrialAction } from "@/lib/actions/billing";

const DISMISS_KEY = "athleteos_launch_offer_dismissed";

type Props = {
  remainingSlots?: number;
  totalSlots?: number;
  isAuthenticated?: boolean;
  hasClaimed?: boolean;
  trialEndsAt?: string | null;
  className?: string;
};

function formatMonthDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

export function LaunchOfferBanner({
  remainingSlots = 500,
  totalSlots = 500,
  isAuthenticated = false,
  hasClaimed = false,
  trialEndsAt = null,
  className = "",
}: Props) {
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "dismissed",
  );
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const claimedCount = Math.max(0, totalSlots - remainingSlots);
  const percentClaimed = Math.min(100, Math.round((claimedCount / totalSlots) * 100));

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "dismissed");
  }

  async function handleClaim() {
    setErrorMsg(null);

    if (!isAuthenticated) {
      window.location.href = "/auth/sign-up?promo=launch_500";
      return;
    }

    startTransition(async () => {
      const res = await claimLaunchPromoTrialAction();
      if (!res.ok) {
        setErrorMsg(res.error || "Failed to initiate trial");
        return;
      }
      if (res.url) {
        window.location.href = res.url;
      }
    });
  }

  if (hasClaimed) {
    const endLabel = mounted ? formatMonthDay(trialEndsAt) : null;
    return (
      <div className={`flex items-center justify-between gap-3 rounded-xl border border-accent/20 bg-accent/10 px-4 py-2.5 ${className}`}>
        <p className="text-xs font-semibold text-accent flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
          Pro trial active{endLabel ? ` · ends ${endLabel}` : ""}
        </p>
      </div>
    );
  }

  if (mounted && dismissed) return null;

  return (
    <div
      suppressHydrationWarning
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 transition-all duration-300 w-full ${className}`}
      style={{
        background: "radial-gradient(ellipse 130% 120% at 0% 0%, rgba(198, 255, 61, 0.12) 0%, rgba(18, 20, 28, 0.96) 45%, rgba(8, 9, 13, 0.99) 100%)",
        border: "1px solid rgba(198, 255, 61, 0.2)",
        boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.12), 0 25px 60px -15px rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-24 -left-24 h-72 w-72 rounded-full pointer-events-none blur-3xl opacity-20"
        style={{ background: "#C6FF3D" }}
      />

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss launch offer"
        className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white/70"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 w-full">
        {/* Left Section: Offer Details */}
        <div className="flex-1 w-full space-y-4 min-w-0">
          {/* Quiet eyebrow */}
          <span className="inline-flex items-center text-[11px] font-black uppercase tracking-widest text-accent">
            Launch offer
          </span>

          {/* Hero Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              First 500 Athletes Get{" "}
              <span className="bg-gradient-to-r from-[#C6FF3D] via-[#f2ff99] to-[#C6FF3D] bg-clip-text text-transparent">
                3 Months Pro Free
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-white/75 mt-2 leading-relaxed max-w-2xl font-medium">
              90-day Pro trial. Verify your card via Stripe.{" "}
              <span className="text-white font-bold underline decoration-accent/60 underline-offset-4">$0.00 charged today</span>.
            </p>
          </div>

          {/* Single quiet feature line */}
          <p className="text-[13px] text-white/60 font-medium">
            Includes AI bio writer, sponsor pitches, captions, and custom card themes.
          </p>

          {/* Live Claim Progress Bar — shown only with real engagement */}
          {claimedCount > 0 && (
            <div className="w-full max-w-xl pt-2">
              <div className="flex justify-between items-center text-[11px] font-extrabold tracking-wider text-white/60 mb-2 uppercase">
                <span>Claimed: {claimedCount} Athletes</span>
                <span className="text-accent">{percentClaimed}% Claimed</span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/10 p-0.5 border border-white/10 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-accent via-[#e4ff80] to-accent transition-all duration-500 rounded-full shadow-[0_0_16px_rgba(198,255,61,0.7)]"
                  style={{ width: `${Math.max(5, percentClaimed)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Price + CTA */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div
            className="relative overflow-hidden rounded-2xl p-5 border border-white/[0.08] flex flex-col justify-between gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            style={{
              background: "linear-gradient(145deg, rgba(28, 32, 44, 0.95) 0%, rgba(12, 14, 20, 0.98) 100%)",
            }}
          >
            {/* Price header */}
            <div className="flex items-end justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">90 days of Pro</p>
                <p className="text-3xl font-black text-white tracking-tight leading-none mt-1">
                  $0.00
                </p>
              </div>
              <p className="text-right text-[11px] font-semibold text-white/50 leading-snug">
                Valued at<br />
                <span className="text-white/90">$42.00</span>
              </p>
            </div>

            {/* Fine print */}
            <p className="text-[12px] text-white/70 leading-relaxed">
              Requires card verification via Stripe. No charges today. Cancel anytime.
            </p>

            {/* Action CTA Button */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleClaim}
                disabled={isPending || remainingSlots <= 0}
                className="group relative w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-accent text-black font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(198,255,61,0.4)] hover:bg-[#b8f52b] hover:shadow-[0_0_35px_rgba(198,255,61,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
              >
                {isPending ? (
                  <span>Verifying Stripe...</span>
                ) : (
                  <>
                    <span>Claim Free Trial</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/70 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                <span>Stripe 256-bit Secure</span>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-red-400 text-center">{errorMsg}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
