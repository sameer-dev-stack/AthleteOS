"use client";

import Link from "next/link";
import { Sparkles, ArrowUpRight, CheckCircle2, DollarSign, MessageSquare, ShieldCheck } from "lucide-react";

type Props = {
  themeAccent?: string;
};

export function NilProPreviewCard({ themeAccent = "#C6FF3D" }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-b from-[#16161C] to-[#0D0D11] p-8 space-y-8 shadow-2xl">
      {/* Glow background effect */}
      <div
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ backgroundColor: themeAccent }}
      />

      {/* Header Badge & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-xs font-black text-accent uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            AthleteOS Pro Exclusive
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mt-2">
            NIL Valuation & Brand Pitch Suite
          </h2>
          <p className="text-xs text-white/50 max-w-xl leading-relaxed">
            Unlock your personalized data-backed rate card, custom rate editor, and 3-in-1 sponsor pitch generator to start pitching brands with confidence.
          </p>
        </div>

        <Link
          href="/dashboard/billing"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(198,255,61,0.5)] self-start sm:self-auto"
        >
          <span>Upgrade to Pro</span>
          <ArrowUpRight className="h-4 w-4 stroke-[3]" />
        </Link>
      </div>

      {/* Feature Grid Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feature 1 */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${themeAccent}18`, color: themeAccent }}
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Data-Backed NIL Score</h3>
          <p className="text-xs text-white/50 leading-relaxed">
            Transparent 0–100 valuation rating calculated from audience reach, sport category, and school context.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${themeAccent}18`, color: themeAccent }}
          >
            <DollarSign className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Editable Rate Card</h3>
          <p className="text-xs text-white/50 leading-relaxed">
            CPM-calculated target rates for posts, reels, and appearances. Customize and save your custom rate card.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${themeAccent}18`, color: themeAccent }}
          >
            <MessageSquare className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">3-in-1 Pitch Proposal Generator</h3>
          <p className="text-xs text-white/50 leading-relaxed">
            Generate ready-to-copy DMs, formal email proposals, and 48-hour follow-up messages for local businesses.
          </p>
        </div>
      </div>

      {/* Checklist Footer */}
      <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-white/70">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            100% Pro Benefit
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Cancel Anytime
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Instant Access
          </span>
        </div>

        <Link
          href="/dashboard/billing"
          className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1"
        >
          View Pro Billing Options &rarr;
        </Link>
      </div>
    </div>
  );
}
