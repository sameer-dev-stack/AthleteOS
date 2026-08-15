"use client";

import { useState } from "react";
import { useMounted } from "@/lib/hooks/use-mounted";
import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const BANNER_KEY = "athleteos_whatsnew_aug13";

export function WhatsNewBanner() {
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(BANNER_KEY) === "dismissed",
  );
  const visible = mounted && !dismissed;

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(BANNER_KEY, "dismissed");
  }

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/[0.06] to-transparent p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 flex-shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">New: NIL Value Engine is live</p>
          <p className="mt-1 text-xs text-ink-muted leading-relaxed">
            Get an AI-powered estimate of your NIL value with editable rate cards, generate brand, sponsor, and media pitches in one place, and explore deal packages.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Link
              href="/changelog"
              className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-soft transition-colors"
            >
              See what&apos;s new
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              onClick={handleDismiss}
              className="text-[10px] text-ink-dim hover:text-ink-muted transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-ink-dim hover:text-ink-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
