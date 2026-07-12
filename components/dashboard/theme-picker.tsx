"use client";

import { Check } from "lucide-react";

const ACCENT_COLORS = [
  { name: "Electric Lime", value: "#C6FF3D" },
  { name: "Coral", value: "#FF6B6B" },
  { name: "Teal", value: "#4ECDC4" },
  { name: "Gold", value: "#FFE66D" },
  { name: "Lavender", value: "#A78BFA" },
  { name: "Sky", value: "#38BDF8" },
  { name: "Rose", value: "#FB7185" },
  { name: "Amber", value: "#FBBF24" },
];

/** Pick a checkmark color with sufficient contrast against the swatch */
function getCheckColor(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#0A0A0B" : "#FFFFFF";
}

type Props = {
  accent: string;
  onAccentChange: (v: string) => void;
};

export function ThemePicker({ accent, onAccentChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white">Accent Color</h3>
        <p className="mt-1 text-xs text-ink-dim">
          Choose the highlight color for your public card
        </p>
        <div
          role="radiogroup"
          aria-label="Accent color"
          className="mt-3 flex flex-wrap gap-3"
        >
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onAccentChange(c.value)}
              aria-label={`Select ${c.name} theme`}
              aria-pressed={accent === c.value}
              title={c.name}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B] ${
                accent === c.value
                  ? "border-white scale-110"
                  : "border-white/[0.06] hover:border-white/30"
              }`}
              style={{ backgroundColor: c.value }}
            >
              {accent === c.value && (
                <Check className="h-4 w-4" style={{ color: getCheckColor(c.value) }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
