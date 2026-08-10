"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════
 *  AthleteOS · Public Athlete Identity Card
 *  ─────────────────────────────────────────
 *  Component Architecture:
 *
 *  ProfileCard (root, exported)
 *  └── AthleteIdentityCard
 *      ├── ReflectiveCardShell          ← material / theming layer
 *      ├── [FRONT]
 *      │   ├── CardHeader               ← logo, plan badge, qr, share
 *      │   ├── AthletePhoto             ← hero image + vignette
 *      │   ├── AthleteIdentity          ← name, sport, position, school, verification
 *      │   ├── AthleteStats             ← stat strip (NIL + custom stats)
 *      │   ├── AthleteIDBlock           ← athlete ID / URL copy
 *      │   └── FlipCTA                  ← animated flip affordance
 *      └── [BACK]
 *          ├── BackHeader               ← avatar, name, flip-back CTA
 *          ├── [SCROLLABLE]
 *          │   ├── AboutSection         ← bio
 *          │   ├── LinksSection         ← structured links
 *          │   ├── HighlightsSection    ← highlight reels
 *          │   └── ConnectSection       ← social icons + share
 *          ├── ContactModal             ← overlay for email/phone
 *          └── BackActions              ← Contact, Send Inquiry, Tip
 *
 *  Design Tokens (applied via CSS custom properties):
 *    --aic-accent    primary brand color (theme-driven)
 *    --aic-surface   card base surface color
 *    --aic-radius    card corner radius
 * ═══════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Share2, Check as CheckIcon, Copy, Mail, Send,
  Instagram, Twitter, Youtube, Music2,
  Star, Play, RotateCcw,
  GraduationCap, Timer, Trophy, Target,
  TrendingUp, Percent, Zap, Medal,
  Heart, Sparkles, ExternalLink, ChevronRight,
  X, Phone, QrCode,
  ShieldCheck, Briefcase, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Profile } from "@/lib/actions/profile";
import { TipButton } from "@/components/tip-button";
import { InquiryForm } from "@/components/inquiry-form";
import { trackView, trackLinkClick } from "@/lib/actions/analytics";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";
import { Logo } from "@/components/logo";
import { resolvePlan } from "@/lib/referral-reward";
import { QrShareModal } from "@/components/dashboard/qr-share-modal";
import { ShareButtons } from "@/components/share-buttons";
import { useSearchParams } from "next/navigation";
import { CARD_W, CARD_H } from "@/lib/constants";
import { cleanName } from "@/lib/display-name";
import { resolveTheme } from "@/lib/themes";
import { ReflectiveCard } from "@/components/reflective-card";
import { BorderGlow } from "@/components/border-glow";
import { isValidPosition, getFallbackGradient } from "@/lib/sport-config";

/* ══════════════════════════════════════════════════════════
   CONSTANTS & MAPS
══════════════════════════════════════════════════════════ */

const AUTO_RETURN_MS = 12_000;
const PHOTO_INTERVAL_MS = 4_000;

/** Maps well-known stat keys to lucide icons */
const STAT_ICON_MAP: Record<string, React.ElementType> = {
  gpa: GraduationCap,
  "40-yd": Timer,
  ppg: Trophy,
  yards: TrendingUp,
  td: Target,
  "catch %": Percent,
  receptions: Zap,
  touchdowns: Target,
  tackles: Medal,
  default: Trophy,
};

/** Social platform metadata */
const SOCIAL_MAP: { key: string; Icon: React.ElementType; prefix: string; color: string; label: string }[] = [
  { key: "instagram", Icon: Instagram, prefix: "https://instagram.com/", color: "#E4405F", label: "Instagram" },
  { key: "twitter",   Icon: Twitter,   prefix: "https://x.com/",         color: "#1DA1F2", label: "X (Twitter)" },
  { key: "tiktok",    Icon: Music2,    prefix: "https://tiktok.com/@",   color: "#00F2EA", label: "TikTok" },
  { key: "youtube",   Icon: Youtube,   prefix: "https://youtube.com/@",  color: "#FF0000", label: "YouTube" },
];

/* ══════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════ */

function sanitize(t: string | null): string {
  if (!t) return "";
  return t
    .replace(/\\\\/g, "\0")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\0/g, "\\\\");
}

function getStatIcon(label: string): React.ElementType {
  const key = label.toLowerCase().trim();
  return STAT_ICON_MAP[key] ?? STAT_ICON_MAP.default;
}

function formatAthleteId(username: string | null): string {
  if (!username) return "AOS-00000";
  const hash = username
    .split("")
    .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffff, 0);
  return `AOS-${String(hash).padStart(5, "0")}`;
}

/* ══════════════════════════════════════════════════════════
   DESIGN TOKENS TYPE
══════════════════════════════════════════════════════════ */

interface CardTokens {
  accent: string;
  /** Subtle tinted surface — e.g. accent + 08 */
  accentSurface: string;
  /** Accent at 15% — borders, fills */
  accentBorder: string;
  /** Accent at 25% — stronger fills */
  accentFill: string;
  /** Accent at 50% — medium emphasis */
  accentMedium: string;
}

function buildTokens(accent: string): CardTokens {
  return {
    accent,
    accentSurface: `${accent}08`,
    accentBorder:  `${accent}25`,
    accentFill:    `${accent}15`,
    accentMedium:  `${accent}50`,
  };
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS — FRONT FACE
══════════════════════════════════════════════════════════ */

/* ── CardHeader ─────────────────────────────────────────── */
interface CardHeaderProps {
  accent: string;
  plan: string;
  isVerified: boolean;
  profile: Profile;
  onQr: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
  copied: boolean;
  displayName: string;
  classLabel: string | null;
}

function CardHeader({
  accent,
  plan,
  isVerified,
  onQr,
  onShare,
  copied,
  displayName,
  classLabel,
}: CardHeaderProps) {
  const isPro = plan === "pro" || plan === "team";

  const nameLen = displayName.length;
  const fontSize =
    nameLen <= 8
      ? "clamp(18px, 5.2vw, 22px)"
      : nameLen <= 14
      ? "clamp(15px, 4.4vw, 19px)"
      : nameLen <= 20
      ? "clamp(13px, 3.8vw, 15px)"
      : "clamp(11px, 3.2vw, 13px)";

  return (
    <div className="flex items-center justify-between w-full mb-4 z-20">
      {/* Brand mark / Athlete Name */}
      {!isPro ? (
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 h-6 pointer-events-auto"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Logo
            className="h-3.5 w-3.5 rounded-[3px] flex-shrink-0"
            style={{ backgroundColor: accent }}
          />
          <span className="text-[8.5px] font-black tracking-[0.18em] uppercase text-white/90">
            ATHLETE<span style={{ color: accent }}>OS</span>
          </span>
        </div>
      ) : (
        <h1
          className="font-black text-white line-clamp-2"
          style={{
            fontSize,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            wordBreak: "keep-all",
            overflowWrap: "anywhere",
            maxWidth: "75%",
            minWidth: 0,
          } as React.CSSProperties}
        >
          <span>{displayName}</span>
          {(isVerified || isPro || classLabel) && (
            <span className="inline-flex items-center gap-1 align-middle ml-1 flex-shrink-0 relative -top-[1px]">
              {(isVerified || isPro) && (
                <Image
                  src="/verified.gif"
                  alt="Verified Athlete"
                  width={48}
                  height={48}
                  className="inline-block h-[32px] w-[32px] flex-shrink-0 align-middle"
                  unoptimized
                />
              )}
              {classLabel && (
                <span
                  className="flex-shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[7.5px] font-black tracking-widest uppercase"
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {classLabel}
                </span>
              )}
            </span>
          )}
        </h1>
      )}

      {/* Right actions */}
      <div className="flex items-center gap-1.5 pointer-events-auto">
        {/* QR */}
        <button
          onClick={onQr}
          aria-label="Show QR code"
          className="h-10 w-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(12px)",
          }}
        >
          <QrCode className="h-4 w-4" style={{ color: "rgba(255,255,255,0.55)" }} />
        </button>

        {/* Share */}
        <button
          onClick={onShare}
          aria-label="Share profile"
          className="h-10 w-10 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(12px)",
          }}
        >
          {copied ? (
            <CheckIcon className="h-4 w-4" style={{ color: accent }} />
          ) : (
            <Share2 className="h-4 w-4" style={{ color: "rgba(255,255,255,0.55)" }} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── AthletePhoto ─────────────────────────────────────── */
interface AthletePhotoProps {
  photos: string[];
  photoIdx: number;
  displayName: string;
  initials: string;
  accent: string;
  sport: string | null;
}

function AthletePhoto({ photos, photoIdx, displayName, initials, accent, sport }: AthletePhotoProps) {
  const hasPhoto = photos.length > 0;

  return (
    <div
      className="relative flex-1 min-h-0 w-full"
    >
      {hasPhoto ? (
        <>
          {photos.map((url, i) => (
            <div
              key={url}
              className="absolute inset-0"
              style={{
                opacity: i === photoIdx ? 1 : 0,
                transition: "opacity 1.2s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <Image
                src={url}
                alt={displayName}
                fill
                sizes="420px"
                className="object-cover object-top"
                draggable={false}
                unoptimized
                priority={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </>
      ) : (
        /* Placeholder with initials — sport-aware fallback gradient */
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: getFallbackGradient(sport),
          }}
        >
          <span
            className="text-[72px] font-black select-none"
            style={{ color: `${accent}18`, letterSpacing: "-0.04em" }}
          >
            {initials}
          </span>
        </div>
      )}

      {/* Cinematic vignette — edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 65% at 50% 30%, transparent 35%, rgba(0,0,0,0.30) 100%)",
        }}
      />

      {/* Bottom gradient blending into card surface */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "55%",
          background:
            "linear-gradient(to top, #0d0d12 0%, #0d0d12e8 18%, #0d0d1290 45%, transparent 100%)",
        }}
      />

      {/* Noise grain for premium texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "160px 160px",
          mixBlendMode: "overlay",
          opacity: 0.025,
        }}
      />

      {/* Photo carousel dots inside photo block */}
      {photos.length > 1 && (
        <div
          className="absolute flex items-center gap-1.5 z-10 pointer-events-none"
          style={{
            bottom: "8px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {photos.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-500 ${i === photoIdx ? "dot-active" : ""}`}
              style={{
                width: i === photoIdx ? "16px" : "4px",
                height: "4px",
                background: i === photoIdx ? accent : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ProfileAvatar — circular profile picture overlapping hero/content ── */
interface ProfileAvatarProps {
  photos: string[];
  photoIdx: number;
  displayName: string;
  initials: string;
  accent: string;
  sport: string | null;
}

function ProfileAvatar({ photos, photoIdx, displayName, initials, accent, sport }: ProfileAvatarProps) {
  const hasPhoto = photos.length > 0;

  return (
    <div
      className="absolute left-5 z-20"
      style={{ bottom: "calc(48% - 36px)" }}
    >
      <div
        className="relative w-[72px] h-[72px] rounded-full overflow-hidden"
        style={{
          border: `3px solid #0d0d12`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${accent}30`,
        }}
      >
        {hasPhoto ? (
          <Image
            src={photos[photoIdx]}
            alt={displayName}
            fill
            sizes="72px"
            className=""
            draggable={false}
            unoptimized
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: getFallbackGradient(sport) }}
          >
            <span
              className="text-[28px] font-black select-none"
              style={{ color: `${accent}40` }}
            >
              {initials}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── AthleteIdentity ─────────────────────────────────── */
interface AthleteIdentityProps {
  displayName: string;
  sport: string | null;
  position: string | null;
  school: string | null;
  classLabel: string | null;
  isVerified: boolean;
  isPro: boolean;
  accent: string;
  plan: string;
  onQr: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
  copied: boolean;
}

function AthleteIdentity({
  displayName,
  sport,
  position,
  school,
  classLabel,
  isVerified,
  isPro,
  accent,
  plan,
  onQr,
  onShare,
  copied,
}: AthleteIdentityProps) {
  let resolvedPosition = position;
  if (process.env.NODE_ENV === "development" && sport && position && !isValidPosition(sport, position)) {
    console.warn(`[AthleteOS] Position "${position}" is not valid for sport "${sport}". Falling back to "Athlete".`);
    resolvedPosition = "Athlete";
  }
  const metaLine = [resolvedPosition, sport].filter(Boolean).join(" · ");
  const schoolLine = school ?? null;

  const nameLen = displayName.length;
  const fontSize =
    nameLen <= 8
      ? "clamp(20px, 5.5vw, 24px)"
      : nameLen <= 14
      ? "clamp(17px, 4.8vw, 21px)"
      : nameLen <= 20
      ? "clamp(14px, 4vw, 17px)"
      : "clamp(11px, 3.2vw, 14px)";

  return (
    <div className="flex-shrink-0 px-5 pt-6 relative z-10">
      {/* Divider between hero and content */}
      <div
        className="absolute top-0 left-5 right-5 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`,
        }}
      />
      {/* Card Header (Logo, QR, Share) relocated here */}
      <CardHeader
        accent={accent}
        plan={plan}
        isVerified={isVerified}
        profile={{} as any} // Profile is not used inside CardHeader, passed empty mock to satisfy TS
        onQr={onQr}
        onShare={onShare}
        copied={copied}
        displayName={displayName}
        classLabel={classLabel}
      />
      {/* Name row */}
      {!isPro && (
        <h1
          className="font-black text-white line-clamp-2"
          style={{
            fontSize,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            wordBreak: "keep-all",
            overflowWrap: "anywhere",
            maxWidth: "100%",
            minWidth: 0,
          } as React.CSSProperties}
        >
          <span>{displayName}</span>
          {(isVerified || isPro || classLabel) && (
            <span className="inline-flex items-center gap-1 align-middle ml-1 flex-shrink-0 relative -top-[1px]">
              {(isVerified || isPro) && (
                <Image
                  src="/verified.gif"
                  alt="Verified Athlete"
                  width={48}
                  height={48}
                  className="inline-block h-[32px] w-[32px] flex-shrink-0 align-middle"
                  unoptimized
                />
              )}
              {classLabel && (
                <span
                  className="flex-shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[7.5px] font-black tracking-widest uppercase"
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {classLabel}
                </span>
              )}
            </span>
          )}
        </h1>
      )}

      {/* Sport · Position */}
      {metaLine && (
        <p
          className="text-[12px] font-semibold mt-1 leading-none"
          style={{ color: "rgba(255,255,255,0.50)", letterSpacing: "0.02em" }}
        >
          {metaLine}
        </p>
      )}

      {/* School */}
      {schoolLine && (
        <p
          className="text-[10.5px] mt-0.5 leading-none font-medium truncate"
          style={{ color: "rgba(255,255,255,0.28)" }}
          title={schoolLine}
        >
          {schoolLine}
        </p>
      )}
    </div>
  );
}

/* ── AthleteStats ─────────────────────────────────────── */
interface StatCell {
  key: string;
  label: string;
  value: string;
  isAccent: boolean;
}

interface AthleteStatsProps {
  cells: StatCell[];
  accent: string;
}

function AthleteStats({ cells, accent }: AthleteStatsProps) {
  if (cells.length === 0) return null;

  return (
    <div className="flex-shrink-0 mx-4 mt-2">
      {/* Subtle rule above */}
      <div
        className="mb-2 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}18, transparent)`,
        }}
      />

      <div
        className="flex items-stretch rounded-xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.055)",
        }}
      >
        {cells.map((cell, i) => {
          const Icon = getStatIcon(cell.label);
          return (
            <div
              key={cell.key}
              className="flex-1 flex flex-col items-center justify-center py-3 px-2 relative"
              style={
                i > 0
                  ? { borderLeft: "1px solid rgba(255,255,255,0.055)" }
                  : {}
              }
            >
              {/* Icon micro-indicator */}
              <Icon
                className="h-2.5 w-2.5 mb-1.5 opacity-30"
                style={{ color: cell.isAccent ? accent : "rgba(255,255,255,0.5)" }}
              />
              {/* Value */}
              <span
                className="text-[19px] font-black leading-none tracking-tight"
                style={{
                  color: cell.isAccent ? accent : "rgba(255,255,255,0.95)",
                  letterSpacing: "-0.03em",
                }}
              >
                {cell.value}
              </span>
              {/* Label */}
              <span
                className="text-[8px] font-bold uppercase tracking-widest mt-1 text-center leading-none"
                style={{ color: "rgba(255,255,255,0.30)" }}
              >
                {cell.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── AthleteIDBlock (URL copy + athlete ID) ─────────── */
interface AthleteIDBlockProps {
  username: string | null;
  athleteId: string;
  accent: string;
  urlCopied: boolean;
  onCopy: (e: React.MouseEvent) => void;
}

function AthleteIDBlock({ username, athleteId, accent, urlCopied, onCopy }: AthleteIDBlockProps) {
  return (
    <div className="flex-shrink-0 mx-4 mt-2">
      <button
        onClick={onCopy}
        className="w-full flex items-center justify-between rounded-lg px-3.5 py-2.5 group transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.055)",
        }}
        aria-label="Copy profile URL"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* ID chip */}
          <span
            className="flex-shrink-0 text-[7.5px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded"
            style={{
              color: `${accent}70`,
              background: `${accent}10`,
              border: `1px solid ${accent}20`,
            }}
          >
            {athleteId}
          </span>
          {/* URL */}
          <span
            className="text-[10.5px] font-medium truncate"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            athleteos.app/{username}
          </span>
        </div>
        <span className="flex-shrink-0 ml-2">
          {urlCopied ? (
            <CheckIcon className="h-3 w-3" style={{ color: accent }} />
          ) : (
            <Copy className="h-3 w-3 text-white/20 group-hover:text-white/45 transition-colors" />
          )}
        </span>
      </button>
    </div>
  );
}

/* ── FlipCTA ─────────────────────────────────────────── */
interface FlipCTAProps {
  accent: string;
  hintVisible: boolean;
}

function FlipCTA({ accent, hintVisible }: FlipCTAProps) {
  return (
    <div className="flex items-center justify-center py-2 px-4 flex-shrink-0">
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 group-hover:scale-[1.03] ${
          hintVisible ? "flip-hint-pulse" : "opacity-40"
        }`}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: `0 2px 16px rgba(0,0,0,0.25), 0 0 20px ${accent}12`,
        }}
      >
        <RotateCcw
          className="h-3 w-3 transition-transform duration-500 group-hover:-rotate-[135deg]"
          style={{ color: accent }}
        />
        <span
          className="text-[9px] font-black tracking-[0.18em] uppercase"
          style={{ color: "rgba(255,255,255,0.80)" }}
        >
          Tap card to flip
        </span>
        <span
          className="h-1.5 w-1.5 rounded-full animate-ping ml-0.5"
          style={{ backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENTS — BACK FACE
══════════════════════════════════════════════════════════ */

/* ── BackHeader ───────────────────────────────────────── */
interface BackHeaderProps {
  avatarUrl: string | null;
  displayName: string;
  sport: string | null;
  position: string | null;
  school: string | null;
  isVerified: boolean;
  isPro: boolean;
  initials: string;
  accent: string;
}

function BackHeader({
  avatarUrl,
  displayName,
  sport,
  position,
  school,
  isVerified,
  isPro,
  initials,
  accent,
}: BackHeaderProps) {
  const metaParts = [position, sport, school].filter(Boolean);

  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
      {/* Avatar + name */}
      <div className="flex items-center gap-2.5 min-w-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={34}
            height={34}
            className="h-[34px] w-[34px] rounded-full object-cover flex-shrink-0"
            style={{ border: `2px solid ${accent}30` }}
            draggable={false}
            unoptimized
          />
        ) : (
          <div
            className="h-[34px] w-[34px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `${accent}12`,
              border: `2px solid ${accent}28`,
            }}
          >
            <span
              className="text-[10px] font-black"
              style={{ color: `${accent}70` }}
            >
              {initials}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p
              className="text-[13px] font-black text-white truncate leading-tight"
              style={{ letterSpacing: "-0.02em" }}
            >
              {displayName}
            </p>
            {(isVerified || isPro) && (
              <Image
                src="/verified.gif"
                alt="Verified Athlete"
                width={36}
                height={36}
                className="flex-shrink-0 h-[26px] w-[26px] align-middle"
                unoptimized
              />
            )}
          </div>
          {metaParts.length > 0 && (
            <p
              className="text-[9px] font-medium truncate leading-tight"
              style={{ color: "rgba(255,255,255,0.28)" }}
              title={metaParts.join(" · ")}
            >
              {metaParts.join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Flip back affordance */}
      <div
        className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1.5 rounded-full cursor-pointer transition-all duration-200 hover:border-white/20"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
        }}
        role="button"
        aria-label="Flip card back"
      >
        <RotateCcw className="h-3 w-3" style={{ color: accent }} />
        <span className="text-[8.5px] font-black tracking-wider text-white/60 uppercase">
          Flip Back
        </span>
      </div>
    </div>
  );
}

/* ── AboutSection ─────────────────────────────────────── */
function AboutSection({ bio, accent }: { bio: string; accent: string }) {
  return (
    <div>
      <SectionLabel icon={<Sparkles className="h-2.5 w-2.5" />} label="About" accent={accent} />
      <p
        className="text-[11px] leading-[1.75] line-clamp-4"
        style={{
          color: "rgba(255,255,255,0.72)",
          overflowWrap: "break-word",
          wordBreak: "break-word",
        }}
      >
        {sanitize(bio)}
      </p>
    </div>
  );
}

/* ── SectionLabel ─────────────────────────────────────── */
function SectionLabel({
  icon,
  label,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span style={{ color: accent }}>{icon}</span>
      <span
        className="text-[8.5px] font-black uppercase tracking-widest"
        style={{ color: "rgba(255, 255, 255, 0.85)" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── LinksSection ─────────────────────────────────────── */
interface LinksSectionProps {
  links: { label: string; url: string }[];
  accent: string;
  expanded: boolean;
  onToggle: () => void;
  maxVisible: number;
  onLinkClick: (label: string, url: string) => void;
  onInteract: () => void;
}

function LinksSection({
  links,
  accent,
  expanded,
  onToggle,
  maxVisible,
  onLinkClick,
  onInteract,
}: LinksSectionProps) {
  const displayed = expanded ? links : links.slice(0, maxVisible);

  return (
    <div>
      <SectionLabel
        icon={<ExternalLink className="h-2.5 w-2.5" />}
        label="Links"
        accent={accent}
      />
      <div className="space-y-1.5">
        {displayed.map((link) => {
          let domain = "";
          try {
            domain = new URL(link.url).hostname.replace("www.", "");
          } catch { /* */ }
          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                onInteract();
                onLinkClick(link.label, link.url);
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.065)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = `${accent}0d`;
                (e.currentTarget as HTMLAnchorElement).style.borderColor = `${accent}28`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.025)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.065)";
              }}
            >
              {/* Color bar */}
              <div
                className="w-0.5 self-stretch rounded-full flex-shrink-0"
                style={{
                  background: `linear-gradient(to bottom, ${accent}70, ${accent}18)`,
                }}
              />
              <div className="flex-1 min-w-0">
                <div
                  className="text-[11px] font-semibold truncate leading-tight"
                  style={{ color: "rgba(255,255,255,0.88)" }}
                >
                  {sanitize(link.label)}
                </div>
                {domain && (
                  <div
                    className="text-[9px] truncate mt-0.5 leading-tight"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {domain}
                  </div>
                )}
              </div>
              <div
                className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{ background: `${accent}14` }}
              >
                <ChevronRight className="h-2.5 w-2.5" style={{ color: `${accent}70` }} />
              </div>
            </a>
          );
        })}

        {links.length > maxVisible && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInteract();
              onToggle();
            }}
            className="w-full flex items-center justify-center gap-1 py-1.5 transition-colors"
            style={{ color: `${accent}65` }}
          >
            <ChevronDown
              className="h-3 w-3 transition-transform duration-300"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">
              {expanded ? "Show less" : `Show all ${links.length}`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── HighlightsSection ──────────────────────────────── */
interface HighlightsSectionProps {
  highlights: { title: string; url: string }[];
  accent: string;
  profileId: string;
  onInteract: () => void;
}

function HighlightsSection({ highlights, accent, profileId, onInteract }: HighlightsSectionProps) {
  return (
    <div>
      <SectionLabel
        icon={<Play className="h-2.5 w-2.5" />}
        label="Highlights"
        accent={accent}
      />
      <div className="flex flex-wrap gap-2">
        {highlights.map((h, i) => (
          <a
            key={i}
            href={h.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              onInteract();
              trackLinkClick(profileId, h.title || `Highlight ${i + 1}`, h.url);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              background: `${accent}0e`,
              border: `1px solid ${accent}1e`,
            }}
          >
            <Play
              className="h-2.5 w-2.5 flex-shrink-0"
              style={{ color: accent }}
              fill={accent}
            />
            <span
              className="text-[10px] font-semibold truncate max-w-[100px]"
              style={{ color: "rgba(255, 255, 255, 0.85)" }}
            >
              {sanitize(h.title) || `Highlight ${i + 1}`}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ── ConnectSection ───────────────────────────────────── */
interface ConnectSectionProps {
  socialLinks: { key: string; Icon: React.ElementType; href: string; color: string; label: string }[];
  publicUrl: string;
  displayName: string;
  bio: string | null;
  accent: string;
  onInteract: () => void;
}

function ConnectSection({ socialLinks, publicUrl, displayName, bio, accent, onInteract }: ConnectSectionProps) {
  if (socialLinks.length === 0) return null;

  return (
    <div>
      <SectionLabel icon={<Heart className="h-2.5 w-2.5" />} label="Connect" accent={accent} />
      <div className="flex flex-wrap items-center gap-2">
        {socialLinks.map(({ key, Icon, href, color, label }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            onClick={(e) => {
              e.stopPropagation();
              onInteract();
            }}
            className="social-icon-btn h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              "--social-color": color,
            } as React.CSSProperties}
          >
            <Icon className="h-3.5 w-3.5 text-white/30" />
          </a>
        ))}
        {/* Separator + share buttons */}
        <div className="flex items-center gap-2 ml-1">
          <div className="h-4 w-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <ShareButtons
            url={publicUrl}
            title={`${displayName} on AthleteOS`}
            description={bio || `Check out ${displayName}'s athlete card`}
          />
        </div>
      </div>
    </div>
  );
}

/* ── ContactModal ─────────────────────────────────────── */
interface ContactModalProps {
  profile: Profile;
  accent: string;
  onClose: () => void;
  copiedEmail: boolean;
  copiedPhone: boolean;
  onCopyEmail: () => void;
  onCopyPhone: () => void;
}

function ContactModal({
  profile,
  accent,
  onClose,
  copiedEmail,
  copiedPhone,
  onCopyEmail,
  onCopyPhone,
}: ContactModalProps) {
  const contactEmail = profile.contact_email || profile.email;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-30 flex flex-col justify-between p-5 rounded-[18.5px]"
      style={{
        background: "rgba(10,10,14,0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" style={{ color: accent }} />
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">
              Contact Details
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close contact details"
            className="h-6 w-6 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.40)",
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Email */}
          <div
            className="rounded-xl p-3 space-y-2"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
              Email Address
            </p>
            <p className="text-[11px] font-semibold truncate leading-none py-0.5" style={{ color: "rgba(255,255,255,0.80)" }}>
              {contactEmail}
            </p>
            <div className="flex gap-2">
              <a
                href={`mailto:${contactEmail}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-black"
                style={{ background: accent, color: "#0a0a0e" }}
              >
                <Mail className="h-3 w-3" /> Email
              </a>
              <button
                onClick={onCopyEmail}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-black transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {copiedEmail ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Phone */}
          {profile.contact_phone?.trim() && (
            <div
              className="rounded-xl p-3 space-y-2"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
                Phone Number
              </p>
              <p className="text-[11px] font-semibold truncate leading-none py-0.5" style={{ color: "rgba(255,255,255,0.80)" }}>
                {profile.contact_phone}
              </p>
              <div className="flex gap-2">
                <a
                  href={`tel:${profile.contact_phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-black"
                  style={{ background: accent, color: "#0a0a0e" }}
                >
                  <Phone className="h-3 w-3" /> Call
                </a>
                <button
                  onClick={onCopyPhone}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-black transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  {copiedPhone ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          color: "rgba(255,255,255,0.45)",
        }}
      >
        Close
      </button>
    </motion.div>
  );
}

/* ── BusinessBlock (Monetization architecture boundary) ── */
/**
 * Architecture placeholder for future monetization blocks.
 * This component defines the boundary for:
 *   - Sponsorship inquiries
 *   - Bookings
 *   - Tips / support
 *   - Paid links
 *   - Shoutouts
 *   - Digital offers
 * Currently surfaces via AthleteBusiness (Inquiry + Tip).
 * Each block will eventually be togglable by the athlete.
 */
interface BusinessBlockProps {
  profileId: string;
  displayName: string;
  accent: string;
  hasContact: boolean;
  onContactOpen: () => void;
  onInquiryOpen: () => void;
  onInteract: () => void;
}

function BusinessBlock({
  profileId,
  displayName,
  accent,
  hasContact,
  onContactOpen,
  onInquiryOpen,
  onInteract,
}: BusinessBlockProps) {
  return (
    <div className="flex flex-col gap-2 w-full px-4 pb-2 pt-2 flex-shrink-0">
      {/* Sponsor / business affordance label */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <Briefcase className="h-2.5 w-2.5" style={{ color: `${accent}40` }} />
        <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: `${accent}35` }}>
          Partnership &amp; Inquiries
        </span>
      </div>

      {/* CTA row */}
      <div className="flex gap-2 w-full">
        {hasContact && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInteract();
              onContactOpen();
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[11.5px] font-black tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            Contact
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInteract();
            onInquiryOpen();
          }}
          className={`${hasContact ? "flex-1" : "w-full"} flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[11.5px] font-black tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]`}
          style={{
            background: `${accent}15`,
            border: `1px solid ${accent}30`,
            color: accent,
          }}
        >
          <Send className="h-3.5 w-3.5 flex-shrink-0" />
          Send Inquiry
        </button>
      </div>

      {/* Tip / support — existing TipButton integration preserved */}
      <div onClick={(e) => { e.stopPropagation(); onInteract(); }}>
        <TipButton
          athleteId={profileId}
          athleteName={displayName}
          accentColor={accent}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REFLECTIVE CARD SHELL
   ─────────────────────────────────────────────────────
   Themeable card material layer. Controls:
   • surface color
   • rotating glow border track
   • noise texture overlay
   • shadow system
   • border radius
   
   Future themes can modify these values without touching
   the inner content components.
══════════════════════════════════════════════════════════ */

interface ReflectiveCardShellProps {
  accent: string;
  borderGlow?: string;
  children: React.ReactNode;
  /** Which face: 'front' is visible, 'back' is rotateY(180deg) */
  face: "front" | "back";
  flipped: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  onMouseMove?: () => void;
  onTouchStart?: () => void;
}

function ReflectiveCardShell({
  accent,
  borderGlow,
  children,
  face,
  flipped,
  onClick,
  className = "",
  style = {},
  onMouseMove,
  onTouchStart,
}: ReflectiveCardShellProps) {
  const isFront = face === "front";
  const isActive = isFront ? !flipped : flipped;

  const boxShadow = borderGlow
    ? `${borderGlow}, 0 20px 60px -16px rgba(0,0,0,0.6)`
    : `
        0 0 0 1px rgba(255,255,255,0.035),
        0 2px 4px rgba(0,0,0,0.20),
        0 20px 60px -16px rgba(0,0,0,0.60)
      `;

  return (
    <div
      className={`flip-card-face ${face === "back" ? "flip-card-back" : ""} flex flex-col ${className}`}
      style={{
        width: "100%",
        height: "100%",
        boxShadow,
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
        zIndex: isActive ? 1 : 0,
        transition: "opacity 0.3s ease",
        "--accent-glow": accent,
        ...style,
      } as React.CSSProperties}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onTouchStart={onTouchStart}
    >
      {/* Glow border container */}
      <div className="glow-border-container flex flex-col w-full h-full">
        {/* Rotating light track */}
        <div className="glow-border-track" />

        {/* Inner card surface */}
        <div
          className="w-full h-full flex flex-col rounded-[18.5px] overflow-hidden relative z-10"
          style={{ background: "#0d0d12" }}
        >
          {/* Top accent hairline */}
          <div
            className="absolute top-0 inset-x-0 h-px z-20 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent 5%, ${accent}35 50%, transparent 95%)`,
            }}
          />

          {/* Noise grain — premium material texture */}
          <div
            className="absolute inset-0 pointer-events-none z-10 rounded-[18.5px]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "128px 128px",
              mixBlendMode: "overlay",
              opacity: 0.022,
            }}
          />

          {children}

          {/* Bottom accent hairline */}
          <div
            className="absolute bottom-0 inset-x-0 h-px z-20 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent 10%, ${accent}20 50%, transparent 90%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT COMPONENT — ProfileCard (exported)
══════════════════════════════════════════════════════════ */

export function ProfileCard({
  profile,
  totalViews = 0,
  totalFollowers = 0,
  nilScore = null,
}: {
  profile: Profile;
  totalViews?: number;
  totalFollowers?: number;
  nilScore?: number | null;
}) {
  /* ── State ──────────────────────────────────────── */
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [linksExpanded, setLinksExpanded] = useState(false);
  const [showTipSuccess, setShowTipSuccess] = useState(false);
  const searchParams = useSearchParams();
  const autoReturnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackedRef = useRef(false);
  /** Shared webcam stream between front and back ReflectiveCard instances */
  const webcamStreamRef = useRef<MediaStream | null>(null);

  /* ── Analytics ──────────────────────────────────── */
  useEffect(() => {
    if (!trackedRef.current) {
      trackView(profile.id);
      trackedRef.current = true;
    }
  }, [profile.id]);

  useEffect(() => {
    if (searchParams?.get("tip") === "success") {
      setShowTipSuccess(true);
      import("canvas-confetti").then((mod) => {
        mod.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }).catch(() => {});
    }
  }, [searchParams]);

  /* ── Derived data ───────────────────────────────── */
  const themeObj = resolveTheme(profile.theme_accent);
  const accent = themeObj.primaryColor;

  const displayName = cleanName(profile.full_name, profile.username);
  const firstName = displayName.split(" ")[0];
  const publicUrl = typeof window === "undefined" ? "" : window.location.href;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const athleteId = formatAthleteId(profile.username);

  const photos: string[] = [profile.avatar_url].filter(Boolean) as string[];
  const hasMultiplePhotos = photos.length > 1;

  const plan = resolvePlan(profile.plan, profile.extended_pro_until);
  const isPro = plan === "pro";
  const isVerified = profile.is_verified || isPro;

  const classLabel =
    profile.class_year?.toLowerCase() === "freshman"  ? "FR" :
    profile.class_year?.toLowerCase() === "sophomore" ? "SO" :
    profile.class_year?.toLowerCase() === "junior"    ? "JR" :
    profile.class_year?.toLowerCase() === "senior"    ? "SR" : null;

  /* Stats filtering */
  const PLACEHOLDER_RE = /^(test|asdf|foo|bar|baz|aaa|123|000|xxx|yyy|zzz|na|n\/a|none|sample|demo|example|temp|placeholder)$/i;
  const cleanStats = (profile.stats ?? []).filter((s) => {
    if (!s.label?.trim() || !s.value?.trim()) return false;
    const l = s.label.trim().toLowerCase();
    const v = s.value.trim();
    if (/^(.)\1+$/.test(l) && l.length > 2) return false;
    if (/^(.)\1+$/.test(v) && v.length > 2) return false;
    if (v.length > 50) return false;
    if (PLACEHOLDER_RE.test(l) || PLACEHOLDER_RE.test(v)) return false;
    return true;
  }).slice(0, 3);

  const statCells: StatCell[] = [
    ...(nilScore !== null && nilScore > 0
      ? [{ key: "nil", label: "NIL", value: String(nilScore), isAccent: true }]
      : []),
    ...cleanStats.map((s) => ({ key: s.label, label: sanitize(s.label), value: s.value, isAccent: false })),
  ];

  const links = (profile.links ?? []).slice(0, 6);
  const MAX_VISIBLE_LINKS = 2;
  const highlights = (profile.highlights ?? []).slice(0, 6);

  const hasValidBio =
    profile.bio &&
    profile.bio.trim().length > 15 &&
    !/^(.)\1+$/.test(profile.bio.trim()) &&
    !profile.bio.includes("@") &&
    !/^[a-z]{2,6}$/i.test(profile.bio.trim());

  const socialLinks = SOCIAL_MAP
    .filter((s) => profile.social?.[s.key as keyof typeof profile.social])
    .map((s) => ({
      ...s,
      href: s.prefix + encodeURIComponent(profile.social![s.key as keyof typeof profile.social]!),
    }));

  const hasContact = Boolean(profile.contact_email?.trim() || profile.contact_phone?.trim());

  /* ── Photo carousel ─────────────────────────────── */
  useEffect(() => {
    if (!hasMultiplePhotos) return;
    const id = setInterval(() => {
      setPhotoIdx((p) => (p + 1) % photos.length);
    }, PHOTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasMultiplePhotos, photos.length]);

  /* ── Auto-return ────────────────────────────────── */
  const startAutoReturn = useCallback(() => {
    if (autoReturnRef.current) clearTimeout(autoReturnRef.current);
    autoReturnRef.current = setTimeout(() => setFlipped(false), AUTO_RETURN_MS);
  }, []);

  const resetAutoReturn = useCallback(() => {
    if (!flipped) return;
    startAutoReturn();
  }, [flipped, startAutoReturn]);

  useEffect(() => {
    if (flipped) {
      startAutoReturn();
    } else {
      if (autoReturnRef.current) clearTimeout(autoReturnRef.current);
    }
    return () => {
      if (autoReturnRef.current) clearTimeout(autoReturnRef.current);
    };
  }, [flipped, startAutoReturn]);

  /* ── Handlers ───────────────────────────────────── */
  function handleFlip() {
    setFlipped((f) => !f);
    if (hintVisible) setHintVisible(false);
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    trackFunnel("public_card_share", { username: profile.username });
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on AthleteOS`,
          text: `${displayName}'s AthleteOS card`,
          url: publicUrl,
        });
      } catch { /* */ }
    } else {
      try {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch { /* */ }
    }
  }

  async function handleCopyUrl(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`https://athleteos.app/${profile.username}`);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 1500);
    } catch { /* */ }
  }

  function stopPropAndReset(e: React.MouseEvent) {
    e.stopPropagation();
    resetAutoReturn();
  }

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="min-h-dvh w-full flex items-center justify-center select-none p-4 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 70% 60% at 50% -5%, #111116, #07070a 60%)",
      }}
    >
      {/* Ambient glow behind card */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: "640px",
          height: "640px",
          background: `radial-gradient(circle, ${accent}07 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
        aria-hidden
      />

      {/* 3D perspective container */}
      <div
        style={{
          perspective: "1100px",
          width: `min(${CARD_W}px, calc(100vw - 32px))`,
          aspectRatio: "360 / 600",
          maxHeight: "min(600px, calc(100dvh - 32px))",
        }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 270, damping: 30, mass: 0.85 }}
          onClick={handleFlip}
          className="relative w-full h-full cursor-pointer group"
          style={{ transformStyle: "preserve-3d", borderRadius: "20px" }}
          role="button"
          aria-label={flipped ? "Flip card to front" : "Flip card to see more"}
          aria-pressed={flipped}
        >

          {/* ═══════════════════════════════════════════
              FRONT FACE
          ═══════════════════════════════════════════ */}
          <div
            className="flip-card-face flex flex-col"
            style={{
              opacity: flipped ? 0 : 1,
              pointerEvents: flipped ? "none" : "auto",
              zIndex: flipped ? 0 : 1,
              transition: "opacity 0.32s ease",
            }}
          >
            <BorderGlow
              edgeSensitivity={30}
              glowColor="78 100 62"
              backgroundColor="#0d0d12"
              borderRadius={20}
              glowRadius={40}
              glowIntensity={1.2}
              coneSpread={25}
              animated={true}
              colors={['#C6FF3D', '#a5d933', '#85b029']}
              className="w-full h-full"
            >
              <ReflectiveCard
              blurStrength={11}
              metalness={0.88}
              roughness={0.38}
              displacementStrength={22}
              noiseScale={1.1}
              specularConstant={1.4}
              grayscale={0.92}
              glassDistortion={8}
              overlayColor="rgba(0, 0, 0, 0.20)"
              radius={20}
              filterId="rc-filter-front"
              streamRef={webcamStreamRef}
              style={{
                width: "100%",
                height: "100%",
                "--rc-accent-glow": `${accent}1f`,
                "--rc-accent-glow-hover": `${accent}40`,
              } as React.CSSProperties}
            >
              {/* Top accent hairline */}
              <div
                className="absolute top-0 inset-x-0 h-px z-20 pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent 5%, ${accent}40 50%, transparent 95%)` }}
              />

              {/* Photo hero */}
              <AthletePhoto
                photos={photos}
                photoIdx={photoIdx}
                displayName={displayName}
                initials={initials}
                accent={accent}
                sport={profile.sport}
              />





              {/* Identity */}
              <AthleteIdentity
                displayName={displayName}
                sport={profile.sport}
                position={profile.position}
                school={profile.school}
                classLabel={classLabel}
                isVerified={isVerified}
                isPro={isPro}
                accent={accent}
                plan={plan}
                onQr={(e) => { e.stopPropagation(); setShowQr(true); }}
                onShare={handleShare}
                copied={copied}
              />



              {/* Stats strip */}
              <AthleteStats cells={statCells} accent={accent} />

              {/* Bottom spacing to keep stats block off the card border */}
              <div className="h-6" />





              {/* Bottom accent hairline */}
              <div
                className="absolute bottom-0 inset-x-0 h-px z-20 pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent 10%, ${accent}22 50%, transparent 90%)` }}
              />
              </ReflectiveCard>
            </BorderGlow>
          </div>

          {/* ═══════════════════════════════════════════
              BACK FACE
          ═══════════════════════════════════════════ */}
          <div
            className="flip-card-face flip-card-back flex flex-col"
            style={{
              opacity: flipped ? 1 : 0,
              pointerEvents: flipped ? "auto" : "none",
              zIndex: flipped ? 1 : 0,
              transition: "opacity 0.32s ease",
            }}
            onMouseMove={resetAutoReturn}
            onTouchStart={resetAutoReturn}
          >
            <BorderGlow
              edgeSensitivity={30}
              glowColor="78 100 62"
              backgroundColor="#0d0d12"
              borderRadius={20}
              glowRadius={40}
              glowIntensity={1.2}
              coneSpread={25}
              animated={true}
              colors={['#C6FF3D', '#a5d933', '#85b029']}
              className="w-full h-full"
            >
              <ReflectiveCard
              blurStrength={11}
              metalness={0.88}
              roughness={0.38}
              displacementStrength={22}
              noiseScale={1.1}
              specularConstant={1.4}
              grayscale={0.92}
              glassDistortion={8}
              overlayColor="rgba(0, 0, 0, 0.20)"
              radius={20}
              filterId="rc-filter-back"
              streamRef={webcamStreamRef}
              style={{
                width: "100%",
                height: "100%",
                "--rc-accent-glow": `${accent}1f`,
                "--rc-accent-glow-hover": `${accent}40`,
              } as React.CSSProperties}
            >
            {/* Contact modal overlay */}
            <AnimatePresence>
              {showContactModal && (
                <ContactModal
                  profile={profile}
                  accent={accent}
                  onClose={() => setShowContactModal(false)}
                  copiedEmail={copiedEmail}
                  copiedPhone={copiedPhone}
                  onCopyEmail={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        profile.contact_email || profile.email
                      );
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    } catch { /* */ }
                  }}
                  onCopyPhone={async () => {
                    try {
                      await navigator.clipboard.writeText(profile.contact_phone || "");
                      setCopiedPhone(true);
                      setTimeout(() => setCopiedPhone(false), 2000);
                    } catch { /* */ }
                  }}
                />
              )}
            </AnimatePresence>

            {/* Back header */}
            <BackHeader
              avatarUrl={profile.avatar_url}
              displayName={displayName}
              sport={profile.sport}
              position={profile.position}
              school={profile.school}
              isVerified={isVerified}
              isPro={isPro}
              initials={initials}
              accent={accent}
            />

            {/* Divider */}
            <div
              className="mx-4 h-px flex-shrink-0"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent}18, transparent)`,
              }}
            />

            {/* Scrollable content area */}
            <div
              className="flex-1 overflow-y-auto scrollbar-none px-4 pt-3.5 pb-4 space-y-3.5"
              onClick={stopPropAndReset}
              data-lenis-prevent
            >
              {hasValidBio && (
                <AboutSection bio={profile.bio!} accent={accent} />
              )}

              {links.length > 0 && (
                <LinksSection
                  links={links}
                  accent={accent}
                  expanded={linksExpanded}
                  onToggle={() => setLinksExpanded((v) => !v)}
                  maxVisible={MAX_VISIBLE_LINKS}
                  onLinkClick={(label, url) => trackLinkClick(profile.id, label, url)}
                  onInteract={resetAutoReturn}
                />
              )}

              {highlights.length > 0 && (
                <HighlightsSection
                  highlights={highlights}
                  accent={accent}
                  profileId={profile.id}
                  onInteract={resetAutoReturn}
                />
              )}

              {socialLinks.length > 0 && (
                <ConnectSection
                  socialLinks={socialLinks}
                  publicUrl={publicUrl}
                  displayName={displayName}
                  bio={profile.bio}
                  accent={accent}
                  onInteract={resetAutoReturn}
                />
              )}
            </div>

            {/* Business / actions block */}
            <div
              className="flex-shrink-0"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.04)",
                background: "rgba(0,0,0,0.08)",
              }}
              onClick={stopPropAndReset}
            >
              <BusinessBlock
                profileId={profile.id}
                displayName={displayName}
                accent={accent}
                hasContact={hasContact}
                onContactOpen={() => setShowContactModal(true)}
                onInquiryOpen={() => setShowInquiry(true)}
                onInteract={resetAutoReturn}
              />
            </div>

            {/* Powered by footer */}
            <div
              className="flex items-center justify-center gap-1.5 py-1.5 flex-shrink-0"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.03)",
                background: "rgba(0,0,0,0.10)",
              }}
            >
              <span className="text-[7px] font-bold tracking-[0.28em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
                Powered by
              </span>
              <Logo className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: `${accent}35` }} />
              <span className="text-[7px] font-bold tracking-[0.28em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
                AthleteOS
              </span>
            </div>
              </ReflectiveCard>
            </BorderGlow>
          </div>

        </motion.div>
      </div>

      {/* ── Global Modals ───────────────────────────── */}
      <QrShareModal url={publicUrl} open={showQr} onClose={() => setShowQr(false)} />
      <InquiryForm
        athleteId={profile.id}
        athleteName={displayName}
        open={showInquiry}
        onClose={() => setShowInquiry(false)}
      />

      {/* Tip success modal */}
      <AnimatePresence>
        {showTipSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.88)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
            onClick={() => setShowTipSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl relative"
              style={{
                background: "#0d0d12",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <button
                onClick={() => setShowTipSuccess(false)}
                aria-label="Close"
                className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: `${accent}14`, border: `1px solid ${accent}28` }}
              >
                <Heart className="h-7 w-7" style={{ color: accent }} fill="currentColor" />
              </div>
              <h3 className="text-xl font-black text-white">Thank You!</h3>
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                Your tip for{" "}
                <span className="font-semibold text-white">{firstName}</span> has been
                processed. Your support powers their athletic journey!
              </p>
              <button
                onClick={() => setShowTipSuccess(false)}
                className="mt-6 w-full rounded-2xl py-3 text-xs font-black transition-all hover:brightness-110"
                style={{ backgroundColor: accent, color: "#0a0a0e" }}
              >
                Back to Profile
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
