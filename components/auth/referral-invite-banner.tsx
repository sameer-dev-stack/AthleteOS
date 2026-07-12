"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { buildInvitedBy } from "@/lib/referral-display";

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
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
      <Sparkles className="w-4 h-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
