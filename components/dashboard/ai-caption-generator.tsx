"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, Copy, Check, Bookmark } from "lucide-react";
import { generateCaptionsStream, recordToolEvent } from "@/lib/actions/ai";
import { type Profile } from "@/lib/actions/profile";
import { saveAssetToVault } from "@/lib/actions/ai-vault";
import { useStream } from "@/lib/hooks/use-stream";

type Props = {
  profile: Profile;
  onQuotaChange: (quota: { used: number; limit: number; remaining: number; plan: string }) => void;
  disabled: boolean;
};

const CONTEXTS = [
  { value: "win", label: "Game Win" },
  { value: "sponsorship", label: "Sponsorship" },
  { value: "training", label: "Training" },
  { value: "milestone", label: "Milestone" },
  { value: "personal", label: "Personal" },
] as const;

const TONES = [
  { value: "confident", label: "Confident" },
  { value: "humble", label: "Humble" },
  { value: "energetic", label: "Energetic" },
  { value: "storyteller", label: "Storyteller" },
] as const;

function parseCaptions(text: string): string[] {
  const parts = text.split(/CAPTION \d+:\s*/i).filter(Boolean);
  if (parts.length >= 3) return parts.slice(0, 3).map((p) => p.trim());
  return text.split(/\n\n+/).filter(Boolean).map((p) => p.trim()).slice(0, 3);
}

export function AICaptionGenerator({ profile, onQuotaChange, disabled }: Props) {
  const { text: streamedText, isStreaming, error: streamError, startStream, reset: resetStream } = useStream();
  const [captions, setCaptions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [usedDraftIndex, setUsedDraftIndex] = useState<number | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [context, setContext] = useState<string>("win");
  const [tone, setTone] = useState<string>("energetic");

  const hasGeneratedRef = useRef(false);
  const hasSavedOrCopiedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (hasGeneratedRef.current && !hasSavedOrCopiedRef.current) {
        recordToolEvent("captions", "ignored").catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (streamError) queueMicrotask(() => setError(streamError));
  }, [streamError]);

  useEffect(() => {
    if (!isStreaming && streamedText) {
      const parsed = parseCaptions(streamedText);
      queueMicrotask(() => setCaptions(parsed));
      hasGeneratedRef.current = true;
    }
  }, [isStreaming, streamedText]);

  async function handleGenerate() {
    setError(null);
    setCaptions([]);
    resetStream();

    await startStream(async () => {
      const result = await generateCaptionsStream({ context, tone });
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
    recordToolEvent("captions", "copied").catch(() => {});
  }

  function handleUseDraft(text: string, index: number) {
    navigator.clipboard.writeText(text).catch(() => {});
    setUsedDraftIndex(index);
    hasSavedOrCopiedRef.current = true;
    setTimeout(() => setUsedDraftIndex(null), 2000);
    recordToolEvent("captions", "saved").catch(() => {});
  }

  async function handleSaveToVault(text: string, index: number) {
    const result = await saveAssetToVault("captions", text);
    if (result.ok) {
      setSavedIndex(index);
      hasSavedOrCopiedRef.current = true;
      setTimeout(() => setSavedIndex(null), 2000);
      recordToolEvent("captions", "saved").catch(() => {});
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
            Post context
          </label>
          <select
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            {CONTEXTS.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#111113]">
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value} className="bg-[#111113]">
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isStreaming || disabled}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        {isStreaming ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isStreaming ? "Writing captions..." : "Generate captions"}
      </button>

      {isStreaming && streamedText && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="whitespace-pre-wrap text-sm text-white/60 leading-relaxed">
            {streamedText}
            <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse" />
          </p>
        </div>
      )}

      {!isStreaming && captions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink-muted">
            Generated captions:
          </p>
          {captions.map((caption, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <p className="whitespace-pre-wrap text-sm text-white leading-relaxed">
                {caption}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => handleUseDraft(caption, i)}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  {usedDraftIndex === i ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {usedDraftIndex === i ? "Used!" : "Use this draft"}
                </button>
                <button
                  onClick={() => handleCopy(caption, i)}
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
                  onClick={() => handleSaveToVault(caption, i)}
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
