"use client";
import { Loader2 } from "lucide-react";

// Shown during the signup submit transition so the user gets an unambiguous
// "we're working on it" state before the verify-email page renders.
export function ProcessingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg">
      <Loader2 className="h-10 w-10 animate-spin text-accent" />
      <p className="mt-4 text-sm text-ink-muted">Processing…</p>
    </div>
  );
}
