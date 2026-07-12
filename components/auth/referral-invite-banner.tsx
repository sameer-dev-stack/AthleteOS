"use client";
import { useEffect, useState } from "react";
import { buildInvitedBy } from "@/lib/referral-display";

// Reads the athleteos_ref cookie (set by middleware on /r/[code]) and shows
// "Invited by {Name}" on sign-up. Renders nothing when absent or unresolved.
export function ReferralInviteBanner() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)athleteos_ref=([^;]+)/);
    const code = m?.[1];
    if (!code) return;
    fetch(`/api/referral/referrer?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((d) => setText(buildInvitedBy(d.name)))
      .catch(() => setText(null));
  }, []);

  if (!text) return null;
  return (
    <div className="mb-6 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
        {text}
      </span>
    </div>
  );
}
