"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Share2, Users, Gift, Clock, TrendingUp, ExternalLink } from "lucide-react";
import { getOrCreateReferralCode, getReferralStats, type ReferralStats, type ReferralHistoryEntry } from "@/lib/actions/referrals";
import type { Profile } from "@/lib/actions/profile";

type Props = {
  profile: Profile;
  initialStats: ReferralStats;
  initialHistory: ReferralHistoryEntry[];
};

export function ReferralsPageClient({ profile, initialStats, initialHistory }: Props) {
  const [stats, setStats] = useState<ReferralStats>(initialStats);
  const [history, setHistory] = useState<ReferralHistoryEntry[]>(initialHistory);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(!initialStats.referralCode);

  useEffect(() => {
    if (!initialStats.referralCode) {
      getOrCreateReferralCode().then(({ code, link }) => {
        setStats((prev) => ({ ...prev, referralCode: code, referralLink: link }));
        setLoading(false);
        getReferralStats().then(setStats);
      });
    }
  }, [initialStats.referralCode]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(stats.referralLink);
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
          url: stats.referralLink,
        });
      } catch {}
    } else {
      handleCopy();
    }
  }

  const daysUntilExpiry = stats.extendedProUntil
    ? Math.max(0, Math.ceil((new Date(stats.extendedProUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Refer & Earn Pro</h1>
        <p className="text-sm text-ink-dim">
          Share your unique link. Earn 7 days of Pro for each athlete who joins.
        </p>
      </div>

      {/* Share Link */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Your Referral Link</h2>
        {loading ? (
          <div className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <span className="flex-1 truncate text-sm text-ink-muted font-mono">
              {stats.referralLink}
            </span>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleShare}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:bg-white/[0.10]"
            >
              <Share2 className="h-3 w-3" />
              Share
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users className="h-4 w-4 text-accent" />}
          label="Total Referrals"
          value={stats.totalReferrals}
        />
        <StatCard
          icon={<Check className="h-4 w-4 text-green-400" />}
          label="Completed"
          value={stats.completedReferrals}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-yellow-400" />}
          label="Pending"
          value={stats.pendingReferrals}
        />
        <StatCard
          icon={<Gift className="h-4 w-4 text-purple-400" />}
          label="Pro Days Earned"
          value={stats.proDaysEarned}
        />
      </div>

      {/* Pro Status */}
      {daysUntilExpiry > 0 && (
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Free Pro Active
              </p>
              <p className="text-xs text-ink-dim">
                Your referral rewards give you {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""} of Pro.{" "}
                {stats.extendedProUntil && (
                  <span className="text-ink-muted">
                    Expires {new Date(stats.extendedProUntil).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">How It Works</h2>
        <div className="space-y-4">
          <Step
            num={1}
            title="Share your link"
            desc="Copy your unique referral link and share it with other athletes."
          />
          <Step
            num={2}
            title="They sign up"
            desc="The athlete creates their account using your link."
          />
          <Step
            num={3}
            title="You earn Pro"
            desc="Get 7 days of Pro for each athlete who completes onboarding."
          />
        </div>
      </div>

      {/* Referral History */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Recent Referrals</h2>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-ink-dim mx-auto mb-3" />
            <p className="text-sm text-ink-dim">No referrals yet. Share your link to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-semibold text-ink-muted">
                    {entry.referred_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{entry.referred_name}</p>
                    <p className="text-xs text-ink-dim">
                      {entry.referred_sport || "Athlete"} · {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={entry.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-ink-dim">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent flex-shrink-0 mt-0.5">
        {num}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-ink-dim">{desc}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    completed: "bg-green-400/10 text-green-400",
    rewarded: "bg-accent/10 text-accent",
    pending: "bg-yellow-400/10 text-yellow-400",
  };
  const labels = {
    completed: "Completed",
    rewarded: "Rewarded",
    pending: "Pending",
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${styles[status as keyof typeof styles] || "bg-white/[0.06] text-ink-muted"}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}
