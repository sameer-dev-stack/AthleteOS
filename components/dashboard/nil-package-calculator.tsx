"use client";

import { useState, useMemo } from "react";
import { Calculator, Copy, Check, Sparkles, Plus, Minus, ShieldCheck, DollarSign, Layers } from "lucide-react";
import { type RateRange } from "@/lib/nil-score";

type Props = {
  rates: {
    post: RateRange;
    appearance: RateRange;
    campaign: RateRange;
  };
  themeAccent?: string;
};

export function NilPackageCalculator({ rates, themeAccent = "#C6FF3D" }: Props) {
  // Quantities for custom deal deliverables
  const [postsCount, setPostsCount] = useState(1);
  const [reelsCount, setReelsCount] = useState(1);
  const [appearanceHours, setAppearanceHours] = useState(0);
  const [usageMonths, setUsageMonths] = useState<0 | 1 | 3 | 6 | 12>(0);
  const [isExclusive, setIsExclusive] = useState(false);
  const [copied, setCopied] = useState(false);

  // Unit rates derived from athlete's NIL valuation score engine
  const unitPostTarget = rates?.post?.target || 150;
  const unitPostMin = rates?.post?.min || 100;
  const unitPostMax = rates?.post?.max || 250;

  const unitReelTarget = Math.round(unitPostTarget * 0.75);
  const unitReelMin = Math.round(unitPostMin * 0.75);
  const unitReelMax = Math.round(unitPostMax * 0.75);

  const unitHourTarget = rates?.appearance?.target || 200;
  const unitHourMin = rates?.appearance?.min || 150;
  const unitHourMax = rates?.appearance?.max || 350;

  // Calculation logic
  const calculation = useMemo(() => {
    const rawTarget =
      postsCount * unitPostTarget +
      reelsCount * unitReelTarget +
      appearanceHours * unitHourTarget;

    const rawMin =
      postsCount * unitPostMin +
      reelsCount * unitReelMin +
      appearanceHours * unitHourMin;

    const rawMax =
      postsCount * unitPostMax +
      reelsCount * unitReelMax +
      appearanceHours * unitHourMax;

    // Usage rights multiplier (+0% for none, +20% for 1mo, +40% for 3mo, +70% for 6mo, +120% for 12mo)
    const usageMultipliers: Record<number, number> = {
      0: 1.0,
      1: 1.2,
      3: 1.4,
      6: 1.7,
      12: 2.2,
    };
    const usageMult = usageMultipliers[usageMonths] || 1.0;

    // Category exclusivity (+30% multiplier)
    const exclusivityMult = isExclusive ? 1.3 : 1.0;

    const combinedMult = usageMult * exclusivityMult;

    const targetTotal = Math.round(rawTarget * combinedMult);
    const minTotal = Math.round(rawMin * combinedMult);
    const maxTotal = Math.round(rawMax * combinedMult);

    return {
      targetTotal,
      minTotal,
      maxTotal,
      rawTarget,
      usageAddOn: Math.round(rawTarget * (usageMult - 1.0)),
      exclusivityAddOn: Math.round(rawTarget * usageMult * (exclusivityMult - 1.0)),
    };
  }, [
    postsCount,
    reelsCount,
    appearanceHours,
    usageMonths,
    isExclusive,
    unitPostTarget,
    unitPostMin,
    unitPostMax,
    unitReelTarget,
    unitReelMin,
    unitReelMax,
    unitHourTarget,
    unitHourMin,
    unitHourMax,
  ]);

  // Generate copyable deal pitch breakdown string
  const generatePitchText = () => {
    const deliverables: string[] = [];
    if (postsCount > 0) deliverables.push(`${postsCount}x Feed Post${postsCount > 1 ? "s" : ""}`);
    if (reelsCount > 0) deliverables.push(`${reelsCount}x Reel / Short Video${reelsCount > 1 ? "s" : ""}`);
    if (appearanceHours > 0) deliverables.push(`${appearanceHours}hr In-Person Appearance${appearanceHours > 1 ? "s" : ""}`);
    if (usageMonths > 0) deliverables.push(`${usageMonths}-Month Content Licensing Rights`);
    if (isExclusive) deliverables.push("Category Exclusivity");

    const packageSummary = deliverables.length > 0 ? deliverables.join(" + ") : "Custom Deal Package";

    return `NIL Package Offer Proposal:
Deliverables: ${packageSummary}
Estimated Market Value Range: $${calculation.minTotal.toLocaleString()} – $${calculation.maxTotal.toLocaleString()}
Recommended Target: $${calculation.targetTotal.toLocaleString()}`;
  };

  const handleCopyPitch = () => {
    const text = generatePitchText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const totalDeliverablesCount = postsCount + reelsCount + (appearanceHours > 0 ? 1 : 0);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111113] p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${themeAccent}18`, color: themeAccent }}
            >
              <Calculator className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-white">Custom Deal Package Builder</h3>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
              LIVE ENGINE
            </span>
          </div>
          <p className="mt-1 text-xs text-white/50">
            Combine social posts, appearances, and licensing rights to calculate exact package valuations for brand sponsors.
          </p>
        </div>

        <button
          onClick={handleCopyPitch}
          className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-xs font-bold text-white hover:bg-white/[0.12] transition-all self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-accent" />
              <span className="text-accent">Copied Proposal!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-white/70" />
              <span>Copy Proposal Text</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Deliverable Controls */}
        <div className="lg:col-span-7 space-y-4">
          <span className="text-xs font-black uppercase tracking-wider text-white/60 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-accent" />
            Select Deliverables & Terms
          </span>

          {/* 1. Feed Posts */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div>
              <p className="text-xs font-bold text-white">Feed Posts (Instagram / TikTok)</p>
              <p className="text-[11px] text-white/40 mt-0.5">
                ${unitPostTarget} / post (min ${unitPostMin} – max ${unitPostMax})
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setPostsCount((c) => Math.max(0, c - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-sm font-bold text-white">{postsCount}</span>
              <button
                type="button"
                onClick={() => setPostsCount((c) => Math.min(10, c + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 2. Reels & Short Videos */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div>
              <p className="text-xs font-bold text-white">Reels / Short Video Stories</p>
              <p className="text-[11px] text-white/40 mt-0.5">
                ${unitReelTarget} / video (min ${unitReelMin} – max ${unitReelMax})
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setReelsCount((c) => Math.max(0, c - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-sm font-bold text-white">{reelsCount}</span>
              <button
                type="button"
                onClick={() => setReelsCount((c) => Math.min(10, c + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 3. In-Person Appearances */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div>
              <p className="text-xs font-bold text-white">In-Person Event Appearance (Hours)</p>
              <p className="text-[11px] text-white/40 mt-0.5">
                ${unitHourTarget} / hour (min ${unitHourMin} – max ${unitHourMax})
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setAppearanceHours((h) => Math.max(0, h - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-sm font-bold text-white">{appearanceHours}h</span>
              <button
                type="button"
                onClick={() => setAppearanceHours((h) => Math.min(12, h + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* 4. Content Licensing Term */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white">Content Licensing Duration</p>
              <span className="text-[10px] font-bold text-accent">
                {usageMonths === 0 ? "Organic Only (No Paid Ads)" : `+${usageMonths === 1 ? "20%" : usageMonths === 3 ? "40%" : usageMonths === 6 ? "70%" : "120%"} Licensing Fee`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {([0, 1, 3, 6, 12] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setUsageMonths(m)}
                  className={`rounded-lg py-1.5 text-[11px] font-bold border transition-all ${
                    usageMonths === m
                      ? "border-accent bg-accent/15 text-accent shadow-sm"
                      : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white"
                  }`}
                >
                  {m === 0 ? "Organic" : `${m} mo`}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Exclusivity Toggle */}
          <button
            type="button"
            onClick={() => setIsExclusive((prev) => !prev)}
            className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
              isExclusive
                ? "border-accent/40 bg-accent/10 text-white"
                : "border-white/[0.06] bg-white/[0.02] text-white/60 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className={`h-4 w-4 ${isExclusive ? "text-accent" : "text-white/40"}`} />
              <div>
                <p className="text-xs font-bold">Category Competitor Exclusivity</p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  Prevents signing with rival brands in your product sector.
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isExclusive ? "bg-accent text-black font-black" : "bg-white/10 text-white/40"}`}>
              {isExclusive ? "+30% APPLIED" : "OFF"}
            </span>
          </button>
        </div>

        {/* Right Column: Estimated Package Output */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-accent/20 bg-accent/[0.03] p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Package Estimated Value
              </span>
              <span className="text-[10px] font-semibold text-white/40">
                {totalDeliverablesCount} deliverable{totalDeliverablesCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Target Big Price Display */}
            <div className="mt-4 text-center rounded-xl bg-black/40 border border-accent/20 p-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Suggested Package Price
              </span>
              <div className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black tracking-tight text-accent">
                  ${calculation.targetTotal.toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-[11px] font-medium text-white/50">
                Estimated Range: <strong style={{ color: "#ffffff" }}>${calculation.minTotal.toLocaleString()}</strong> – <strong style={{ color: "#ffffff" }}>${calculation.maxTotal.toLocaleString()}</strong>
              </p>
            </div>

            {/* Price Breakdown Stack */}
            <div className="mt-4 space-y-2 text-xs divide-y divide-white/[0.06]">
              {postsCount > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-white/70">{postsCount}x Feed Posts</span>
                  <span className="font-bold text-white">${(postsCount * unitPostTarget).toLocaleString()}</span>
                </div>
              )}

              {reelsCount > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-white/70">{reelsCount}x Video Reels</span>
                  <span className="font-bold text-white">${(reelsCount * unitReelTarget).toLocaleString()}</span>
                </div>
              )}

              {appearanceHours > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-white/70">{appearanceHours}hr Appearance</span>
                  <span className="font-bold text-white">${(appearanceHours * unitHourTarget).toLocaleString()}</span>
                </div>
              )}

              {usageMonths > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-white/70">{usageMonths}-Month Licensing Fee</span>
                  <span className="font-bold text-accent">+${calculation.usageAddOn.toLocaleString()}</span>
                </div>
              )}

              {isExclusive && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-white/70">Category Exclusivity Fee</span>
                  <span className="font-bold text-accent">+${calculation.exclusivityAddOn.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.08]">
            <button
              onClick={handleCopyPitch}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs font-black uppercase tracking-wider text-black transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] hover:scale-[1.01]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Proposal Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 stroke-[3]" />
                  <span>Copy Sponsor Pitch Proposal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
