"use client";

import { Sparkles, HelpCircle, TrendingUp, CheckCircle2, Target } from "lucide-react";
import type { NilBreakdown } from "@/lib/actions/athlete-knowledge";

type Props = {
  breakdown?: NilBreakdown | null;
  quotaUsed: number;
  quotaLimit: number;
  plan: string;
  themeAccent: string;
  loading: boolean;
};

export function NilAiBreakdown({
  breakdown,
  quotaUsed,
  quotaLimit,
  plan,
  themeAccent,
  loading,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: themeAccent }} />
            <h3 className="text-sm font-bold text-white/90">AI Market Breakdown</h3>
            {breakdown?.isPersonalized && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${themeAccent}18`, color: themeAccent }}
              >
                Personalized
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-white/40">
            <span>Quota: {quotaUsed}/{quotaLimit}</span>
            <HelpCircle className="h-3 w-3" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-white/5 rounded w-3/4" />
            <div className="h-4 bg-white/5 rounded w-5/6" />
            <div className="h-4 bg-white/5 rounded w-2/3" />
            <div className="h-10" />
            <div className="h-4 bg-white/5 rounded w-1/2" />
            <div className="h-4 bg-white/5 rounded w-5/6" />
          </div>
        ) : breakdown && breakdown.isPersonalized ? (
          <div className="space-y-4">
            {/* Section 1: Market Position */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" style={{ color: themeAccent }} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Your Market Position
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                {breakdown.marketPosition}
              </p>
            </div>

            {/* Section 2: What's Working */}
            {breakdown.whatsWorking.length > 0 && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: themeAccent }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    What&apos;s Working
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {breakdown.whatsWorking.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: themeAccent }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 3: This Week's Focus */}
            {breakdown.thisWeeksFocus.length > 0 && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-3.5 w-3.5 flex-shrink-0" style={{ color: themeAccent }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Action Plan
                  </span>
                </div>
                <ol className="space-y-2">
                  {breakdown.thisWeeksFocus.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-white/70">
                      <span
                        className="flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-black"
                        style={{ backgroundColor: `${themeAccent}20`, color: themeAccent }}
                      >
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          // Empty state when no personalized data exists
          <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0C]/50 p-6 text-center space-y-2 my-2">
            <Sparkles className="h-6 w-6 mx-auto text-white/20" />
            <h4 className="text-xs font-bold text-white/80">Market insights are not available yet</h4>
            <p className="text-[11px] text-white/40 leading-relaxed max-w-[240px] mx-auto">
              Connect a social account and complete your athlete profile to generate data-based insights.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-[10px] text-white/30 uppercase tracking-widest font-black">
          Powered by MiMo API
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider bg-white/[0.03] border border-white/[0.08] px-2 py-0.5 rounded text-white/60">
          {plan} Account
        </span>
      </div>
    </div>
  );
}
