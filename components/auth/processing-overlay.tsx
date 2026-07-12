"use client";
import { Loader2 } from "lucide-react";

interface ProcessingOverlayProps {
  show: boolean;
  message?: string;
}

export function ProcessingOverlay({
  show,
  message = "Processing...",
}: ProcessingOverlayProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/85 backdrop-blur-md transition-all">
      <div className="flex flex-col items-center p-8 rounded-2xl bg-elev border border-white/[0.08] shadow-2xl">
        <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
        <h3 className="text-white font-semibold text-base mb-1">Please wait</h3>
        <p className="text-ink-muted text-xs text-center max-w-xs">{message}</p>
      </div>
    </div>
  );
}
