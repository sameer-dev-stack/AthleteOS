"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false); // default false (SSR/desktop-safe)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const dismissedAt = localStorage.getItem("install-banner-dismissed");
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < 7 * 24 * 60 * 60 * 1000) {
        queueMicrotask(() => setDismissed(true));
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const checkStandalone = () => {
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      ) {
        setShowBanner(false);
      }
    };

    checkStandalone();
    window
      .matchMedia("(display-mode: standalone)")
      .addEventListener("change", checkStandalone);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("install-banner-dismissed", String(Date.now()));
  }, []);

  if (dismissed || !showBanner) return null;
  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="container-wide mx-auto max-w-lg">
        <div className="relative flex items-center gap-3 rounded-2xl border border-line bg-bg-elev/95 p-4 shadow-[0_-8px_40px_-12px_rgba(198,255,61,0.15)] backdrop-blur-xl">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Download className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Install NIL CARD</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Add to your home screen for the full app experience
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleInstall}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-bg transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-2 text-ink-dim transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
