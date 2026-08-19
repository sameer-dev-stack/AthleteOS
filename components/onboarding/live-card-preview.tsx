"use client";

import Image from "next/image";
import { getFallbackGradient } from "@/lib/sport-config";

type Stat = { label: string; value: string };

const ACCENT = "#C6FF3D";

const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function classBadge(classYear: string): string | null {
  const cy = classYear.toLowerCase();
  switch (cy) {
    case "freshman":
      return "FR";
    case "sophomore":
      return "SO";
    case "junior":
      return "JR";
    case "senior":
      return "SR";
    case "grad student":
      return "GS";
    default:
      return null;
  }
}

export function LiveCardPreview({
  avatarUrl,
  fullName,
  sport,
  position,
  school,
  classYear,
  username,
  stats,
}: {
  avatarUrl: string | null;
  fullName: string;
  sport: string;
  position: string;
  school: string;
  classYear: string;
  username: string;
  stats: Stat[];
}) {
  const displayName = fullName.trim() || "Your Name";
  const initials =
    displayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A";
  const metaLine = [position.trim(), sport.trim()].filter(Boolean).join(" · ");
  const badge = classBadge(classYear);
  const cleanStats = stats
    .filter((s) => s.label.trim() && s.value.trim())
    .slice(0, 3);

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: "360 / 600" }}>
      <div
        className="absolute inset-0 flex flex-col overflow-hidden rounded-[20px]"
        style={{
          background: "#0d0d12",
          boxShadow: `0 0 25px ${ACCENT}1f, 0 20px 60px -16px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Noise grain */}
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-[20px]"
          style={{
            backgroundImage: NOISE_SVG,
            backgroundSize: "128px 128px",
            mixBlendMode: "overlay",
            opacity: 0.022,
          }}
        />
        {/* Top accent hairline */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px"
          style={{ background: `linear-gradient(90deg, transparent 5%, ${ACCENT}35 50%, transparent 95%)` }}
        />

        {/* Photo hero */}
        <div className="relative min-h-0 flex-1">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              sizes="360px"
              unoptimized
              className="object-cover object-top"
              draggable={false}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: getFallbackGradient(sport) }}
            >
              <span
                className="select-none text-[64px] font-black"
                style={{ color: `${ACCENT}18`, letterSpacing: "-0.04em" }}
              >
                {initials}
              </span>
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 85% 65% at 50% 30%, transparent 35%, rgba(0,0,0,0.30) 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: "55%",
              background:
                "linear-gradient(to top, #0d0d12 0%, #0d0d12e8 18%, #0d0d1290 45%, transparent 100%)",
            }}
          />
        </div>

        {/* Identity */}
        <div className="relative z-10 flex-shrink-0 px-5 pt-3.5 pb-1">
          <h2
            className="line-clamp-2 font-black text-white"
            style={{
              fontSize: "clamp(15px, 4.2vw, 20px)",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            {displayName}
            {badge && (
              <span
                className="ml-1 inline-flex items-center rounded px-1.5 py-0.5 align-middle text-[7.5px] font-black uppercase tracking-widest"
                style={{
                  color: "rgba(255,255,255,0.35)",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {badge}
              </span>
            )}
          </h2>
          {metaLine && (
            <p
              className="mt-1 text-[11px] font-semibold leading-none"
              style={{ color: "rgba(255,255,255,0.50)" }}
            >
              {metaLine}
            </p>
          )}
          {school.trim() && (
            <p
              className="mt-1 truncate text-[10px] font-medium leading-none"
              style={{ color: "rgba(255,255,255,0.28)" }}
              title={school}
            >
              {school}
            </p>
          )}
        </div>

        {/* Stats strip */}
        {cleanStats.length > 0 && (
          <div className="mx-4 mt-2 flex-shrink-0">
            <div
              className="mb-2 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}18, transparent)` }}
            />
            <div
              className="flex items-stretch overflow-hidden rounded-xl"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)" }}
            >
              {cleanStats.map((s, i) => (
                <div
                  key={i}
                  className="relative flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-3"
                  style={i > 0 ? { borderLeft: "1px solid rgba(255,255,255,0.055)" } : {}}
                >
                  <span
                    className="max-w-full truncate text-base font-black leading-none tracking-tight"
                    style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.03em" }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="mt-1.5 max-w-full truncate text-center text-[7.5px] font-bold uppercase leading-none tracking-widest"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* URL */}
        <div className="mt-2 flex-shrink-0 px-4 pb-3">
          <div
            className="flex items-center justify-center rounded-lg px-3 py-1.5"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)" }}
          >
            <span
              className="max-w-full truncate text-[9px] font-medium"
              style={{ color: "rgba(255,255,255,0.32)" }}
            >
              nilcard.app/{username.trim() || "yourname"}
            </span>
          </div>
        </div>

        {/* Bottom accent hairline */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-px"
          style={{ background: `linear-gradient(90deg, transparent 10%, ${ACCENT}20 50%, transparent 90%)` }}
        />
      </div>

      {/* Live preview chip */}
      <div
        className="absolute -top-2 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest"
        style={{ background: "#0d0d12", border: `1px solid ${ACCENT}30`, color: ACCENT }}
      >
        Your card
      </div>
    </div>
  );
}