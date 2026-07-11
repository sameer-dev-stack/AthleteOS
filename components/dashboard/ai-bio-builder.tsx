"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, Copy, Check, ArrowRight, Bookmark } from "lucide-react";
import { generateBiosStream, recordToolEvent } from "@/lib/actions/ai";
import { updateProfile, type Profile } from "@/lib/actions/profile";
import { saveAssetToVault } from "@/lib/actions/ai-vault";
import { useStream } from "@/lib/hooks/use-stream";

type Props = {
  profile: Profile;
  onQuotaChange: (quota: { used: number; limit: number; remaining: number; plan: string }) => void;
  onProfileChange: (profile: Profile) => void;
  disabled: boolean;
};

const TONES = [
  { value: "confident", label: "Confident" },
  { value: "humble", label: "Humble" },
  { value: "energetic", label: "Energetic" },
  { value: "storyteller", label: "Storyteller" },
] as const;

function parseBios(text: string): string[] {
  const parts = text.split(/BIO \d+:\s*/i).filter(Boolean);
  if (parts.length >= 3) return parts.slice(0, 3).map((p) => p.trim());
  return text.split(/\n\n+/).filter(Boolean).map((p) => p.trim()).slice(0, 3);
}

export function AIBioBuilder({ profile, onQuotaChange, onProfileChange, disabled }: Props) {
  const { text: streamedText, isStreaming, error: streamError, startStream, reset: resetStream } = useStream();
  const [bios, setBios] = useState<string[]>([]);
  const [selectedBio, setSelectedBio] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  const [sport, setSport] = useState(profile.sport || "");
  const [school, setSchool] = useState(profile.school || "");
  const [position, setPosition] = useState(profile.position || "");
  const [tone, setTone] = useState<string>("confident");

  const mountTimeRef = useRef<number>(Date.now());
  const hasGeneratedRef = useRef(false);
  const hasSavedOrCopiedRef = useRef(false);

  useEffect(() => {
    const mountTime = mountTimeRef.current;
    return () => {
      const timeSinceMount = Date.now() - mountTime;
      if (hasGeneratedRef.current && !hasSavedOrCopiedRef.current && timeSinceMount > 5000) {
        recordToolEvent("bio", "ignored").catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (streamError) setError(streamError);
  }, [streamError]);

  useEffect(() => {
    if (!isStreaming && streamedText) {
      const parsed = parseBios(streamedText);
      setBios(parsed);
      hasGeneratedRef.current = true;
    }
  }, [isStreaming, streamedText]);

  async function handleGenerate() {
    setError(null);
    setBios([]);
    setSelectedBio(null);
    setApplied(false);
    hasSavedOrCopiedRef.current = false;
    resetStream();

    await startStream(async () => {
      const result = await generateBiosStream({ sport, school, position, tone, existingBio: profile.bio });
      if (!result.ok) {
        setError(result.error || "Generation failed");
        return new ReadableStream<string>();
      }
      if (result.quota) onQuotaChange(result.quota);
      return result.data || new ReadableStream<string>();
    });
  }

  async function handleUseDraft(bio: string) {
    setApplying(true);
    setSelectedBio(bio);
    const result = await updateProfile({ bio });
    setApplying(false);

    if (result.ok && result.data) {
      onProfileChange(result.data);
      setApplied(true);
      hasSavedOrCopiedRef.current = true;
      setTimeout(() => setApplied(false), 2000);
      recordToolEvent("bio", "applied").catch(() => {});
    }
  }

  function handleCopy(text: string, index: number) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIndex(index);
    hasSavedOrCopiedRef.current = true;
    setTimeout(() => setCopiedIndex(null), 2000);
    recordToolEvent("bio", "copied").catch(() => {});
  }

  async function handleSaveToVault(text: string, index: number) {
    const result = await saveAssetToVault("bio", text);
    if (result.ok) {
      setSavedIndex(index);
      hasSavedOrCopiedRef.current = true;
      setTimeout(() => setSavedIndex(null), 2000);
      recordToolEvent("bio", "saved").catch(() => {});
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
            Sport
          </label>
          <input
            type="text"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            placeholder="e.g., Basketball"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            School
          </label>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="e.g., Stanford University"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Position
          </label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g., Point Guard"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          />
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
        disabled={isStreaming || !sport || !school || !position || disabled}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        {isStreaming ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isStreaming ? "Generating..." : "Generate bios"}
      </button>

      {isStreaming && streamedText && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
            {streamedText}
            <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse" />
          </p>
        </div>
      )}

      {!isStreaming && bios.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink-muted">
            Generated bios:
          </p>
          {bios.map((bio, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 transition-all ${
                selectedBio === bio && applied
                  ? "border-accent/40 bg-accent/5"
                  : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              <p className="text-sm text-white leading-relaxed">{bio}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleUseDraft(bio)}
                  disabled={applying}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  {applying && selectedBio === bio ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : applied && selectedBio === bio ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <ArrowRight className="h-3 w-3" />
                  )}
                  {applied && selectedBio === bio ? "Used!" : "Use this draft"}
                </button>
                <button
                  onClick={() => handleCopy(bio, i)}
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
                  onClick={() => handleSaveToVault(bio, i)}
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
