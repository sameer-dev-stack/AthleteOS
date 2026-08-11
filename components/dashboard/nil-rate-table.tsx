"use client";

import Link from "next/link";
import { DollarSign, ShieldAlert, ArrowUpRight } from "lucide-react";
import { RateRange } from "@/lib/nil-score";

type Props = {
  rates: {
    post: RateRange;
    appearance: RateRange;
    campaign: RateRange;
  };
  plan: string;
  themeAccent: string;
};

export function NilRateTable({ rates, plan, themeAccent }: Props) {
  const isFree = plan === "free";

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4.5 w-4.5" style={{ color: themeAccent }} />
            <h3 className="text-sm font-bold text-white/90">Suggested NIL Rates</h3>
          </div>
          {isFree && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-accent/10 text-accent border border-accent/25 px-2 py-0.5 rounded-md" style={{ color: themeAccent, borderColor: `${themeAccent}30`, backgroundColor: `${themeAccent}0a` }}>
              Free Tier
            </span>
          )}
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-[#0A0A0C]/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-wider">Deliverable</th>
                <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-wider text-right">Floor</th>
                <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-wider text-right">Target</th>
                <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-wider text-right">Ceiling</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Posts (Visible to all) */}
              <tr className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors duration-200">
                <td className="p-3 text-xs font-semibold text-white/80">Social Media Post</td>
                <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.post.min}</td>
                <td className="p-3 text-xs font-black text-right" style={{ color: themeAccent }}>${rates.post.target}</td>
                <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.post.max}</td>
              </tr>

              {/* Row 2: Appearance (Gated to Pro+) */}
              <tr className={`border-b border-white/[0.04] hover:bg-white/[0.01] transition-all duration-300 ${isFree ? "filter blur-[3px] select-none pointer-events-none opacity-20" : ""}`}>
                <td className="p-3 text-xs font-semibold text-white/80">In-Person Appearance</td>
                <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.appearance.min}</td>
                <td className="p-3 text-xs font-black text-right" style={{ color: themeAccent }}>${rates.appearance.target}</td>
                <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.appearance.max}</td>
              </tr>

              {/* Row 3: Campaign (Gated to Pro+) */}
              <tr className={`hover:bg-white/[0.01] transition-all duration-300 ${isFree ? "filter blur-[3px] select-none pointer-events-none opacity-20" : ""}`}>
                <td className="p-3 text-xs font-semibold text-white/80">Monthly Campaign</td>
                <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.campaign.min}</td>
                <td className="p-3 text-xs font-black text-right" style={{ color: themeAccent }}>${rates.campaign.target}</td>
                <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.campaign.max}</td>
              </tr>
            </tbody>
          </table>

          {/* Upgrade Banner Overlay */}
          {isFree && (
            <div className="absolute inset-0 top-[41px] bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
              <ShieldAlert className="h-5 w-5 mb-1.5 text-accent" style={{ color: themeAccent }} />
              <p className="text-[11px] font-bold text-white">Pricing Tiers Locked</p>
              <p className="text-[9px] text-white/50 mb-2">Upgrade to Pro to view Appearance & Campaign suggested rates.</p>
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider rounded-lg px-2.5 py-1 bg-white text-black hover:bg-white/90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Upgrade to Pro
                <ArrowUpRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-[10px] text-white/30 italic leading-snug mt-4">
        Suggested rates are dynamically calculated guidelines. Actual market contracts vary based on specific deliverable scope.
      </p>
    </div>
  );
}
