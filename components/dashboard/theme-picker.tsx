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
        <div className="mt-3 flex flex-wrap gap-3">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => onAccentChange(c.value)}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                accent === c.value
                  ? "border-white scale-110"
                  : "border-white/[0.06] hover:border-white/30"
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            >
              {accent === c.value && <Check className="h-4 w-4 text-bg" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
