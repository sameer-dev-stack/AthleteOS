"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Share2, Check as CheckIcon, Copy, Mail, Send,
  Instagram, Twitter, Youtube, Music2,
  Star, Play, RotateCcw,
  GraduationCap, Timer, Trophy, Target,
  TrendingUp, Percent, Zap, Medal,
  Heart, Sparkles, ExternalLink, ChevronRight,
  X, Phone, QrCode, Eye, Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Profile } from "@/lib/actions/profile";
import { TipButton } from "@/components/tip-button";
import { InquiryForm } from "@/components/inquiry-form";
import { trackView, trackLinkClick } from "@/lib/actions/analytics";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";
import { Logo } from "@/components/logo";
import { resolvePlan } from "@/lib/referral-reward";
import { ShareButtons } from "@/components/share-buttons";
import { QrShareModal } from "@/components/dashboard/qr-share-modal";
import { CARD_W, CARD_H } from "@/lib/constants";
import { cleanName } from "@/lib/display-name";

/* ── Constants ───────────────────────────────────────── */

const AUTO_RETURN_MS = 10_000;
const PHOTO_INTERVAL_MS = 4_000;

const STAT_ICONS: Record<string, React.ElementType> = {
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

const SOCIAL_MAP: { key: string; Icon: React.ElementType; prefix: string; color: string }[] = [
  { key: "instagram", Icon: Instagram, prefix: "https://instagram.com/", color: "#E4405F" },
  { key: "twitter", Icon: Twitter, prefix: "https://x.com/", color: "#1DA1F2" },
  { key: "tiktok", Icon: Music2, prefix: "https://tiktok.com/@", color: "#00F2EA" },
  { key: "youtube", Icon: Youtube, prefix: "https://youtube.com/@", color: "#FF0000" },
];

/* ── Helpers ─────────────────────────────────────────── */

function sanitize(t: string | null): string {
  if (!t) return "";
  return t.replace(/\\\\/g, "\0").replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\0/g, "\\");
}

/* ── Component ───────────────────────────────────────── */

export function ProfileCard({ profile, totalViews = 0, totalFollowers = 0, nilScore = null }: { profile: Profile; totalViews?: number; totalFollowers?: number; nilScore?: number | null }) {
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [linksExpanded, setLinksExpanded] = useState(false);
  const autoReturnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!trackedRef.current) {
      trackView(profile.id);
      trackedRef.current = true;
    }
  }, [profile.id]);

  const accent = profile.theme_accent || "#C6FF3D";
  const displayName = cleanName(profile.full_name, profile.username);
  const firstName = displayName.split(" ")[0];
  const publicUrl = typeof window === "undefined" ? "" : window.location.href;

  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const photos: string[] = [profile.avatar_url].filter(Boolean) as string[];
  const hasMultiplePhotos = photos.length > 1;

  const PLACEHOLDER_STATS = /^(test|asdf|foo|bar|baz|aaa|123|000|xxx|yyy|zzz|na|n\/a|none|sample|demo|example|temp|placeholder)$/i;
  const stats = (profile.stats ?? []).filter(s => {
    if (!s.label?.trim() || !s.value?.trim()) return false;
    const l = s.label.trim().toLowerCase();
    const v = s.value.trim();
    if (/^(.)\1+$/.test(l) && l.length > 2) return false;
    if (/^(.)\1+$/.test(v) && v.length > 2) return false;
    if (v.length > 50) return false;
    if (PLACEHOLDER_STATS.test(l) || PLACEHOLDER_STATS.test(v)) return false;
    return true;
  }).slice(0, 3);

  const statCells = (nilScore !== null && nilScore > 0 ? 1 : 0) + stats.length;
  const cols = statCells === 1 ? "grid-cols-1" : "grid-cols-2";
  const cellBorder = (idx: number) =>
    `${idx === 1 || idx === 3 ? "border-l border-white/[0.07]" : ""}${idx >= 2 ? " border-t border-white/[0.07]" : ""}`.trim();

  const links = (profile.links ?? []).slice(0, 6);
  const maxVisibleLinks = 2;
  const displayedLinks = linksExpanded ? links : links.slice(0, maxVisibleLinks);
  const highlights = (profile.highlights ?? []).slice(0, 6);
  const hasValidBio = profile.bio && profile.bio.trim().length > 15 && !/^(.)\1+$/.test(profile.bio.trim()) && !profile.bio.includes("@") && !/^[a-z]{2,6}$/i.test(profile.bio.trim());

  const socialLinks = SOCIAL_MAP
    .filter(s => profile.social?.[s.key as keyof typeof profile.social])
    .map(s => ({
      ...s,
      href: s.prefix + encodeURIComponent(profile.social![s.key as keyof typeof profile.social]!),
    }));

  const hasContact = Boolean(profile.contact_email?.trim() || profile.contact_phone?.trim());

  const classLabel = profile.class_year?.toLowerCase() === "freshman" ? "FR" : profile.class_year?.toLowerCase() === "sophomore" ? "SO" : profile.class_year?.toLowerCase() === "junior" ? "JR" : profile.class_year?.toLowerCase() === "senior" ? "SR" : null;

  function getNilLabel(score: number): string {
    if (score > 80) return "Elite";
    if (score > 60) return "Strong";
    if (score > 40) return "Established";
    if (score > 20) return "Growing";
    return "Emerging";
  }

  /* ── Photo carousel ────────────────── */
  useEffect(() => {
    if (!hasMultiplePhotos) return;
    const id = setInterval(() => {
      setPhotoIdx(prev => (prev + 1) % photos.length);
    }, PHOTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasMultiplePhotos, photos.length]);

  /* ── Auto-return timer ─────────────── */
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
    return () => { if (autoReturnRef.current) clearTimeout(autoReturnRef.current); };
  }, [flipped, startAutoReturn]);

  /* ── Actions ───────────────────────── */
  function handleFlip() {
    setFlipped(f => !f);
    if (hintVisible) setHintVisible(false);
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    trackFunnel("public_card_share", { username: profile.username });
    if (navigator.share) {
      try { await navigator.share({ title: `${displayName} on AthleteOS`, text: `${displayName}'s AthleteOS card`, url: publicUrl }); } catch { /* */ }
    } else {
      try {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch { /* */ }
    }
  }

  function stopFlip(e: React.MouseEvent) { e.stopPropagation(); resetAutoReturn(); }

  /* ── Render ────────────────────────── */
  return (
    <div
      className="min-h-dvh w-full flex items-center justify-center select-none p-4 bg-gradient-to-b from-neutral-950 via-neutral-950 to-black relative overflow-hidden"
    >
      {/* Subtle radial background glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
        style={{ backgroundColor: `${accent}08` }}
      />

      {/* Perspective container */}
      <div
        style={{
          perspective: "1200px",
          width: `min(${CARD_W}px, calc(100vw - 32px))`,
          aspectRatio: `${CARD_W} / ${CARD_H}`,
          maxHeight: `min(${CARD_H}px, calc(100dvh - 32px))`,
        }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 32, mass: 0.8 }}
          onClick={handleFlip}
          className="relative w-full h-full cursor-pointer"
          style={{
            transformStyle: "preserve-3d",
            borderRadius: "20px",
          }}
        >
          {/* ════════════════════════════════════════════════════
              FRONT FACE
             ════════════════════════════════════════════════════ */}
          <div
            className="flip-card-face flex flex-col"
            style={{
              width: "100%",
              height: "100%",
              boxShadow: `
                0 0 0 1px rgba(255,255,255,0.03),
                0 2px 4px rgba(0,0,0,0.2),
                0 20px 60px -15px rgba(0,0,0,0.6)
              `,
              "--accent-glow": accent,
              opacity: flipped ? 0 : 1,
              pointerEvents: flipped ? "none" : "auto",
              zIndex: flipped ? 0 : 1,
              transition: "opacity 0.35s ease",
            } as React.CSSProperties}
          >
            {/* Inner border container */}
            <div className="glow-border-container flex flex-col w-full h-full">
              {/* Rotating sharp track */}
              <div className="glow-border-track" />

              {/* Card content container */}
              <div className="w-full h-full flex flex-col bg-[#111115] rounded-[18.5px] overflow-hidden relative z-10">
            {/* Top accent line */}
            <div
              className="absolute top-0 inset-x-0 h-px z-20"
              style={{ background: `linear-gradient(90deg, transparent 5%, ${accent}50 50%, transparent 95%)` }}
            />

            {/* Cover Image */}
            {profile.cover_url && (
              <div className="relative h-20 w-full flex-shrink-0 overflow-hidden">
                <Image
                  src={profile.cover_url}
                  alt="Cover"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111115]/60 to-[#111115]" />
              </div>
            )}

            {/* ── Photo Hero (66%) ─────────────────── */}
            <div className="relative flex-shrink-0" style={{ height: profile.cover_url ? "calc(52% - 80px)" : "52%" }}>
              {photos.length > 0 ? (
                <>
                  {photos.map((url, i) => (
                    <div
                      key={url}
                      className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                      style={{ opacity: i === photoIdx ? 1 : 0 }}
                    >
                      <Image
                        src={url}
                        alt={displayName}
                        fill
                        sizes="360px"
                        className="object-cover"
                        draggable={false}
                        unoptimized
                      />
                    </div>
                  ))}
                </>
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: `linear-gradient(160deg, ${accent}15 0%, #111115 100%)` }}
                >
                  <span className="text-6xl font-black" style={{ color: `${accent}25` }}>{initials}</span>
                </div>
              )}

              {/* Vignette */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 80% 60% at 50% 35%, transparent 40%, rgba(0,0,0,0.35) 100%)" }}
              />

              {/* Bottom fade into content area */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                  height: "50%",
                  background: "linear-gradient(to top, #111115 0%, #111115e0 25%, #11111560 55%, transparent 100%)",
                }}
              />

              {/* Top bar: logo + share + qr */}
              <div className="absolute top-3 inset-x-3 pt-1 flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  <Logo className="h-4.5 w-4.5 rounded-[3px]" style={{ backgroundColor: accent }} />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-white/80">AthleteOS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {resolvePlan(profile.plan, profile.extended_pro_until) !== "free" && (
                    <div
                      className="flex items-center gap-1 rounded-full pl-2 pr-2.5 h-7 backdrop-blur-md"
                      style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      <Star className="h-3 w-3" style={{ color: accent }} fill={accent} />
                      <span className="text-[9px] font-black tracking-wider" style={{ color: accent }}>
                        {resolvePlan(profile.plan, profile.extended_pro_until) === "pro" ? "Pro" : "Team"}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowQr(true); }}
                    className="h-7 w-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-110"
                    style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    <QrCode className="h-3 w-3 text-white/60" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="h-7 w-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 hover:scale-110"
                    style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    {copied ? (
                      <CheckIcon className="h-3 w-3" style={{ color: accent }} />
                    ) : (
                      <Share2 className="h-3 w-3 text-white/60" />
                    )}
                  </button>
                </div>
              </div>

              {/* Photo dots */}
              {hasMultiplePhotos && (
                <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
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

              {/* Plan badge overlay removed — Pro/Team now lives in the top bar */}
            </div>

            {/* ── Identity ─────────────────────────── */}
            <div className="flex-shrink-0 px-6 -mt-4 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-[26px] font-black tracking-[-0.03em] leading-none text-white truncate">
                    {displayName}
                  </h1>
                  {profile.is_verified && (
                    <span
                      className="flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ background: `${accent}18`, border: `1px solid ${accent}35` }}
                    >
                      <CheckIcon className="h-2.5 w-2.5" style={{ color: accent }} />
                    </span>
                  )}
                  {classLabel && (
                    <span className="flex-shrink-0 inline-flex items-center rounded-md px-1.5 py-1 text-[8px] font-bold tracking-widest uppercase text-white/50 bg-white/[0.05] border border-white/[0.10]">
                      {classLabel}
                    </span>
                  )}
                </div>

                <div className="text-[11.5px] text-white/45 font-medium truncate leading-none">
                  {[profile.sport, profile.position, profile.school].filter(Boolean).join("  ·  ")}
                </div>

                {(totalViews > 0 || totalFollowers > 0) && (
                  <div className="flex items-center gap-3">
                    {totalViews > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-white/35 font-medium">
                        <Eye className="h-3 w-3" style={{ color: `${accent}50` }} />
                        {totalViews.toLocaleString()} views
                      </span>
                    )}
                    {totalFollowers > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-white/35 font-medium">
                        <Users className="h-3 w-3" style={{ color: `${accent}50` }} />
                        {totalFollowers.toLocaleString()} followers
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Stats Grid (2x2) ─────────────────── */}
            {(stats.length > 0 || (nilScore !== null && nilScore > 0)) && (
              <div className="flex-shrink-0 mx-6 mt-4">
                <div
                  className={`grid ${cols} items-stretch rounded-xl overflow-hidden`}
                  style={{
                    background: "#17171b",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: "0 8px 24px -14px rgba(0,0,0,0.7)",
                  }}
                >
                  {nilScore !== null && nilScore > 0 && (
                    <div className={`flex flex-col items-center justify-center px-1.5 py-2 ${cellBorder(0)}`}>
                      <div className="flex items-center gap-1 mb-1.5">
                        <TrendingUp className="h-2.5 w-2.5" style={{ color: `${accent}55` }} />
                        <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: `${accent}50` }}>
                          NIL
                        </span>
                      </div>
                      <p className="text-[20px] font-black leading-none tracking-tight" style={{ color: accent }}>
                        {nilScore}
                      </p>
                      <p className="text-[7.5px] font-bold uppercase tracking-wider mt-1 text-white/40">
                        {getNilLabel(nilScore)}
                      </p>
                    </div>
                  )}
                  {stats.map((stat, i) => {
                    const Ic = STAT_ICONS[stat.label.toLowerCase()] || STAT_ICONS.default;
                    return (
                      <div
                        key={stat.label}
                        className={`flex flex-col items-center justify-center px-1.5 py-2 ${cellBorder((nilScore !== null && nilScore > 0 ? 1 : 0) + i)}`}
                      >
                        <div className="flex items-center gap-1 mb-1.5">
                          <Ic className="h-2.5 w-2.5 flex-shrink-0" style={{ color: `${accent}50` }} />
                          <span className="text-[8px] font-bold uppercase tracking-wide text-white/45 text-center leading-tight line-clamp-2">
                            {sanitize(stat.label)}
                          </span>
                        </div>
                        <p className="text-[20px] font-black leading-none tracking-tight" style={{ color: accent }}>
                          {stat.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Flip Hint Strip ──────────────────── */}
            <div className="mt-auto flex items-center justify-center gap-2 py-2.5 px-4">
              <div className={`flex items-center gap-1.5 transition-opacity duration-500 ${hintVisible ? "flip-hint-pulse" : "opacity-30"}`}>
                <RotateCcw className="h-3 w-3 text-white/50" />
                <span className="text-[9px] font-bold tracking-widest uppercase text-white/50">
                  Tap to see more
                </span>
              </div>
            </div>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 inset-x-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent 10%, ${accent}30 50%, transparent 90%)` }}
                />
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════
              BACK FACE
             ════════════════════════════════════════════════════ */}
          <div
            className="flip-card-face flip-card-back flex flex-col"
            style={{
              width: "100%",
              height: "100%",
              boxShadow: `
                0 0 0 1px rgba(255,255,255,0.03),
                0 2px 4px rgba(0,0,0,0.2),
                0 20px 60px -15px rgba(0,0,0,0.6)
              `,
              "--accent-glow": accent,
              opacity: flipped ? 1 : 0,
              pointerEvents: flipped ? "auto" : "none",
              zIndex: flipped ? 1 : 0,
              transition: "opacity 0.35s ease",
            } as React.CSSProperties}
            onMouseMove={resetAutoReturn}
            onTouchStart={resetAutoReturn}
          >
            {/* Inner border container */}
            <div className="glow-border-container flex flex-col w-full h-full">
              {/* Rotating sharp track */}
              <div className="glow-border-track" />

              {/* Card content container */}
              <div className="w-full h-full flex flex-col bg-[#111115] rounded-[18.5px] overflow-hidden relative z-10">
                {/* Contact Modal Overlay */}
                <AnimatePresence>
                  {showContactModal && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      onClick={(e) => { e.stopPropagation(); }}
                      className="absolute inset-0 z-30 bg-[#0D0D10]/95 backdrop-blur-md p-5 flex flex-col justify-between rounded-[18.5px]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" style={{ color: accent }} />
                            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Contact Details</h3>
                          </div>
                          <button
                            onClick={() => setShowContactModal(false)}
                            className="h-6 w-6 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {/* Email section */}
                          <div className="rounded-xl p-3 border border-white/[0.05] bg-white/[0.02] space-y-2">
                            <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none">Email Address</p>
                            <p className="text-[11px] font-semibold text-white/80 truncate leading-none py-1">
                              {profile.contact_email || profile.email}
                            </p>
                            <div className="flex gap-2">
                              <a
                                href={`mailto:${profile.contact_email || profile.email}`}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-bold bg-accent text-bg hover:opacity-90 transition-opacity"
                              >
                                <Mail className="h-3 w-3" /> Email
                              </a>
                              <button
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(profile.contact_email || profile.email);
                                    setCopiedEmail(true);
                                    setTimeout(() => setCopiedEmail(false), 2000);
                                  } catch {}
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-bold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                              >
                                {copiedEmail ? "Copied!" : "Copy"}
                              </button>
                            </div>
                          </div>

                          {/* Phone section */}
                          {profile.contact_phone && profile.contact_phone.trim() && (
                            <div className="rounded-xl p-3 border border-white/[0.05] bg-white/[0.02] space-y-2">
                              <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none">Phone Number</p>
                              <p className="text-[11px] font-semibold text-white/80 truncate leading-none py-1">
                                {profile.contact_phone}
                              </p>
                              <div className="flex gap-2">
                                <a
                                  href={`tel:${profile.contact_phone}`}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-bold bg-accent text-bg hover:opacity-90 transition-opacity"
                                >
                                  <Phone className="h-3 w-3" /> Call
                                </a>
                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(profile.contact_phone || "");
                                      setCopiedPhone(true);
                                      setTimeout(() => setCopiedPhone(false), 2000);
                                    } catch {}
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[9px] font-bold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                                >
                                  {copiedPhone ? "Copied!" : "Copy"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setShowContactModal(false)}
                        className="w-full py-2 rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all text-center"
                      >
                        Close
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
            {/* Top accent line */}
            <div
              className="absolute top-0 inset-x-0 h-px z-20"
              style={{ background: `linear-gradient(90deg, transparent 5%, ${accent}50 50%, transparent 95%)` }}
            />

            {/* ── Header ───────────────────────────── */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={displayName}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                    style={{ border: `2px solid ${accent}30` }}
                    draggable={false}
                    unoptimized
                  />
                ) : (
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accent}15`, border: `2px solid ${accent}30` }}
                  >
                    <span className="text-[10px] font-black" style={{ color: `${accent}60` }}>{initials}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-white truncate leading-tight">{displayName}</p>
                  {(profile.sport || profile.position) && (
                    <p className="text-[9px] text-white/25 font-medium truncate">
                      {[profile.sport, profile.position, profile.school].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 opacity-30">
                <RotateCcw className="h-3 w-3 text-white/50" />
                <span className="text-[8px] font-bold text-white/50 tracking-wider uppercase">Flip</span>
              </div>
            </div>

            {/* Separator */}
            <div className="mx-4 h-px flex-shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${accent}20, transparent)` }} />

            {/* ── Scrollable content ────────────────── */}
            <div className="flex-1 overflow-y-auto scrollbar-none px-5 pt-4 pb-4 space-y-3" onClick={stopFlip}>

              {/* Bio */}
              {hasValidBio && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="h-3 w-3" style={{ color: `${accent}60` }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: `${accent}50` }}>About</span>
                  </div>
                  <p className="text-[11px] leading-[1.7] text-white/40 line-clamp-4 overflow-wrap-break-word" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>
                    {sanitize(profile.bio)}
                  </p>
                </div>
              )}

              {/* Links */}
              {displayedLinks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ExternalLink className="h-3 w-3" style={{ color: `${accent}60` }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: `${accent}50` }}>Links</span>
                  </div>
                  <div className="space-y-1.5">
                  {displayedLinks.map(link => {
                    let domain = "";
                    try { domain = new URL(link.url).hostname.replace("www.", ""); } catch {}
                    return (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetAutoReturn();
                          trackLinkClick(profile.id, link.label, link.url);
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group transform translate-z-0 [backface-visibility:hidden] [will-change:transform] overflow-hidden relative"
                        style={{
                          background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                          border: `1px solid rgba(255,255,255,0.07)`,
                          boxShadow: "0 0 1px transparent",
                          outline: "1px solid transparent",
                          WebkitBackfaceVisibility: "hidden",
                          backfaceVisibility: "hidden",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `linear-gradient(135deg, ${accent}12 0%, ${accent}05 100%)`;
                          e.currentTarget.style.borderColor = `${accent}30`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                        }}
                      >
                        <div
                          className="w-0.5 self-stretch rounded-full flex-shrink-0"
                          style={{ background: `linear-gradient(to bottom, ${accent}80, ${accent}20)` }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11.5px] font-semibold text-white/70 group-hover:text-white/90 transition-colors truncate leading-tight">
                            {sanitize(link.label)}
                          </div>
                          {domain && (
                            <div className="text-[9px] text-white/25 group-hover:text-white/40 transition-colors truncate mt-0.5 leading-tight">
                              {domain}
                            </div>
                          )}
                        </div>
                        <div
                          className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                          style={{ background: `${accent}15` }}
                        >
                          <ChevronRight className="h-2.5 w-2.5 transition-colors" style={{ color: `${accent}80` }} />
                        </div>
                      </a>
                    );
                  })}
                  </div>
                  {links.length > maxVisibleLinks && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setLinksExpanded(!linksExpanded); resetAutoReturn(); }}
                      className="w-full text-center text-[9px] font-bold uppercase tracking-wider py-1 transition-colors"
                      style={{ color: `${accent}80` }}
                    >
                      {linksExpanded ? "Show less" : `Show all ${links.length}`}
                    </button>
                  )}
                </div>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Play className="h-3 w-3" style={{ color: `${accent}60` }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: `${accent}50` }}>Highlights</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 py-2 px-1">
                    {highlights.map((h, i) => (
                      <a
                        key={i}
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetAutoReturn();
                          trackLinkClick(profile.id, h.title || `Highlight ${i + 1}`, h.url);
                        }}
                        className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 transform translate-z-0 [backface-visibility:hidden] [will-change:transform]"
                        style={{
                          background: `${accent}10`,
                          border: `1px solid ${accent}20`,
                          boxShadow: "0 0 1px transparent",
                          outline: "1px solid transparent",
                          WebkitBackfaceVisibility: "hidden",
                          backfaceVisibility: "hidden",
                        }}
                      >
                        <Play className="h-2.5 w-2.5 flex-shrink-0" style={{ color: `${accent}90` }} fill={`${accent}90`} />
                        <span className="text-[10px] font-semibold truncate max-w-[110px]" style={{ color: `${accent}cc` }}>
                          {sanitize(h.title) || `Highlight ${i + 1}`}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            {/* Connect: socials + share */}
              {socialLinks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Heart className="h-3 w-3" style={{ color: `${accent}60` }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: `${accent}50` }}>Connect</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 py-1">
                    {socialLinks.map(({ key, Icon, href, color }) => (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => { e.stopPropagation(); resetAutoReturn(); }}
                        className="social-icon-btn h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group transform translate-z-0 [backface-visibility:hidden] [will-change:transform]"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          boxShadow: "0 0 1px transparent",
                          outline: "1px solid transparent",
                          WebkitBackfaceVisibility: "hidden",
                          backfaceVisibility: "hidden",
                          "--social-color": color,
                        } as React.CSSProperties}
                      >
                        <Icon className="h-3.5 w-3.5 text-white/30 group-hover:text-white transition-colors duration-300" style={{ color: undefined }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center gap-3 pt-1">
                <div className="h-px w-10" style={{ background: "rgba(255,255,255,0.08)" }} />
                <ShareButtons url={publicUrl} title={`${displayName} on AthleteOS`} description={profile.bio || `Check out ${displayName}'s athlete card`} />
                <div className="h-px w-10" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>
            </div>
            {/* ── Bottom: Actions ─────────── */}
            <div className="mt-auto flex flex-col gap-3 w-full px-5 pb-4 pt-1 flex-shrink-0" onClick={stopFlip}>

              {/* Contact + Inquiry (2-col) */}
              <div className="flex gap-2 w-full">
                {hasContact && (
                  <button
                    onClick={(e) => { e.stopPropagation(); resetAutoReturn(); setShowContactModal(true); }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[12px] font-black tracking-wide transition-all duration-200 hover:scale-[1.02] transform translate-z-0 [backface-visibility:hidden] [will-change:transform]"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.55)",
                      boxShadow: "0 0 1px transparent",
                      outline: "1px solid transparent",
                      WebkitBackfaceVisibility: "hidden",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <Mail className="h-4 w-4" />
                    Contact
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); resetAutoReturn(); setShowInquiry(true); }}
                  className={`${hasContact ? "flex-1" : "w-full"} flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[12px] font-black tracking-wide transition-all duration-200 hover:scale-[1.02] transform translate-z-0 [backface-visibility:hidden] [will-change:transform]`}
                  style={{
                    background: `${accent}15`,
                    border: `1px solid ${accent}30`,
                    color: accent,
                    boxShadow: "0 0 1px transparent",
                    outline: "1px solid transparent",
                    WebkitBackfaceVisibility: "hidden",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <Send className="h-4 w-4" />
                  Send Inquiry
                </button>
              </div>

              {/* Primary CTA */}
              <div onClick={(e) => { e.stopPropagation(); resetAutoReturn(); }}>
                <TipButton
                  athleteId={profile.id}
                  athleteName={displayName}
                  accentColor={accent}
                />
              </div>
            </div>

                {/* ── Footer ───────────────────────────── */}
                <div
                  className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.15)" }}
                >
                  <span className="text-[7px] font-bold tracking-[0.3em] uppercase text-white/20">Powered by</span>
                  <Logo className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: `${accent}40` }} />
                  <span className="text-[7px] font-bold tracking-[0.3em] uppercase text-white/20">AthleteOS</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <QrShareModal url={publicUrl} open={showQr} onClose={() => setShowQr(false)} />
      <InquiryForm
        athleteId={profile.id}
        athleteName={displayName}
        open={showInquiry}
        onClose={() => setShowInquiry(false)}
      />
    </div>
  );
}
