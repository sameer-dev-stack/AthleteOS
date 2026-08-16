"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Gift, ShieldCheck, Share2 } from "lucide-react";
import Link from "next/link";
import { getReferralStats, type ReferralStats } from "@/lib/actions/referrals";
import { buildShareText } from "@/lib/referral-display";
import { getReferralMilestoneStatus } from "@/lib/referral-reward";

export function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getReferralStats().then(setStats);
  }, []);

  if (!stats || !stats.referralLink) return null;

  const milestone = getReferralMilestoneStatus(stats.completedReferrals);

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
          title: "Join me on NIL CARD",
          text: buildShareText(),
          url: stats!.referralLink,
        });
      } catch {}
    } else {
      handleCopy();
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5 flex flex-col justify-between transition-colors hover:border-white/[0.1]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Gift className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Refer & Unlock Pro</h3>
              <p className="text-xs text-white/40">5 Referrals = 1 Month Pro Free</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[9px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-full border border-accent/20">
            <ShieldCheck className="h-3 w-3" />
            Anti-Cheat
          </span>
        </div>

        {/* Milestone Progress Bar */}
        <div className="rounded-xl border border-white/[0.05] bg-[#0D0D11] p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50 font-medium">Your referrals:</span>
            <span className="font-bold text-white">
              <span className="text-accent">{stats.completedReferrals}</span> / 25
            </span>
          </div>

          <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${milestone.progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
            <span>5 referrals = 1 month</span>
            <span>15 referrals = 3 months + Gold</span>
            <span>25 referrals = 6 months</span>
          </div>
        </div>

        {/* Copy Link Input */}
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 mb-4">
          <span className="flex-1 truncate text-xs text-white/60 font-mono">
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
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
        <span className="text-xs text-white/50">
          <strong className="text-white">{stats.pendingReferrals}</strong> pending profile setup
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors"
          >
            <Share2 className="h-3 w-3" />
            Share
          </button>
          <Link
            href="/dashboard/referrals"
            className="text-xs font-semibold text-accent hover:underline"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
