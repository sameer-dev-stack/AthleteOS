"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, DollarSign, Copy, Check, Bookmark } from "lucide-react";
import { generateRateGuidanceAction } from "@/lib/actions/ai";
import { type Profile } from "@/lib/actions/profile";
import { saveAssetToVault } from "@/lib/actions/ai-vault";

type Props = {
  profile: Profile;
  onQuotaChange: (quota: { used: number; limit: number; remaining: number; plan: string }) => void;
  disabled: boolean;
};

export function AIRateHelper({ profile, onQuotaChange, disabled }: Props) {
  const [generating, setGenerating] = useState(false);
  const [guidance, setGuidance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [audienceSize, setAudienceSize] = useState("");
  const [engagementRate, setEngagementRate] = useState("");
  const [niche, setNiche] = useState("");
  const [pastDeals, setPastDeals] = useState("");

  useEffect(() => {
    return () => {};
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setGuidance(null);
    setCopied(false);

    const result = await generateRateGuidanceAction({
      sport: profile.sport || "",
      school: profile.school || "",
      position: profile.position || "",
      audienceSize,
      engagementRate,
      niche,
      pastDeals,
    });

    setGenerating(false);

    if (result.ok && result.data) {
      setGuidance(result.data);
      if (result.quota) onQuotaChange(result.quota);
    } else {
      setError(result.error || "Generation failed");
    }
  }

  function handleCopy() {
    if (!guidance) return;
    navigator.clipboard.writeText(guidance).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveToVault() {
    if (!guidance) return;
    const result = await saveAssetToVault("rate", guidance);
    if (result.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Audience size
          </label>
          <input
            type="text"
            value={audienceSize}
            onChange={(e) => setAudienceSize(e.target.value)}
            placeholder="e.g., 15,000 followers"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Engagement rate
          </label>
          <input
            type="text"
            value={engagementRate}
            onChange={(e) => setEngagementRate(e.target.value)}
            placeholder="e.g., 4.2%"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Niche / focus area
          </label>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g., Fitness, lifestyle"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Past deals (if any)
          </label>
          <input
            type="text"
            value={pastDeals}
            onChange={(e) => setPastDeals(e.target.value)}
            placeholder="e.g., Local gym sponsorship"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating || !audienceSize || !engagementRate || disabled}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <DollarSign className="h-4 w-4" />
        )}
        {generating ? "Calculating..." : "Get pricing guidance"}
      </button>

      {guidance && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-muted">
              Pricing guidance
            </p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-ink-muted transition-all duration-200 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {copied ? (
                <Check className="h-3 w-3 text-accent" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleSaveToVault}
              className="flex items-center gap-1.5 rounded-lg border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent transition-all duration-200 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {saved ? (
                <Check className="h-3 w-3" />
              ) : (
                <Bookmark className="h-3 w-3" />
              )}
              {saved ? "Saved" : "Save to Vault"}
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm text-ink-muted leading-relaxed">
            {guidance}
          </div>
        </div>
      )}
    </div>
  );
}
