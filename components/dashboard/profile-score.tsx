import type { Profile } from "@/lib/actions/profile";
import { getProfileCompletion } from "@/lib/profile-score";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

function ProgressRing({ score, size = 56, stroke = 5 }: { score: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#C6FF3D"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

const FIELD_TO_TAB: Record<string, string> = {
  "Full name": "bio",
  Sport: "bio",
  School: "bio",
  Position: "bio",
  "Class year": "bio",
  Bio: "bio",
  Avatar: "bio",
  Stats: "stats",
  Links: "links",
  Social: "social",
  Highlights: "highlights",
};

export function ProfileScore({ profile }: { profile: Profile }) {
  const { score, missing } = getProfileCompletion(profile);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 transition-colors hover:border-white/[0.1]">
      <div className="flex items-center gap-4">
        <div className="relative">
          <ProgressRing score={score} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-accent">{score}</span>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-ink-muted">Profile Score</div>
          <p className="text-xs text-ink-dim mt-0.5">
            {score === 100 ? "Your card is brand-ready" : `${100 - score} points to brand-ready`}
          </p>
        </div>
      </div>

      {score === 100 ? (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
            <span className="text-xs text-white/60">Your card is live and ready to receive tips</span>
          </div>
          <div>
            <Link
              href={`/${profile.username}`}
              className="text-accent text-xs font-bold hover:underline"
            >
              View public card &rarr;
            </Link>
          </div>
        </div>
      ) : (
        missing.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-ink-dim">
              Add to improve your score:
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {missing.map((field) => {
                const tab = FIELD_TO_TAB[field] || "bio";
                return (
                  <Link
                    key={field}
                    href={`/dashboard/profile?tab=${tab}`}
                    className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-ink-muted transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    {field}
                  </Link>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
