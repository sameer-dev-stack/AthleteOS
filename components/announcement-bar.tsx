"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

const DISMISS_KEY = "athleteos_announcement_dismissed";

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    if (wasDismissed === "true") setDismissed(true);
  }, []);

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  }

  if (dismissed) return null;

  return (
    <div className="relative z-50 border-b border-white/[0.06] bg-bg/80 backdrop-blur-xl">
      <div className="container-wide flex h-10 items-center justify-center gap-2 text-xs">
        <span className="hidden h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(198,255,61,0.8)] sm:inline-block animate-pulse-soft" />
        <span className="text-ink-muted">
          <span className="font-semibold text-ink">Private beta open.</span>{" "}
          <span className="hidden sm:inline">First 500 athletes get 3 months of Pro free. </span>
        </span>
        <Link
          href="#waitlist"
          className="group inline-flex items-center gap-1 font-semibold text-accent hover:text-accent-soft"
        >
          Join waitlist
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full text-ink-dim hover:text-ink hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
