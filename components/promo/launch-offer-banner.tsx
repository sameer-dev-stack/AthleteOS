"use client";

import { useState, useTransition } from "react";
import { Sparkles, Zap, ArrowRight, ShieldCheck, CheckCircle2, Crown, Check, Flame } from "lucide-react";
import { claimLaunchPromoTrialAction } from "@/lib/actions/billing";

type Props = {
  remainingSlots?: number;
  totalSlots?: number;
  isAuthenticated?: boolean;
  hasClaimed?: boolean;
  className?: string;
};

export function LaunchOfferBanner({
  remainingSlots = 500,
  totalSlots = 500,
  isAuthenticated = false,
  hasClaimed = false,
  className = "",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const claimedCount = Math.max(0, totalSlots - remainingSlots);
  const percentClaimed = Math.min(100, Math.round((claimedCount / totalSlots) * 100));

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
    return (
      <div className={`rounded-2xl bg-accent/10 border border-accent/30 p-5 flex items-center gap-4 backdrop-blur-xl shadow-xl ${className}`}>
        <div className="h-11 w-11 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(198,255,61,0.3)]">
          <CheckCircle2 className="h-6 w-6 text-accent" />
        </div>
        <div>
          <p className="text-sm font-black text-white tracking-wider uppercase">3-Month Pro VIP Trial Unlocked 🎉</p>
          <p className="text-xs text-white/60 mt-0.5">Your 90-day Pro Trial is active. Enjoy custom card themes & AI actions!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      suppressHydrationWarning
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 transition-all duration-300 w-full ${className}`}
      style={{
        background: "radial-gradient(ellipse 130% 120% at 0% 0%, rgba(198, 255, 61, 0.15) 0%, rgba(18, 20, 28, 0.96) 45%, rgba(8, 9, 13, 0.99) 100%)",
        border: "1px solid rgba(198, 255, 61, 0.35)",
        boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.2), 0 25px 60px -15px rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Background Laser Mesh & Ambient Spotlights */}
      <div
        className="absolute -top-24 -left-24 h-72 w-72 rounded-full pointer-events-none blur-3xl opacity-30 animate-pulse"
        style={{ background: "#C6FF3D" }}
      />
      <div
        className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full pointer-events-none blur-3xl opacity-20"
        style={{ background: "#00F2FE" }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 w-full">
        {/* Left Section: Campaign Details */}
        <div className="flex-1 w-full space-y-4 min-w-0">
          {/* Header Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-accent/20 text-accent border border-accent/40 shadow-[0_0_18px_rgba(198,255,61,0.3)] flex-shrink-0">
              <Flame className="h-3.5 w-3.5 text-accent fill-accent animate-bounce" />
              Launch Offer
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold text-white/90 bg-white/[0.08] border border-white/[0.14] backdrop-blur-md flex-shrink-0">
              <Zap className="h-3.5 w-3.5 text-accent fill-accent" />
              {remainingSlots} / {totalSlots} Spots Remaining
            </span>
          </div>

          {/* Hero Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              First 500 Athletes Get{" "}
              <span className="bg-gradient-to-r from-[#C6FF3D] via-[#f2ff99] to-[#C6FF3D] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(198,255,61,0.4)]">
                3 Months Pro Free
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-white/75 mt-2 leading-relaxed max-w-2xl font-medium">
              Join today and claim your 90-day Pro Plan Access Pass. Verify your card securely via Stripe —{" "}
              <span className="text-white font-bold underline decoration-accent/60 underline-offset-4">$0.00 charged today</span>.
            </p>
          </div>

          {/* Feature Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white/90">
              <Check className="h-4 w-4 text-accent flex-shrink-0" />
              <span>Custom Card Themes</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white/90">
              <Check className="h-4 w-4 text-accent flex-shrink-0" />
              <span>300 AI Actions / Mo</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white/90">
              <Check className="h-4 w-4 text-accent flex-shrink-0" />
              <span>Cancel Anytime in 1-Click</span>
            </div>
          </div>

          {/* Live Claim Progress Bar */}
          <div className="w-full max-w-xl pt-2">
            <div className="flex justify-between items-center text-[11px] font-extrabold tracking-wider text-white/60 mb-2 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
                Claimed: {claimedCount} Athletes
              </span>
              <span className="text-accent">{percentClaimed}% Claimed</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10 p-0.5 border border-white/10 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-accent via-[#e4ff80] to-accent transition-all duration-500 rounded-full shadow-[0_0_16px_rgba(198,255,61,0.7)]"
                style={{ width: `${Math.max(5, percentClaimed)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Section: Digital VIP Ticket Card Mockup */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div
            className="relative overflow-hidden rounded-2xl p-5 border border-accent/40 flex flex-col justify-between gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            style={{
              background: "linear-gradient(145deg, rgba(28, 32, 44, 0.95) 0%, rgba(12, 14, 20, 0.98) 100%)",
            }}
          >
            {/* VIP Pass Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-accent" />
                <span className="text-xs font-black tracking-widest text-white uppercase">Pro VIP Pass</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-accent text-black">
                $0.00
              </span>
            </div>

            {/* Pass Body */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Valued at $42.00</p>
              <p className="text-xl font-black text-white tracking-tight">90 Days Full Access</p>
              <p className="text-[11px] text-white/60">Requires card verification via Stripe. No charges today.</p>
            </div>

            {/* Action CTA Button */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleClaim}
                disabled={isPending || remainingSlots <= 0}
                className="group relative w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-accent text-black font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(198,255,61,0.5)] hover:bg-[#b8f52b] hover:shadow-[0_0_35px_rgba(198,255,61,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 w-1/2 h-full bg-white/25 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

                {isPending ? (
                  <span>Verifying Stripe...</span>
                ) : (
                  <>
                    <span>Claim Free Trial</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/50 font-semibold">
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
