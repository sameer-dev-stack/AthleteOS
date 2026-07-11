"use client";

import { ArrowRight } from "lucide-react";
import { Magnetic } from "./motion/magnetic";
import { useAbTest } from "@/lib/hooks/use-ab-test";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";

export function HeroCta() {
  const { heroText } = useAbTest();

  return (
    <div className="mt-9 flex flex-wrap items-center gap-3">
      <Magnetic strength={0.25}>
        <a
          href="#waitlist"
          className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-bg transition-all duration-300 hover:bg-accent-soft hover:-translate-y-0.5 active:translate-y-0"
          onClick={() => trackFunnel("cta_click", { variant: "hero_primary", destination: "#waitlist" })}
        >
          {/* Glow ring */}
          <span className="pointer-events-none absolute -inset-1 rounded-full bg-accent/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
          <span className="pointer-events-none absolute -inset-px rounded-full ring-1 ring-accent/30 transition-all duration-300 group-hover:ring-accent/50 group-hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)]" />
          <span className="relative z-10">{heroText}</span>
          <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </a>
      </Magnetic>
      <Magnetic strength={0.2}>
        <a href="#how" className="btn-ghost group">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-accent group-hover:text-bg">
            <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </span>
          See how it works
        </a>
      </Magnetic>
    </div>
  );
}
