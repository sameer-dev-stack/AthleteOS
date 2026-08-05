"use client";

import { useEffect, useState } from "react";
import { Sliders, ChevronDown, ChevronUp, Save, Sparkles, Check, AlertCircle } from "lucide-react";
import { getBusinessFacts, saveBusinessFacts, ALLOWED_DEAL_PREFERENCES, type PreferredTone, type DealPreference } from "@/lib/actions/business-facts";
import { Skeleton } from "@/components/ui/skeleton";

const TONE_OPTIONS: { value: PreferredTone; label: string }[] = [
  { value: "confident", label: "Confident" },
  { value: "casual", label: "Casual" },
  { value: "professional", label: "Professional" },
  { value: "playful", label: "Playful" },
];

const PREFERENCE_LABELS: Record<DealPreference, string> = {
  sponsorship: "Sponsorship",
  shoutout: "Shoutout",
  collab: "Collab",
  booking: "Booking",
  content: "Content",
  merch: "Merch",
};

export function BusinessProfilePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brandVoice, setBrandVoice] = useState("");
  const [preferredTone, setPreferredTone] = useState<PreferredTone>("confident");
  const [minDealValue, setMinDealValue] = useState("");
  const [dealPreferences, setDealPreferences] = useState<DealPreference[]>([]);

  useEffect(() => {
    let cancelled = false;
    getBusinessFacts().then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) {
        setBrandVoice(res.data.brand_voice || "");
        setPreferredTone(res.data.preferred_tone || "confident");
        setMinDealValue(res.data.min_deal_value !== null && res.data.min_deal_value !== undefined ? String(res.data.min_deal_value) : "");
        setDealPreferences(res.data.deal_preferences || []);
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  function togglePreference(pref: DealPreference) {
    setDealPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    const valNum = minDealValue.trim() === "" ? null : parseFloat(minDealValue);
    if (minDealValue.trim() !== "" && (isNaN(valNum!) || valNum! < 0)) {
      setError("Minimum deal value must be a positive number");
      setSaving(false);
      return;
    }

    const res = await saveBusinessFacts({
      brandVoice: brandVoice.trim() === "" ? null : brandVoice.trim(),
      preferredTone,
      minDealValue: valNum,
      dealPreferences,
    });

    if (res.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } else {
      setError(res.error || "Failed to save business profile");
    }
    setSaving(false);
  }

  const hasConfigured = brandVoice.trim() !== "" || minDealValue.trim() !== "" || dealPreferences.length > 0;

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0D] p-3.5 mb-4 space-y-2">
        <Skeleton className="h-4 w-40 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0D0D11] mb-5 overflow-hidden transition-colors hover:border-white/[0.12]">
      {/* Header Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Sliders className="h-3.5 w-3.5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">Business Profile</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent/90 bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                <Sparkles className="h-2.5 w-2.5" /> Powers AI
              </span>
            </div>
            {!hasConfigured && !isOpen && (
              <p className="text-[11px] text-white/40 mt-0.5">
                Set your business profile — it powers your AI.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-white/40" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/40" />
          )}
        </div>
      </button>

      {/* Expanded Form */}
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-4">
          {/* Brand Voice */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/80">Brand Voice</label>
              <span className="text-[10px] text-white/35">{brandVoice.length}/500</span>
            </div>
            <textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value.slice(0, 500))}
              placeholder="e.g. Gritty, hard-working D1 athlete voice with clear, direct brand messaging."
              rows={2}
              className="w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-accent focus:outline-none resize-none transition-colors"
            />
          </div>

          {/* Grid: Preferred Tone & Minimum Deal Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Preferred Tone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Preferred Tone</label>
              <select
                value={preferredTone}
                onChange={(e) => setPreferredTone(e.target.value as PreferredTone)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#141418] px-3 py-2 text-xs text-white focus:border-accent focus:outline-none transition-colors cursor-pointer"
              >
                {TONE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Deal Value Floor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/80">Min Deal Floor ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/35">$</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={minDealValue}
                  onChange={(e) => setMinDealValue(e.target.value)}
                  placeholder="250"
                  className="w-full rounded-xl border border-white/[0.08] bg-black/40 pl-7 pr-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-accent focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Deal Preferences Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/80">Target Deal Types</label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {ALLOWED_DEAL_PREFERENCES.map((pref) => {
                const active = dealPreferences.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => togglePreference(pref)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? "bg-accent/15 text-accent border-accent/40"
                        : "bg-white/[0.02] text-white/50 border-white/[0.08] hover:border-white/[0.15] hover:text-white/70"
                    }`}
                  >
                    {PREFERENCE_LABELS[pref]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-black hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Business Profile"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
