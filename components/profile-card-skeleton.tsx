"use client";

import { CARD_W, CARD_H } from "@/lib/constants";

export function ProfileCardSkeleton() {
  return (
    <div
      className="min-h-dvh w-full flex items-center justify-center p-4 bg-gradient-to-b from-neutral-950 via-neutral-950 to-black"
    >
      <div
        style={{
          perspective: "1200px",
          width: `min(${CARD_W}px, calc(100vw - 32px))`,
          aspectRatio: "360 / 540",
          maxHeight: "min(540px, calc(100dvh - 32px))",
        }}
      >
        <div
          className="relative w-full h-full rounded-[20px] overflow-hidden"
          style={{
            boxShadow: "0 20px 60px -15px rgba(0,0,0,0.6)",
          }}
        >
          {/* Glow border skeleton */}
          <div className="absolute inset-0 rounded-[20px] p-[1.5px] overflow-hidden">
            <div className="absolute inset-[-150%] bg-gradient-to-br from-white/[0.03] via-white/[0.01] to-white/[0.03] animate-spin-slow" />
          </div>

          {/* Card body */}
          <div className="absolute inset-0 bg-[#111115] rounded-[18.5px] overflow-hidden">
            {/* Top accent shimmer */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Photo area shimmer */}
            <div className="w-full relative overflow-hidden" style={{ aspectRatio: "16 / 11" }}>
              <div className="absolute inset-0 bg-[#16161a]">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
              </div>
              {/* Vignette */}
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 35%, transparent 40%, rgba(0,0,0,0.35) 100%)" }} />
              <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(to top, #111115, transparent)" }} />
            </div>

            {/* Identity area */}
            <div className="px-4 pt-6 relative z-10">
              {/* Header skeleton (Logo, QR, Share) */}
              <div className="flex items-center justify-between mb-4 w-full">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-[4px] bg-white/[0.05] animate-pulse" />
                  <div className="h-2.5 w-14 rounded bg-white/[0.04] animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-10 w-10 rounded-full bg-white/[0.05] animate-pulse" />
                  <div className="h-10 w-10 rounded-full bg-white/[0.05] animate-pulse" />
                </div>
              </div>
              {/* Name skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-6 w-32 rounded-md bg-white/[0.06] animate-pulse" />
                <div className="h-2 w-2 rounded-full bg-emerald-400/30 animate-pulse" />
              </div>

              {/* Sport/school skeleton */}
              <div className="flex items-center gap-2 mt-2">
                <div className="h-4 w-20 rounded-full bg-white/[0.04] animate-pulse" />
                <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse" />
              </div>

              {/* Stats row skeleton */}
              <div className="flex items-center gap-3 mt-2.5">
                <div className="h-3 w-16 rounded bg-white/[0.03] animate-pulse" />
                <div className="h-3 w-20 rounded bg-white/[0.03] animate-pulse" />
              </div>
            </div>

            {/* Stats row skeleton */}
            <div className="mx-4 mt-4 grid grid-cols-3 gap-px rounded-xl overflow-hidden bg-white/[0.04]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center py-3 px-1 bg-[#16161a]">
                  <div className="h-2 w-8 rounded bg-white/[0.04] mb-1.5 animate-pulse" />
                  <div className="h-5 w-10 rounded bg-white/[0.06] animate-pulse" />
                </div>
              ))}
            </div>



            {/* Bottom accent shimmer */}
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
