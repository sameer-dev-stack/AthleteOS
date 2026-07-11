"use client";

import { useState, lazy, Suspense } from "react";
import { Sparkles, FileText, Mail, PenTool, Zap, DollarSign, Bookmark } from "lucide-react";
import { type Profile } from "@/lib/actions/profile";

const AIBioBuilder = lazy(() => import("./ai-bio-builder").then((m) => ({ default: m.AIBioBuilder })));
const AIPitchWriter = lazy(() => import("./ai-pitch-writer").then((m) => ({ default: m.AIPitchWriter })));
const AICaptionGenerator = lazy(() => import("./ai-caption-generator").then((m) => ({ default: m.AICaptionGenerator })));
const AIProfileOptimizer = lazy(() => import("./ai-profile-optimizer").then((m) => ({ default: m.AIProfileOptimizer })));
const AIRateHelper = lazy(() => import("./ai-rate-helper").then((m) => ({ default: m.AIRateHelper })));
const AiAssetVault = lazy(() => import("./ai-asset-vault").then((m) => ({ default: m.AiAssetVault })));

import { Loader2 } from "lucide-react";

type Props = {
  profile: Profile;
  quota: { used: number; limit: number; remaining: number; plan?: string };
  onProfileChange: (profile: Profile) => void;
  savedAssetsCount?: number;
};

type Tool = {
  id: string;
  label: string;
  icon: typeof Sparkles;
};

const TOOLS: Tool[] = [
  { id: "bio", label: "Bio Builder", icon: FileText },
  { id: "pitch", label: "Pitch Writer", icon: Mail },
  { id: "caption", label: "Captions", icon: PenTool },
  { id: "optimize", label: "Optimizer", icon: Zap },
  { id: "rate", label: "Rate Helper", icon: DollarSign },
  { id: "vault", label: "Vault", icon: Bookmark },
];

function ToolLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-5 w-5 animate-spin text-white/30" />
    </div>
  );
}

export function AIToolkit({ profile, quota: initialQuota, onProfileChange, savedAssetsCount }: Props) {
  const [activeTool, setActiveTool] = useState("bio");
  const [currentQuota, setCurrentQuota] = useState(initialQuota);

  function handleQuotaChange(quota: {
    used: number;
    limit: number;
    remaining: number;
    plan: string;
  }) {
    setCurrentQuota(quota);
  }

  const quotaExhausted = currentQuota.remaining <= 0;
  const quotaCopy = currentQuota.plan === "free"
    ? `${currentQuota.remaining} of ${currentQuota.limit} free generations left this month`
    : `${currentQuota.remaining} of ${currentQuota.limit} AI generations left this month`;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-lg font-semibold text-white">AI Toolkit</h2>
          </div>
          <span className="text-xs text-ink-muted">
            {quotaCopy}
          </span>
        </div>

        <div className="mt-4 flex gap-1 overflow-x-auto">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                activeTool === tool.id
                  ? "bg-accent/15 text-accent"
                  : "text-ink-muted hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <tool.icon className="h-3.5 w-3.5" />
              {tool.label}
              {tool.id === "vault" && savedAssetsCount !== undefined && savedAssetsCount > 0 && (
                <span className="ml-1 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                  {savedAssetsCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {quotaExhausted && (
          <div className="mb-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent">
            You&apos;ve used all your free AI actions this month.{" "}
            <button
              onClick={() => document.getElementById('billing')?.scrollIntoView({ behavior: 'smooth' })}
              className="font-semibold underline underline-offset-2 hover:text-accent-soft transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
            >
              Upgrade to Pro
            </button>{" "}
            for unlimited generations.
          </div>
        )}

        <Suspense fallback={<ToolLoader />}>
          {activeTool === "bio" && (
            <AIBioBuilder
              profile={profile}
              onQuotaChange={handleQuotaChange}
              onProfileChange={onProfileChange}
              disabled={quotaExhausted}
            />
          )}
          {activeTool === "pitch" && (
            <AIPitchWriter
              profile={profile}
              onQuotaChange={handleQuotaChange}
              disabled={quotaExhausted}
            />
          )}
          {activeTool === "caption" && (
            <AICaptionGenerator
              profile={profile}
              onQuotaChange={handleQuotaChange}
              disabled={quotaExhausted}
            />
          )}
          {activeTool === "optimize" && (
            <AIProfileOptimizer
              profile={profile}
              onQuotaChange={handleQuotaChange}
              disabled={quotaExhausted}
            />
          )}
          {activeTool === "rate" && (
            <AIRateHelper
              profile={profile}
              onQuotaChange={handleQuotaChange}
              disabled={quotaExhausted}
            />
          )}
          {activeTool === "vault" && (
            <AiAssetVault profile={profile} />
          )}
        </Suspense>
      </div>
    </div>
  );
}
