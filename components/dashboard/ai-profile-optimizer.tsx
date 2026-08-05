"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Zap, Check, ArrowRight, Bookmark } from "lucide-react";
import { optimizeProfileAction } from "@/lib/actions/ai";
import { updateProfile, type Profile } from "@/lib/actions/profile";
import { saveAssetToVault } from "@/lib/actions/ai-vault";

type Props = {
  profile: Profile;
  onQuotaChange: (quota: { used: number; limit: number; remaining: number; plan: string }) => void;
  disabled: boolean;
};

type OptimizationResult = {
  critique: string;
  optimizedBio: string;
  suggestions: string[];
};

export function AIProfileOptimizer({ profile, onQuotaChange, disabled }: Props) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {};
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setResult(null);
    setApplied(false);

    const res = await optimizeProfileAction();

    setGenerating(false);

    if (res.ok && res.data) {
      setResult(res.data);
      if (res.quota) onQuotaChange(res.quota);
    } else {
      setError(res.error || "Generation failed");
    }
  }

  async function handleApplyBio() {
    if (!result) return;
    setApplying(true);
    const res = await updateProfile({ bio: result.optimizedBio });
    setApplying(false);

    if (res.ok) {
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  }

  async function handleSaveToVault() {
    if (!result) return;
    const content = `Critique: ${result.critique}\n\nOptimized Bio: ${result.optimizedBio}\n\nSuggestions:\n${result.suggestions.map((s) => `- ${s}`).join("\n")}`;
    const res = await saveAssetToVault("optimize", content);
    if (res.ok) {
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

      <p className="text-sm text-ink-muted">
        AI scans your current profile and suggests improvements to make it more
        brand-ready.
      </p>

      <button
        onClick={handleGenerate}
        disabled={generating || disabled}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {generating ? "Analyzing profile..." : "Optimize my profile"}
      </button>

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-dim">
              Critique
            </p>
            <p className="text-sm text-white leading-relaxed">
              {result.critique}
            </p>
          </div>

          <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-dim">
                Optimized bio
              </p>
              <span className="text-[10px] text-ink-dim">
                {result.optimizedBio.length}/280
              </span>
            </div>
            <p className="text-sm text-white leading-relaxed">
              {result.optimizedBio}
            </p>
            <button
              onClick={handleApplyBio}
              disabled={applying}
              className="mt-3 flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {applying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : applied ? (
                <Check className="h-3 w-3" />
              ) : (
                <ArrowRight className="h-3 w-3" />
              )}
              {applied ? "Applied!" : "Apply optimized bio"}
            </button>
            <button
              onClick={handleSaveToVault}
              className="mt-3 ml-2 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent transition-all duration-200 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {saved ? (
                <Check className="h-3 w-3" />
              ) : (
                <Bookmark className="h-3 w-3" />
              )}
              {saved ? "Saved" : "Save to Vault"}
            </button>
          </div>

          {result.suggestions.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-dim">
                Suggestions
              </p>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-ink-muted"
                  >
                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
