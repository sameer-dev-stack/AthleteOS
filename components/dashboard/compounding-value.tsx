"use client";

import {
  Sparkles,
  ShieldCheck,
  Database,
  Calendar,
  Check,
  Lock,
  Mail,
  FileText,
  Palette,
} from "lucide-react";
import { type AIMemory } from "@/lib/actions/ai-memory";

type Props = {
  themeAccent: string;
  createdAt: string;
  memory: AIMemory | null;
};

const MILESTONES = [
  {
    day: 7,
    label: "Personalized Pitch Templates",
    description: "AI learns your outreach style",
    icon: Mail,
  },
  {
    day: 30,
    label: "Pricing Helper PDF Export",
    description: "Export your rate card as PDF",
    icon: FileText,
  },
  {
    day: 90,
    label: "Elite Card Custom Layout",
    description: "Unlock premium card themes",
    icon: Palette,
  },
];

export function CompoundingValue({ themeAccent, createdAt, memory }: Props) {
  const createdDate = new Date(createdAt);
  const diffTime = Math.abs(Date.now() - createdDate.getTime());
  const daysOnPlatform = Math.max(
    1,
    Math.floor(diffTime / (1000 * 60 * 60 * 24))
  );

  const preferredTone = memory?.preferred_tone
    ? memory.preferred_tone.charAt(0).toUpperCase() +
      memory.preferred_tone.slice(1)
    : "Learning...";

  const totalActions =
    (memory?.outputs_saved_count || 0) +
    (memory?.outputs_regenerated_count || 0) +
    (memory?.outputs_ignored_count || 0);

  const maxMilestone = MILESTONES[MILESTONES.length - 1].day;
  const progressPercent = Math.min(
    100,
    Math.round((daysOnPlatform / maxMilestone) * 100)
  );

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111113] p-5 space-y-4">
      <div
        className="absolute -right-16 -bottom-16 w-36 h-36 rounded-full blur-[80px] opacity-15 pointer-events-none"
        style={{ backgroundColor: themeAccent }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-white/50" />
          <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
            Compounding AI Memory
          </span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
          <ShieldCheck className="h-3 w-3" />
          Active Lock-In
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-white leading-none">
            {daysOnPlatform}
          </span>
          <span className="text-xs text-white/40 font-bold uppercase tracking-widest">
            Days on Platform
          </span>
        </div>
        <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed">
          AthleteOS is learning your authentic tone, audience interactions, and
          NIL value. Leaving means losing your trained model configuration.
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest">
          <span>Day 1</span>
          <span style={{ color: themeAccent }}>
            {progressPercent}% to Elite
          </span>
        </div>
        <div className="h-1.5 w-full bg-white/[0.02] border border-white/[0.04] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%`, backgroundColor: themeAccent }}
          />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-white/[0.04]">
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
          Milestone Rewards
        </p>
        {MILESTONES.map((milestone) => {
          const unlocked = daysOnPlatform >= milestone.day;
          const daysRemaining = Math.max(0, milestone.day - daysOnPlatform);
          const MilestoneIcon = milestone.icon;

          return (
            <div
              key={milestone.day}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                unlocked
                  ? "border-accent/30 bg-accent/5"
                  : "border-white/[0.04] bg-white/[0.01] opacity-60"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  unlocked ? "bg-accent/15" : "bg-white/[0.04]"
                }`}
              >
                {unlocked ? (
                  <Check
                    className="h-4 w-4"
                    style={{ color: themeAccent }}
                  />
                ) : (
                  <Lock className="h-4 w-4 text-white/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <MilestoneIcon
                    className={`h-3 w-3 flex-shrink-0 ${
                      unlocked ? "text-accent" : "text-white/30"
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      unlocked ? "text-white" : "text-white/50"
                    }`}
                  >
                    Day {milestone.day}
                  </span>
                  <span
                    className={`text-xs ${
                      unlocked ? "text-white/70" : "text-white/30"
                    }`}
                  >
                    —
                  </span>
                  <span
                    className={`text-xs truncate ${
                      unlocked ? "text-white/80" : "text-white/40"
                    }`}
                  >
                    {milestone.label}
                  </span>
                </div>
                {!unlocked && (
                  <p className="text-[10px] text-white/30 mt-0.5">
                    Unlocks in {daysRemaining} days
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.04]">
        <div className="bg-[#16161A]/50 border border-white/[0.02] p-2.5 rounded-lg text-center">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block mb-0.5">
            Preferred Tone
          </span>
          <span
            className="text-xs font-bold text-white"
            style={{ color: themeAccent }}
          >
            {preferredTone}
          </span>
        </div>
        <div className="bg-[#16161A]/50 border border-white/[0.02] p-2.5 rounded-lg text-center">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block mb-0.5">
            Model Refinements
          </span>
          <span className="text-xs font-bold text-white">
            {totalActions} events
          </span>
        </div>
      </div>
    </div>
  );
}
