"use client";

import { useState, useEffect } from "react";
import { Shield, X } from "lucide-react";

const CONSENT_KEY = "nilcard_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
    try {
      import("posthog-js").then((m) => m.default.opt_out_capturing());
    } catch { /* posthog not loaded */ }
  }

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 px-4 md:px-6">
      <div
        className="mx-auto max-w-xl rounded-xl bg-[#111113]/95 border border-white/[0.08] p-4 shadow-2xl backdrop-blur-md flex items-center gap-3"
        style={{ animation: "cookieSlideUp 0.4s ease-out" }}
      >
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Shield className="h-4 w-4 text-accent" />
        </div>
        <p className="flex-1 text-xs text-white/50 leading-relaxed">
          We use cookies and analytics to improve your experience. Your data is never sold to third parties.
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="h-7 px-3 rounded-lg border border-white/[0.08] text-white/40 text-[11px] font-semibold transition-all hover:text-white hover:bg-white/[0.04]"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="h-7 px-3 rounded-lg bg-accent text-[#0A0A0B] text-[11px] font-bold transition-all hover:brightness-110"
          >
            Accept
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-white/20 hover:text-white/60 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes cookieSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
