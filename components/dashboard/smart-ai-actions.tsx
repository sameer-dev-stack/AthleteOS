"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Sparkles, Loader2, Copy, Check, Send, Award, Users, Heart, Zap, type LucideIcon } from "lucide-react";
import { quickAiAction } from "@/lib/actions/quick-ai";

type Props = {
  themeAccent: string;
  context: "dashboard" | "analytics" | "nil";
  // Metrics to determine signals
  cardViews?: number;
  linkClicks?: number;
  nilScore?: number | null;
  tipsCount?: number;
  hasBio?: boolean;
};

export function SmartAiActions({
  themeAccent,
  context,
  cardViews = 0,
  linkClicks = 0,
  nilScore = null,
  tipsCount = 0,
  hasBio = true,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSignal, setActiveSignal] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number; remaining: number; plan: string } | null>(null);

  // Determine signals
  const signals: { id: string; label: string; description: string; icon: LucideIcon }[] = [];

  if (context === "analytics") {
    // If view count is non-zero, let's offer to maintain traction / boost engagement
    signals.push({
      id: "dropped_views",
      label: "Boost Profile Reach",
      description: "Generate a viral re-engagement post based on traffic flow",
      icon: Users,
    });
  }

  if (context === "nil") {
    signals.push({
      id: "score_up",
      label: "Pitch New Sponsor",
      description: "Write a high-converting brand pitch using your NIL score momentum",
      icon: Award,
    });
  }

  if (context === "dashboard") {
    if (tipsCount === 0) {
      signals.push({
        id: "low_tips",
        label: "Activate Fan Support",
        description: "Generate a personal story caption to invite tips/support",
        icon: Heart,
      });
    }
    if (!hasBio) {
      signals.push({
        id: "optimize_bio",
        label: "AI Bio Optimization",
        description: "Rewrite your bio under 280 characters with direct brand-readiness",
        icon: Sparkles,
      });
    }
  }

  // Baseline action
  signals.push({
    id: "quick_caption",
    label: "Quick Training Caption",
    description: "Write a behind-the-scenes update post in one click",
    icon: Send,
  });

  async function handleAction(signalId: string) {
    setLoading(true);
    setError(null);
    setOutput(null);
    setCopied(false);
    setActiveSignal(signalId);

    try {
      const res = await quickAiAction(signalId);
      if (res.ok && res.data) {
        setOutput(res.data);
        if (res.quota) setQuota(res.quota);
      } else {
        setError(res.error || "Generation failed.");
        if (res.quota) setQuota(res.quota);
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 animate-pulse" style={{ color: themeAccent }} />
          <h4 className="text-xs font-black uppercase tracking-wider text-white">
            Contextual AI Actions
          </h4>
        </div>
        {quota && (
          <span className="text-[10px] text-white/40">
            <span className="font-semibold text-white/60">{quota.remaining}</span> of {quota.limit} free actions left
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {signals.map((sig) => {
          const Icon = sig.icon;
          const isCurrent = activeSignal === sig.id;
          return (
            <button
              key={sig.id}
              onClick={() => handleAction(sig.id)}
              disabled={loading}
              className="group relative overflow-hidden rounded-xl border border-white/[0.04] bg-[#16161A]/40 p-4 text-left transition-all hover:bg-white/[0.02] hover:border-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Left highlight strip */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] transition-all group-hover:w-[4px]"
                style={{ backgroundColor: themeAccent }}
              />

              <div className="flex items-start gap-3 pl-1">
                <div
                  className="rounded-lg p-2 bg-white/[0.02] border border-white/[0.04] text-white/70 group-hover:text-white"
                  style={{ borderColor: isCurrent ? themeAccent : undefined }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-white uppercase tracking-wider group-hover:text-white transition-colors">
                    {sig.label}
                  </h5>
                  <p className="text-[10px] text-white/40 mt-1 leading-normal">
                    {sig.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Loading Overlay / Progress Panel */}
      {loading && (
        <div className="rounded-xl border border-white/[0.06] bg-[#16161A]/60 p-6 flex flex-col items-center justify-center text-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: themeAccent }} />
          <span className="text-xs font-bold text-white uppercase tracking-widest">
            AI Engine Thinking...
          </span>
          <span className="text-[10px] text-white/40">
            Synthesizing profile data, memory history, and performance signals
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 flex-shrink-0">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">{error}</p>
              {(error.includes("quota") || error.includes("limit") || error.includes("Upgrade")) && (
                <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[11px] text-white/60 mb-2">Unlock unlimited AI generations with Pro</p>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/dashboard/billing"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-bold text-bg transition-all hover:shadow-[0_0_16px_-4px_rgba(198,255,61,0.5)]"
                    >
                      Upgrade to Pro - $14/mo
                    </Link>
                    <span className="text-[10px] text-white/30">or Elite for teams</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generated Output Output Card */}
      {output && !loading && (
        <div className="rounded-xl border border-white/[0.06] bg-[#16161A] p-5 space-y-4 relative overflow-hidden shadow-2xl">
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-10 pointer-events-none"
            style={{ backgroundColor: themeAccent }}
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              AI Insight Generated
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white/70 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" style={{ color: themeAccent }} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Text
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-white leading-relaxed whitespace-pre-wrap bg-white/[0.01] p-3 rounded-lg border border-white/[0.03]">
            {output}
          </p>

          <p className="text-[9px] text-white/30 text-right leading-none">
            Saved to your AI Memory to refine future results.
          </p>
        </div>
      )}
    </div>
  );
}
