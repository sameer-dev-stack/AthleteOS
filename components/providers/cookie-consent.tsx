"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";

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
        className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d0d12] shadow-2xl"
        style={{ animation: "cookieSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Accent top line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C6FF3D]/80 to-transparent opacity-90" />

        <div className="p-5">
          <div className="flex items-start gap-3.5">
            {/* Icon */}
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-xl bg-[#C6FF3D]/[0.07] border border-[#C6FF3D]/[0.15] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-[#C6FF3D]" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-white/95 mb-1 tracking-tight">
                Privacy & Cookies
              </p>
              <p className="text-[11px] text-white/40 leading-relaxed">
                We use cookies and analytics to improve your experience. Your data is never sold to third parties.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={decline}
                className="h-8 px-3.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/50 text-[11px] font-semibold transition-all hover:border-white/[0.15] hover:text-white hover:bg-white/[0.05]"
              >
                Decline
              </button>
              <button
                onClick={accept}
                className="h-8 px-3.5 rounded-lg bg-[#C6FF3D] text-[#0A0A0B] text-[11px] font-bold transition-all hover:brightness-110 hover:shadow-[0_0_16px_-4px_rgba(198,255,61,0.35)]"
              >
                Accept
              </button>
              <button
                onClick={() => setDismissed(true)}
                aria-label="Dismiss"
                className="h-8 w-8 flex items-center justify-center rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.04] transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes cookieSlideUp {
            from { opacity: 0; transform: translateY(16px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
