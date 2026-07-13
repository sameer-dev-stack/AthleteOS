"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Mail, Copy, Check, Bookmark } from "lucide-react";
import { generatePitchStream, recordToolEvent } from "@/lib/actions/ai";
import { type Profile } from "@/lib/actions/profile";
import { saveAssetToVault } from "@/lib/actions/ai-vault";
import { useStream } from "@/lib/hooks/use-stream";

type Props = {
  profile: Profile;
  onQuotaChange: (quota: { used: number; limit: number; remaining: number; plan: string }) => void;
  disabled: boolean;
};

function parsePitches(text: string): string[] {
  const parts = text.split(/PITCH \d+:\s*/i).filter(Boolean);
  if (parts.length >= 3) return parts.slice(0, 3).map((p) => p.trim());
  return text.split(/\n\n+/).filter(Boolean).map((p) => p.trim()).slice(0, 3);
}

export function AIPitchWriter({ profile, onQuotaChange, disabled }: Props) {
  const { text: streamedText, isStreaming, error: streamError, startStream, reset: resetStream } = useStream();
  const [pitches, setPitches] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [usedDraftIndex, setUsedDraftIndex] = useState<number | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [engagementRate, setEngagementRate] = useState("");
  const [goal, setGoal] = useState("");

  const hasGeneratedRef = useRef(false);
  const hasSavedOrCopiedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (hasGeneratedRef.current && !hasSavedOrCopiedRef.current) {
        recordToolEvent("pitch", "ignored").catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (streamError) queueMicrotask(() => setError(streamError));
  }, [streamError]);

  useEffect(() => {
    if (!isStreaming && streamedText) {
      const parsed = parsePitches(streamedText);
      queueMicrotask(() => setPitches(parsed));
      hasGeneratedRef.current = true;
    }
  }, [isStreaming, streamedText]);

  async function handleGenerate() {
    setError(null);
    setPitches([]);
    resetStream();

    await startStream(async () => {
      const result = await generatePitchStream({
        brandName,
        audienceSize,
        engagementRate,
        goal,
      });
      if (!result.ok) {
        setError(result.error || "Generation failed");
        return new ReadableStream<string>();
      }
      if (result.quota) onQuotaChange(result.quota);
      return result.data || new ReadableStream<string>();
    });
  }

  function handleCopy(text: string, index: number) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIndex(index);
    hasSavedOrCopiedRef.current = true;
    setTimeout(() => setCopiedIndex(null), 2000);
    recordToolEvent("pitch", "copied").catch(() => {});
  }

  function handleUseDraft(text: string, index: number) {
    navigator.clipboard.writeText(text).catch(() => {});
    setUsedDraftIndex(index);
    hasSavedOrCopiedRef.current = true;
    setTimeout(() => setUsedDraftIndex(null), 2000);
    recordToolEvent("pitch", "saved").catch(() => {});
  }

  async function handleSaveToVault(text: string, index: number) {
    const result = await saveAssetToVault("pitch", text);
    if (result.ok) {
      setSavedIndex(index);
      hasSavedOrCopiedRef.current = true;
      setTimeout(() => setSavedIndex(null), 2000);
      recordToolEvent("pitch", "saved").catch(() => {});
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
            Brand name
          </label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g., Nike, Gymshark"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
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
            Goal
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g., Sponsored content deal"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isStreaming || !brandName || !audienceSize || !goal || disabled}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        {isStreaming ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {isStreaming ? "Writing pitches..." : "Generate pitches"}
      </button>

      {isStreaming && streamedText && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="whitespace-pre-wrap text-sm text-white/60 leading-relaxed">
            {streamedText}
            <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse" />
          </p>
        </div>
      )}

      {!isStreaming && pitches.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink-muted">
            Generated pitches:
          </p>
          {pitches.map((pitch, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <p className="whitespace-pre-wrap text-sm text-white leading-relaxed">
                {pitch}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => handleUseDraft(pitch, i)}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  {usedDraftIndex === i ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Mail className="h-3 w-3" />
                  )}
                  {usedDraftIndex === i ? "Used!" : "Use this draft"}
                </button>
                <button
                  onClick={() => handleCopy(pitch, i)}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-ink-muted transition-all duration-200 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  {copiedIndex === i ? (
                    <Check className="h-3 w-3 text-accent" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedIndex === i ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => handleSaveToVault(pitch, i)}
                  className="flex items-center gap-1.5 rounded-lg border border-accent/30 px-3 py-1.5 text-xs font-medium text-accent transition-all duration-200 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  {savedIndex === i ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Bookmark className="h-3 w-3" />
                  )}
                  {savedIndex === i ? "Saved" : "Save to Vault"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
