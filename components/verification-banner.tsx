"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";

function BannerInner() {
  const verified = useSearchParams().get("verified") === "1";
  const [show, setShow] = useState(verified);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 shadow-[0_0_32px_-8px_rgba(198,255,61,0.4)] backdrop-blur">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
          <Check className="h-4 w-4 text-accent" />
        </span>
        <p className="flex-1 text-sm font-medium text-ink">
          Your email has been successfully verified! Welcome to AthleteOS.
        </p>
        <button
          type="button"
          onClick={() => setShow(false)}
          aria-label="Dismiss"
          className="flex-shrink-0 rounded-md p-1 text-ink-dim transition-colors hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function VerificationBanner() {
  return (
    <Suspense fallback={null}>
      <BannerInner />
    </Suspense>
  );
}
