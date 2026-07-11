"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Users, ExternalLink, Share2 } from "lucide-react";
import { getReferralStats, type ReferralStats } from "@/lib/actions/referrals";

export function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getReferralStats().then(setStats);
  }, []);

  if (!stats || !stats.referralLink) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(stats!.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join AthleteOS",
          text: "Claim your free athlete card on AthleteOS",
          url: stats!.referralLink,
        });
      } catch {}
    } else {
      handleCopy();
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <Users className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Refer Athletes</h3>
          <p className="text-xs text-ink-dim">Invite other athletes to AthleteOS</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 mb-4">
        <span className="flex-1 truncate text-xs text-ink-muted font-mono">
          {stats.referralLink}
        </span>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="font-semibold text-white">{stats.totalReferrals}</span>
          athlete{stats.totalReferrals !== 1 ? "s" : ""} joined
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-ink-dim transition-colors hover:text-accent"
        >
          <Share2 className="h-3 w-3" />
          Share
        </button>
      </div>
    </div>
  );
}
