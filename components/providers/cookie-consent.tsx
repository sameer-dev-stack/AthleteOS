"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";

const CONSENT_KEY = "athleteos_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
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

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-2xl rounded-2xl bg-[#111113] border border-white/[0.08] p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex-shrink-0 h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
            <Shield className="h-4.5 w-4.5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white mb-1">We value your privacy</p>
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              We use cookies and analytics (PostHog) to improve your experience and understand how our platform is used. Your data is never sold to third parties.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={accept}
                className="h-8 px-4 rounded-lg bg-accent text-[#0A0A0B] text-xs font-bold transition-all hover:brightness-110"
              >
                Accept
              </button>
              <button
                onClick={decline}
                className="h-8 px-4 rounded-lg border border-white/[0.08] text-white/50 text-xs font-bold transition-all hover:text-white hover:bg-white/[0.04]"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
