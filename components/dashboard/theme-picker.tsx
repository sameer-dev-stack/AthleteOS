"use client";

import { useState } from "react";
import { Check, Lock, Sparkles, Crown } from "lucide-react";
import Link from "next/link";
import { STANDARD_THEMES, PRO_PREMIUM_THEMES, type ThemePreset } from "@/lib/themes";

type Props = {
  accent: string;
  onAccentChange: (v: string) => void;
  isPro?: boolean;
};

export function ThemePicker({ accent, onAccentChange, isPro = false }: Props) {
  const [lockedModal, setLockedModal] = useState<ThemePreset | null>(null);

  function handleSelect(theme: ThemePreset) {
    if (theme.isPro && !isPro) {
      setLockedModal(theme);
      return;
    }
    onAccentChange(theme.id);
  }

  return (
    <div className="space-y-6">
      {/* Standard Accent Colors */}
      <div>
        <h3 className="text-sm font-medium text-white">Standard Colors</h3>
        <p className="mt-1 text-xs text-ink-dim">
          Free highlight colors for your public card
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {STANDARD_THEMES.map((theme) => {
            const selected = accent === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelect(theme)}
                title={theme.name}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  selected
                    ? "border-white scale-110 shadow-lg"
                    : "border-white/[0.06] hover:border-white/30"
                }`}
                style={{ backgroundColor: theme.primaryColor }}
              >
                {selected && <Check className="h-4 w-4 text-black" />}
              </button>
            );
          })}
        </div>
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

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRO_PREMIUM_THEMES.map((theme) => {
            const selected = accent === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelect(theme)}
                className={`relative flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                  selected
                    ? "border-accent bg-accent/10 ring-1 ring-accent/30 scale-[1.02]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-7 w-7 rounded-lg shadow-md flex-shrink-0 flex items-center justify-center border border-white/20"
                    style={{ background: theme.backgroundGradient || theme.primaryColor }}
                  >
                    {selected && <Check className="h-3.5 w-3.5 text-black font-bold" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white leading-tight">
                      {theme.name}
                    </p>
                    <p className="text-[9px] font-medium text-white/40 capitalize">
                      {theme.type}
                    </p>
                  </div>
                </div>
                {!isPro && (
                  <Lock className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pro Lock Modal */}
      {lockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-accent/30 bg-[#111115] p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
              <Crown className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Unlock {lockedModal.name}</h3>
              <p className="mt-1 text-xs text-white/50">
                Metallic & Neon themes are exclusive to AthleteOS Pro members or earned free via referrals.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/dashboard/billing"
                className="w-full rounded-xl bg-accent py-2.5 text-xs font-bold text-bg transition-opacity hover:opacity-90 text-center"
              >
                Upgrade to Pro ($14/mo)
              </Link>
              <Link
                href="/dashboard/referrals"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 text-center"
              >
                Earn Pro Free via Referrals →
              </Link>
              <button
                onClick={() => setLockedModal(null)}
                className="text-[11px] font-medium text-white/40 hover:text-white pt-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
