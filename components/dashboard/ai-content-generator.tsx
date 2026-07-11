"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, Copy, Check, Trash2, Download, ChevronDown, ChevronUp } from "lucide-react";
import {
  generateContent,
  getContentHistory,
  deleteContent,
  type ContentType,
  type ContentHistoryItem,
} from "@/lib/actions/ai-content";

type Props = {
  onQuotaChange: (quota: { used: number; limit: number; remaining: number; plan: string }) => void;
  disabled: boolean;
};

const CONTENT_TYPES: { value: ContentType; label: string; placeholder: string }[] = [
  { value: "bio", label: "Bio", placeholder: "e.g., Write a confident bio for a D1 basketball player focused on community impact..." },
  { value: "caption", label: "Caption", placeholder: "e.g., Write an energetic caption for a game-winning moment..." },
  { value: "pitch", label: "Brand Pitch", placeholder: "e.g., Write a pitch to Nike for a sponsorship deal, mention my 50K followers..." },
  { value: "thank_you", label: "Thank You", placeholder: "e.g., Write a thank you message to a local restaurant that sponsored my team..." },
];

function getLabel(type: string) {
  return CONTENT_TYPES.find((c) => c.value === type)?.label || type;
}

export function AIContentGenerator({ onQuotaChange, disabled }: Props) {
  const [contentType, setContentType] = useState<ContentType>("bio");
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState<ContentHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (historyOpen && history.length === 0) {
      loadHistory();
    }
  }, [historyOpen, history.length]);

  async function loadHistory() {
    setHistoryLoading(true);
    const result = await getContentHistory();
    if (result.ok && result.data) {
      setHistory(result.data);
    }
    setHistoryLoading(false);
  }

  const activePlaceholder = CONTENT_TYPES.find((c) => c.value === contentType)?.placeholder || "";

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;
    setError(null);
    setGeneratedContent(null);
    setIsGenerating(true);

    const result = await generateContent({ contentType, prompt: prompt.trim() });
    setIsGenerating(false);

    if (result.ok && result.data) {
      setGeneratedContent(result.data);
      if (result.quota) onQuotaChange(result.quota);
      if (historyOpen) loadHistory();
    } else {
      setError(result.error || "Generation failed");
    }
  }

  function handleCopy() {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!generatedContent) return;
    const blob = new Blob([generatedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `athlete-${contentType}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteHistory(id: string) {
    setDeletingId(id);
    const result = await deleteContent(id);
    if (result.ok) {
      setHistory((prev) => prev.filter((item) => item.id !== id));
    }
    setDeletingId(null);
  }

  function handleCopyHistory(content: string) {
    navigator.clipboard.writeText(content).catch(() => {});
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-muted">
          Content type
        </label>
        <div className="flex gap-2">
          {CONTENT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setContentType(type.value);
                setGeneratedContent(null);
                setError(null);
              }}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
            contentType === type.value
              ? "bg-accent/15 text-accent"
              : "text-ink-muted hover:bg-white/[0.04] hover:text-white"
          }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-muted">
          What do you want to create?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={activePlaceholder}
          rows={3}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 resize-none"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim() || disabled}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isGenerating ? "Generating..." : `Generate ${getLabel(contentType)}`}
      </button>

      {isGenerating && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-sm text-white/40 leading-relaxed animate-pulse">
            Creating your {getLabel(contentType).toLowerCase()}...
          </p>
        </div>
      )}

      {generatedContent && !isGenerating && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="whitespace-pre-wrap text-sm text-white leading-relaxed">
            {generatedContent}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-ink-muted transition-all duration-200 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-white/[0.06] pt-4">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Content history
        </button>

        {historyOpen && (
          <div className="mt-3 space-y-2">
            {historyLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-white/30" />
              </div>
            ) : history.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                No content generated yet.
              </p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-accent">
                      {getLabel(item.content_type)}
                    </span>
                    <span className="text-xs text-ink-dim">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mb-1 line-clamp-1">
                    {item.prompt}
                  </p>
                  <p className="text-sm text-white/70 line-clamp-3 whitespace-pre-wrap">
                    {item.generated_content}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleCopyHistory(item.generated_content)}
                      className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] font-medium text-ink-muted hover:bg-white/[0.05] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([item.generated_content], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `athlete-${item.content_type}-${item.id}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] font-medium text-ink-muted hover:bg-white/[0.05] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDeleteHistory(item.id)}
                      disabled={deletingId === item.id}
                      className="flex items-center gap-1 rounded-md border border-red-500/20 px-2 py-1 text-[11px] font-medium text-red-400/70 hover:bg-red-500/10 disabled:opacity-40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                    >
                      <Trash2 className="h-3 w-3" />
                      {deletingId === item.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
