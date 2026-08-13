"use client";

import { useState } from "react";
import Link from "next/link";
import { DollarSign, ShieldAlert, ArrowUpRight, Edit2, Check } from "lucide-react";
import { RateRange } from "@/lib/nil-score";

type Props = {
  rates: {
    post: RateRange;
    appearance: RateRange;
    campaign: RateRange;
  };
  plan: string;
  themeAccent: string;
  hasFollowerData?: boolean;
};

export function NilRateTable({ rates, plan, themeAccent, hasFollowerData = true }: Props) {
  const isFree = plan === "free";

  const [postTarget, setPostTarget] = useState(rates.post.target);
  const [appearanceTarget, setAppearanceTarget] = useState(rates.appearance.target);
  const [campaignTarget, setCampaignTarget] = useState(rates.campaign.target);
  const [editingRow, setEditingRow] = useState<"post" | "appearance" | "campaign" | null>(null);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4.5 w-4.5" style={{ color: themeAccent }} />
            <h3 className="text-sm font-bold text-white/90">Editable NIL Rate Card</h3>
          </div>
          {isFree && hasFollowerData ? (
            <span className="text-[10px] font-black uppercase tracking-wider bg-accent/10 text-accent border border-accent/25 px-2 py-0.5 rounded-md" style={{ color: themeAccent, borderColor: `${themeAccent}30`, backgroundColor: `${themeAccent}0a` }}>
              Free Tier
            </span>
          ) : (
            <span className="text-[10px] font-bold text-white/40 italic">
              Click rates to customize
            </span>
          )}
        </div>

        {!hasFollowerData ? (
          <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0C]/50 p-5 space-y-3">
            <p className="text-xs font-bold text-white/80">Pricing guidance unavailable</p>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Connect a social account to receive an estimated pricing calculation based on your audience reach and engagement.
            </p>
            <div className="pt-2 border-t border-white/[0.06] text-[10px] text-white/40 space-y-1">
              <p className="font-semibold text-white/60">Estimated pricing depends on:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Audience reach and engagement</li>
                <li>Deliverable scope and campaign duration</li>
                <li>Usage rights and exclusivity</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-white/[0.04] bg-[#0A0A0C]/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-wider">Deliverable</th>
                  <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-wider text-right">Floor</th>
                  <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-wider text-right">Target Rate</th>
                  <th className="p-3 text-[10px] font-bold text-white/40 uppercase tracking-wider text-right">Ceiling</th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Posts */}
                <tr className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors duration-200">
                  <td className="p-3 text-xs font-semibold text-white/80">Social Media Post</td>
                  <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.post.min}</td>
                  <td className="p-3 text-xs font-black text-right" style={{ color: themeAccent }}>
                    {editingRow === "post" ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-white">$</span>
                        <input
                          type="number"
                          value={postTarget}
                          onChange={(e) => setPostTarget(Number(e.target.value))}
                          className="w-14 rounded bg-white/10 px-1 py-0.5 text-right text-xs font-bold text-white focus:outline-none"
                        />
                        <button onClick={() => setEditingRow(null)} className="p-1 text-accent hover:text-white">
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingRow("post")}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        ${postTarget}
                        <Edit2 className="h-2.5 w-2.5 opacity-50" />
                      </button>
                    )}
                  </td>
                  <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.post.max}</td>
                </tr>

                {/* Row 2: Appearance */}
                <tr className={`border-b border-white/[0.04] hover:bg-white/[0.01] transition-all duration-300 ${isFree ? "filter blur-[3px] select-none pointer-events-none opacity-20" : ""}`}>
                  <td className="p-3 text-xs font-semibold text-white/80">In-Person Appearance</td>
                  <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.appearance.min}</td>
                  <td className="p-3 text-xs font-black text-right" style={{ color: themeAccent }}>
                    {editingRow === "appearance" ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-white">$</span>
                        <input
                          type="number"
                          value={appearanceTarget}
                          onChange={(e) => setAppearanceTarget(Number(e.target.value))}
                          className="w-14 rounded bg-white/10 px-1 py-0.5 text-right text-xs font-bold text-white focus:outline-none"
                        />
                        <button onClick={() => setEditingRow(null)} className="p-1 text-accent hover:text-white">
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingRow("appearance")}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        ${appearanceTarget}
                        <Edit2 className="h-2.5 w-2.5 opacity-50" />
                      </button>
                    )}
                  </td>
                  <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.appearance.max}</td>
                </tr>

                {/* Row 3: Campaign */}
                <tr className={`hover:bg-white/[0.01] transition-all duration-300 ${isFree ? "filter blur-[3px] select-none pointer-events-none opacity-20" : ""}`}>
                  <td className="p-3 text-xs font-semibold text-white/80">Monthly Campaign</td>
                  <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.campaign.min}</td>
                  <td className="p-3 text-xs font-black text-right" style={{ color: themeAccent }}>
                    {editingRow === "campaign" ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-white">$</span>
                        <input
                          type="number"
                          value={campaignTarget}
                          onChange={(e) => setCampaignTarget(Number(e.target.value))}
                          className="w-14 rounded bg-white/10 px-1 py-0.5 text-right text-xs font-bold text-white focus:outline-none"
                        />
                        <button onClick={() => setEditingRow(null)} className="p-1 text-accent hover:text-white">
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingRow("campaign")}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        ${campaignTarget}
                        <Edit2 className="h-2.5 w-2.5 opacity-50" />
                      </button>
                    )}
                  </td>
                  <td className="p-3 text-xs font-bold text-white/50 text-right">${rates.campaign.max}</td>
                </tr>
              </tbody>
            </table>

            {/* Upgrade Banner Overlay */}
            {isFree && (
              <div className="absolute inset-0 top-[41px] bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
                <ShieldAlert className="h-5 w-5 mb-1.5 text-accent" style={{ color: themeAccent }} />
                <p className="text-[11px] font-bold text-white">Pro Rate Breakdown Locked</p>
                <p className="text-[9px] text-white/50 mb-2">Upgrade to Pro to view Appearance & Campaign estimates.</p>
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
        )}
      </div>
      
      {hasFollowerData && (
        <p className="text-[10px] text-white/30 italic leading-snug mt-4">
          Rates calculated from standard CPM advertising benchmarks. Click any target rate to customize.
        </p>
      )}
    </div>
  );
}
