"use client";

import { useState } from "react";
import { BadgeCheck, DollarSign, Sparkles, HandHeart, ShoppingBag, Play } from "lucide-react";

export function CardFlip() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative w-full max-w-[340px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Floating overlays — hidden on mobile */}
      <div
        className="absolute -top-4 -left-10 z-20 hidden w-[200px] rounded-xl border border-white/[0.08] bg-zinc-900/95 p-3 shadow-xl backdrop-blur-md transition-all duration-500 sm:block"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(8px)",
          transitionDelay: "0ms",
        }}
      >
        <div className="mb-1.5 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-accent" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
            AI Bio &middot; Drafted
          </span>
        </div>
        <p className="text-[11px] leading-snug text-white/80">
          &ldquo;DI guard. Stanford. Game-changer on and off the court.&rdquo;
        </p>
        <p className="mt-1 text-[9px] text-white/30">3 of 5 free generations</p>
      </div>

      <div
        className="absolute -top-2 -right-8 z-20 hidden items-center gap-2 rounded-xl border border-accent/20 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-md transition-all duration-500 sm:flex"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(8px)",
          transitionDelay: "80ms",
        }}
      >
        <DollarSign className="h-4 w-4 text-accent" />
        <div>
          <p className="text-[11px] font-semibold text-accent">+$45 tipped</p>
          <p className="text-[9px] text-white/30">@brand_r &middot; just now</p>
        </div>
      </div>

      <div
        className="absolute bottom-16 -left-12 z-20 hidden w-[210px] rounded-xl border border-white/[0.08] bg-zinc-900/95 p-3 shadow-xl backdrop-blur-md transition-all duration-500 sm:block"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(8px)",
          transitionDelay: "160ms",
        }}
      >
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-accent">NEW DEAL</span>
        </div>
        <p className="text-[12px] font-semibold text-white">Gymshark &middot; $2,400</p>
      </div>

      {/* Main card */}
      <div
        className="relative z-10 overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-[0_0_60px_-12px_rgba(198,255,61,0.1)] transition-all duration-500"
        style={{
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 0 60px -12px rgba(198,255,61,0.2)"
            : "0 0 60px -12px rgba(198,255,61,0.1)",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
              NIL CARD
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2 py-0.5">
            <BadgeCheck className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-medium text-accent">Verified</span>
          </div>
        </div>

        {/* Avatar + Name */}
        <div className="px-5 pt-2 pb-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-accent/10 text-lg font-bold text-accent">
              MR
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white/40">Palo Alto, CA</p>
              <p className="text-[11px] text-white/30">Pac-12 All-Freshman</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
            <div className="flex-1 text-center">
              <p className="text-[15px] font-bold text-white">18.4</p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">PPG</p>
            </div>
            <div className="h-6 w-px bg-white/[0.06]" />
            <div className="flex-1 text-center">
              <p className="text-[15px] font-bold text-white">6.2</p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">APG</p>
            </div>
            <div className="h-6 w-px bg-white/[0.06]" />
            <div className="flex-1 text-center">
              <p className="text-[15px] font-bold text-accent">142K</p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">Reach</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 px-5 pb-3">
          <button className="flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2.5 text-left transition-colors hover:bg-accent/20">
            <HandHeart className="h-4 w-4 text-accent" />
            <div>
              <p className="text-[11px] font-medium text-white">Tip Maya</p>
              <p className="text-[9px] text-white/30">From $5</p>
            </div>
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.08]">
            <DollarSign className="h-4 w-4 text-white/60" />
            <div>
              <p className="text-[11px] font-medium text-white">Book me</p>
              <p className="text-[9px] text-white/30">Connect</p>
            </div>
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.08]">
            <ShoppingBag className="h-4 w-4 text-white/60" />
            <div>
              <p className="text-[11px] font-medium text-white">Sponsor</p>
              <p className="text-[9px] text-white/30">Brand deals</p>
            </div>
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.08]">
            <Play className="h-4 w-4 text-white/60" />
            <div>
              <p className="text-[11px] font-medium text-white">Merch</p>
              <p className="text-[9px] text-white/30">Store</p>
            </div>
          </button>
        </div>

        {/* Highlight reel */}
        <div className="mx-5 mb-5 overflow-hidden rounded-xl bg-white/[0.03] p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
              <Play className="h-3 w-3 text-accent" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-white">vs. Oregon &middot; 28pt night</p>
              <p className="text-[9px] text-white/30">14.2K plays &middot; 2d ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
