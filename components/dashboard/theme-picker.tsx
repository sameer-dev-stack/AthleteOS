"use client";

import { useState } from "react";
import { Check, Lock, Sparkles, Crown, RotateCcw, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PRO_PREMIUM_THEMES, type ThemePreset } from "@/lib/themes";

type Props = {
  accent: string;
  onAccentChange: (v: string) => void;
  isPro?: boolean;
};

export function ThemePicker({ accent, onAccentChange, isPro = false }: Props) {
  const [lockedModal, setLockedModal] = useState<ThemePreset | null>(null);

  const isDefaultSelected = !accent || accent === "#C6FF3D";

  function handleSelect(theme: ThemePreset) {
    if (!isPro) {
      setLockedModal(theme);
      return;
    }
    onAccentChange(theme.id);
  }

  function handleResetDefault() {
    if (!isPro && !isDefaultSelected) {
      // Free users are already restricted to default
      return;
    }
    onAccentChange("#C6FF3D");
  }

  // --------------------------------------------------------------------------
  // FREE USERS VIEW: Full Pro Lock UI
  // --------------------------------------------------------------------------
  if (!isPro) {
    return (
      <div className="space-y-6">
        {/* Main Pro Feature Card */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 border border-accent/40 shadow-2xl"
          style={{
            background: "radial-gradient(ellipse 130% 120% at 0% 0%, rgba(198, 255, 61, 0.12) 0%, rgba(18, 20, 28, 0.96) 50%, rgba(8, 9, 13, 0.99) 100%)",
            boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.8)",
          }}
        >
          {/* Ambient Glows */}
          <div
            className="absolute -top-16 -left-16 h-56 w-56 rounded-full pointer-events-none blur-3xl opacity-25"
            style={{ background: "#C6FF3D" }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-accent/20 text-accent border border-accent/40 shadow-[0_0_15px_rgba(198,255,61,0.25)]">
                  <Crown className="h-3.5 w-3.5" />
                  Pro Exclusive Feature
                </span>
              </div>

              <h3 className="text-xl font-black text-white tracking-tight leading-snug">
                Custom Themes are Locked for Pro Users
              </h3>

              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Free accounts use the classic <span className="text-accent font-bold">AthleteOS Default Theme</span> (Obsidian Dark with Electric Lime accents). Upgrade to Pro to unlock custom accent colors, 24K Gold, Cyber Neon, Titanium Platinum, Holographic Iridescent, and Rose Gold finishes.
              </p>
            </div>

            <Link
              href="/dashboard/billing"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-accent text-black font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(198,255,61,0.4)] hover:bg-[#b8f52b] hover:scale-[1.03] active:scale-[0.98] transition-all flex-shrink-0"
            >
              <span>Upgrade to Pro</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Active Theme Status */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#C6FF3D] border border-white/30 flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-black font-bold" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Active Card Theme: <span className="text-accent">Default AthleteOS</span></p>
              <p className="text-[11px] text-white/40">Free plan profile cards use signature Electric Lime highlights.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-2.5 py-1 rounded bg-white/[0.04]">
            Free Plan Default
          </span>
        </div>

        {/* Theme Preview Grid (Clicking prompts upgrade) */}
        <div className="pt-2 opacity-60">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Pro Theme Preview (Locked)
            </h4>
            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Requires Pro Plan
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PRO_PREMIUM_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setLockedModal(theme)}
                className="relative flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left hover:border-amber-400/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-7 w-7 rounded-lg shadow-md flex-shrink-0 flex items-center justify-center border border-white/20"
                    style={{ background: theme.backgroundGradient || theme.primaryColor }}
                  />
                  <div>
                    <p className="text-xs font-semibold text-white/90 leading-tight group-hover:text-white">
                      {theme.name}
                    </p>
                    <p className="text-[9px] font-medium text-white/40 capitalize">
                      {theme.type} Finish
                    </p>
                  </div>
                </div>
                <Lock className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Upgrade Modal when clicking a theme preview */}
        {lockedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-2xl border border-accent/40 bg-[#121318] p-6 shadow-2xl space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-accent shadow-[0_0_20px_rgba(198,255,61,0.3)]">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Unlock Custom Card Themes</h4>
                <p className="mt-1.5 text-xs text-white/70 leading-relaxed">
                  All card themes — including <span className="text-white font-bold">{lockedModal.name}</span>, custom accent colors, 24K Gold, Cyber Neon, Titanium Platinum, and Holographic finishes — are exclusive to AthleteOS Pro.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setLockedModal(null)}
                  className="flex-1 rounded-xl border border-white/10 py-3 text-xs font-semibold text-white/80 hover:bg-white/5"
                >
                  Cancel
                </button>
                <Link
                  href="/dashboard/billing"
                  className="flex-1 rounded-xl bg-accent py-3 text-center text-xs font-black text-black uppercase tracking-wide shadow-[0_0_20px_rgba(198,255,61,0.4)] hover:bg-[#b8f52b]"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // PRO USERS VIEW: Full Unlocked Theme Picker
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Default Theme Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Default Theme</h3>
          {isDefaultSelected && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/30">
              <ShieldCheck className="h-3 w-3" />
              Active Default
            </span>
          )}
        </div>
        <p className="text-xs text-ink-dim">
          Keep your card in the signature AthleteOS classic look (dark obsidian with electric lime accents).
        </p>

        <button
          type="button"
          onClick={handleResetDefault}
          className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
            isDefaultSelected
              ? "border-accent bg-accent/10 ring-1 ring-accent/40 shadow-[0_0_15px_rgba(198,255,61,0.15)]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#C6FF3D] border border-white/30 flex items-center justify-center flex-shrink-0 shadow-md">
              {isDefaultSelected ? (
                <Check className="h-4 w-4 text-black font-bold" />
              ) : (
                <RotateCcw className="h-4 w-4 text-black" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span>Default AthleteOS Theme</span>
                <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">(Original)</span>
              </p>
              <p className="text-[11px] text-white/50 mt-0.5">
                Classic obsidian dark card with signature electric lime accents
              </p>
            </div>
          </div>
        </button>
      </div>



      {/* Pro Premium Metallic & Neon Themes */}
      <div className="pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-white">Pro Premium Themes</h3>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold text-accent border border-accent/20">
            <Crown className="h-3 w-3" />
            PRO UNLOCKED
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-dim">
          Metallic gradients, neon edge glows, and holographic finishes
        </p>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRO_PREMIUM_THEMES.map((theme) => {
            const selected = accent === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelect(theme)}
                className={`relative flex items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                  selected
                    ? "border-accent bg-accent/10 ring-1 ring-accent/30 scale-[1.02]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-8 w-8 rounded-lg shadow-md flex-shrink-0 flex items-center justify-center border border-white/20"
                    style={{ background: theme.backgroundGradient || theme.primaryColor }}
                  >
                    {selected && <Check className="h-4 w-4 text-black font-bold" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white leading-tight">
                      {theme.name}
                    </p>
                    <p className="text-[9.5px] font-medium text-white/40 capitalize">
                      {theme.type} Finish
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
