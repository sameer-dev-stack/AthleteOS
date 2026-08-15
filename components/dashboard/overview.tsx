"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/lib/actions/profile";
import { cleanName } from "@/lib/display-name";
import { AvatarUpload } from "@/components/avatar-upload";
import { updateProfile } from "@/lib/actions/profile";
import { TipEarnings } from "@/components/dashboard/tip-earnings";
import { Camera, QrCode, EyeOff, Share2, Copy, Check, Zap } from "lucide-react";
import { sendCardPublishedEmail } from "@/lib/actions/emails";
import { getTipEarnings, type TipEarnings as TipEarningsData } from "@/lib/actions/tips";
import { getBalanceSummary, type BalanceSummary } from "@/lib/actions/balance";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";
import { getAnalytics, type AnalyticsData } from "@/lib/actions/analytics";
import { getNilMetrics } from "@/lib/actions/nil-engine";
import { NilMetricsStrip } from "@/components/dashboard/nil-metrics-strip";
import { getSavedAssetsCount } from "@/lib/actions/ai-vault";
import { getSocialAccounts, type SocialAccount } from "@/lib/actions/social-accounts";
import { resolvePlan } from "@/lib/referral-reward";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { ReferralCard } from "@/components/dashboard/referral-card";
import { LaunchChecklist } from "@/components/dashboard/launch-checklist";
import { WhatsNewBanner } from "@/components/dashboard/whats-new-banner";
import { TodaysDigest } from "@/components/dashboard/todays-digest";
import { getInquiryCount } from "@/lib/actions/inquiries";
import { PullToRefresh } from "@/components/mobile/pull-to-refresh";
import { useHaptic } from "@/components/mobile/use-haptic";
import { SwipeCards } from "@/components/mobile/swipe-cards";
import { getMissingCardFieldLabels } from "@/lib/card-completeness";
import { LaunchOfferBanner } from "@/components/promo/launch-offer-banner";

const QrShareModal = lazy(() => import("@/components/dashboard/qr-share-modal").then((m) => ({ default: m.QrShareModal })));

type PromoProps = {
  available: boolean;
  remainingSlots: number;
  totalSlots: number;
  claimed: boolean;
  trialEndsAt: string | null;
};

type Props = {
  profile: Profile;
  promo?: PromoProps;
};

export function DashboardOverview({ profile: initialProfile, promo }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url);

  const [earnings, setEarnings] = useState<TipEarningsData | null>(null);
  const cardName = cleanName(profile.full_name, profile.username);
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const [loadingTips, setLoadingTips] = useState(true);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [nilScore, setNilScore] = useState<number | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [savedAssetsCount, setSavedAssetsCount] = useState(0);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [togglingPublished, setTogglingPublished] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [cardLinkCopied, setCardLinkCopied] = useState(false);
  const [inquiriesCount, setInquiriesCount] = useState(0);
  const haptic = useHaptic();

  useEffect(() => {
    queueMicrotask(() => {
      setProfile(initialProfile);
      setAvatarUrl(initialProfile.avatar_url);
    });
  }, [initialProfile]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTipEarnings(), getBalanceSummary()]).then(([earningsResult, balanceResult]) => {
      if (cancelled) return;
      if (earningsResult.ok && earningsResult.data) setEarnings(earningsResult.data);
      if (balanceResult.ok && balanceResult.data) setBalance(balanceResult.data);
      setLoadingTips(false);
    }).catch(() => {
      if (!cancelled) setLoadingTips(false);
    });
    return () => { cancelled = true; };
  }, []);

  const fetchMetrics = useCallback(() => {
    let cancelled = false;
    Promise.all([
      getAnalytics(profile.id, "30d"),
      getNilMetrics(),
      getSocialAccounts(),
      getSavedAssetsCount(),
      getInquiryCount(profile.id),
    ]).then(([analyticsRes, nilRes, socialRes, assetsCount, inquiryCount]) => {
      if (cancelled) return;
      if (analyticsRes.ok && analyticsRes.data) setAnalytics(analyticsRes.data);
      if (nilRes.ok && nilRes.data) setNilScore(nilRes.data.nil_score);
      if (socialRes.ok && socialRes.data) setSocialAccounts(socialRes.data);
      setSavedAssetsCount(assetsCount);
      setInquiriesCount(inquiryCount);
      setLoadingMetrics(false);
    }).catch(() => {
      if (!cancelled) setLoadingMetrics(false);
    });
    return () => { cancelled = true; };
  }, [profile.id]);

  useEffect(() => {
    let cancelled = false;
    const cleanup = fetchMetrics();
    return () => { cancelled = true; if (cleanup) cleanup(); };
  }, [fetchMetrics]);

  useEffect(() => {
    let cancelled = false;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchMetrics();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    const pollInterval = setInterval(fetchMetrics, 30000);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(pollInterval);
    };
  }, [fetchMetrics]);

  async function handleAvatarUpload(newUrl: string) {
    setAvatarUrl(newUrl);
    setProfile((p) => ({ ...p, avatar_url: newUrl }));
    await updateProfile({ avatar_url: newUrl });
  }

  async function handleShareCard() {
    haptic.lightTap();
    const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app"}/${profile.username}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${cardName} on AthleteOS`, text: "Check out my athlete card", url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCardLinkCopied(true);
        haptic.success();
        setTimeout(() => setCardLinkCopied(false), 2200);
      } catch {}
    }
  }

  async function handleTogglePublished() {
    haptic.mediumTap();
    const next = !profile.profile_published;
    setPublishError(null);

    if (next) {
      const missing = getMissingCardFieldLabels(profile);
      if (missing.length > 0) {
        const message =
          missing.length <= 2
            ? `Your card needs ${missing.join(" and ")} before it can go live.`
            : `Your card needs ${missing.slice(0, -1).join(", ")}, and ${missing[missing.length - 1]} before it can go live.`;
        setPublishError(message);
        return;
      }
    }

    setTogglingPublished(true);
    setProfile((p) => ({ ...p, profile_published: next }));
    const result = await updateProfile({ profile_published: next });
    if (!result.ok) {
      setProfile((p) => ({ ...p, profile_published: !next }));
      setPublishError(result.error || "Failed to update publish state.");
    } else if (next) {
      trackFunnel("profile_publish");
      haptic.success();
      const confettiMod = await import("canvas-confetti");
      confettiMod.default({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      if (profile.username) {
        const name = cardName.split(" ")[0];
        sendCardPublishedEmail(profile.email, name, profile.username).catch(() => {});
      }
    }
    setTogglingPublished(false);
  }

  const accentColor = profile.theme_accent || "#C6FF3D";
  const isProUser = resolvePlan(profile.plan, profile.extended_pro_until) !== "free";
  const showPromoOffer = !!promo && promo.available && !promo.claimed && !isProUser;
  const initials = cardName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatCents = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleRefresh = useCallback(async () => {
    await fetchMetrics();
  }, [fetchMetrics]);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Overview</h1>
          <p className="mt-1 text-sm text-white/40">
            Welcome back, {profile.full_name || profile.email}
          </p>
        </div>
        {profile.profile_published && profile.username && (
          <button
            onClick={handleShareCard}
            className="flex items-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-2.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20 hover:border-accent/30"
          >
            {cardLinkCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            {cardLinkCopied ? "Link copied" : "Share card"}
          </button>
        )}
      </div>

      <WhatsNewBanner />

      {/* Today's Digest */}
      <TodaysDigest
        analytics={analytics}
        nilScore={nilScore}
        tipsCount={earnings?.totalTips || 0}
        inquiriesCount={inquiriesCount}
        themeAccent={accentColor}
        isPublished={profile.profile_published}
        username={profile.username}
        onShare={handleShareCard}
      />

      {/* Card Performance Metrics */}
      {profile.profile_published && (
        loadingMetrics ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl border border-white/[0.05] bg-[#111113]/80 p-4 min-h-[90px]">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="mt-3 h-6 w-12 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <NilMetricsStrip
                cardViews={analytics?.totalViews ?? 0}
                linkClicks={analytics?.totalClicks ?? 0}
                clickThroughRate={analytics && analytics.totalViews > 0 ? analytics.totalClicks / analytics.totalViews : 0}
                tipsAmount={earnings ? earnings.totalEarned / 100 : 0}
                followersTotal={socialAccounts.reduce((sum, a) => sum + a.followers, 0)}
                themeAccent={accentColor}
                isPro={resolvePlan(profile.plan, profile.extended_pro_until) !== "free"}
              />
            </div>
            <div className="md:hidden">
              <SwipeCards>
                {[
                  { label: "Card Views", value: (analytics?.totalViews ?? 0).toLocaleString() },
                  { label: "Link Clicks", value: resolvePlan(profile.plan, profile.extended_pro_until) !== "free" ? (analytics?.totalClicks ?? 0).toLocaleString() : "🔒 Pro" },
                  { label: "Click-Through", value: resolvePlan(profile.plan, profile.extended_pro_until) !== "free" ? `${analytics && analytics.totalViews > 0 ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(1) : "0.0"}%` : "🔒 Pro" },
                  { label: "Tips Earned", value: `$${(earnings ? earnings.totalEarned / 100 : 0).toFixed(2)}` },
                  { label: "Followers", value: socialAccounts.reduce((sum, a) => sum + a.followers, 0).toLocaleString() },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-white/[0.05] bg-[#111113]/80 p-5 min-h-[100px] flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">{stat.label}</span>
                    <span className="text-2xl font-black text-white tracking-tight">{stat.value}</span>
                  </div>
                ))}
              </SwipeCards>
            </div>
          </>
        )
      )}

      {/* Upgrade CTA for free users */}
      {!showPromoOffer && resolvePlan(profile.plan, profile.extended_pro_until) === "free" && (
        <Link
          href="/dashboard/billing"
          className="flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/5 p-4 transition-all hover:bg-accent/10"
        >
          <div>
            <p className="text-sm font-semibold text-accent">Unlock Pro</p>
            <p className="text-xs text-white/40 mt-0.5">300 AI actions, analytics, custom branding</p>
          </div>
          <Zap className="h-4 w-4 text-accent" />
        </Link>
      )}

      {/* TWO-COLUMN MAIN BODY */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left Section (col-span-2 / 2-thirds width) */}
        <div className="lg:col-span-2 space-y-6">
          <TipEarnings
            earnings={earnings}
            balance={balance}
            loading={loadingTips}
          />

          {/* Referral Card (Full width - spacious & unclipped) */}
          <ReferralCard />

          {/* Launch Checklist */}
          <LaunchChecklist profile={profile} />
        </div>

        {/* Right Section (col-span-1 / 1-third width) */}
        <div className="space-y-6">
          {/* YOUR CARD — Premium Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-[#0D0D11] border border-white/[0.06]">
            {/* Ambient glow behind card */}
            <div
              className="absolute -inset-1 rounded-3xl opacity-20 blur-2xl pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 50% 30%, ${accentColor}30, transparent 70%)` }}
            />

            <div className="relative">
              {/* Header */}
              <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30">Your Card</span>
                <button
                  onClick={handleTogglePublished}
                  disabled={togglingPublished}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-200 disabled:opacity-50"
                  style={{
                    backgroundColor: profile.profile_published ? `${accentColor}15` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${profile.profile_published ? `${accentColor}30` : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <span
                    className="relative h-4 w-7 rounded-full transition-colors duration-200"
                    style={{ backgroundColor: profile.profile_published ? accentColor : "rgba(255,255,255,0.1)" }}
                  >
                    <span
                      className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200"
                      style={{ left: profile.profile_published ? "14px" : "2px" }}
                    />
                  </span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: profile.profile_published ? accentColor : "rgba(255,255,255,0.35)" }}
                  >
                    {profile.profile_published ? "Live" : "Draft"}
                  </span>
                </button>
              </div>

              {publishError && (
                <div className="px-4 pb-3">
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                    {publishError}
                  </div>
                </div>
              )}

              {profile.username ? (
                <div className="px-4 pb-4">
                  {/* Card itself */}
                  <div
                    className="group relative w-full overflow-hidden rounded-[20px] bg-[#0A0A0D]"
                    style={{ aspectRatio: "9/14" }}
                  >
                    {/* Photo */}
                    <div className={`absolute inset-0 ${!profile.profile_published ? "blur-sm scale-105" : ""}`}>
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={cardName}
                          fill
                          className="object-cover object-top"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="h-full w-full flex items-center justify-center"
                          style={{ background: `linear-gradient(160deg, ${accentColor}12, #0A0A0D)` }}
                        >
                          <span className="text-4xl font-black" style={{ color: accentColor }}>
                            {initials}
                          </span>
                        </div>
                      )}
                      {/* Bottom gradient fade */}
                      <div className="absolute inset-x-0 bottom-0 h-[55%]" style={{ background: "linear-gradient(to top, #0A0A0D 0%, #0A0A0Ddd 25%, transparent 100%)" }} />
                    </div>

                    {/* Offline overlay */}
                    {!profile.profile_published && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-[20px]">
                        <div className="h-10 w-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mb-2.5">
                          <EyeOff className="h-4 w-4 text-white/30" />
                        </div>
                        <p className="text-[11px] font-bold text-white/40">Card is offline</p>
                        <p className="text-[9px] text-white/20 mt-1">Toggle live to publish</p>
                      </div>
                    )}

                    {/* Content overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col">
                      {/* Name + Role */}
                      <div>
                        <p className="text-[15px] font-black text-white leading-tight tracking-tight">
                          {cardName}
                        </p>
                      <p className="text-[11px] font-bold mt-1" style={{ color: accentColor }}>
                        {[profile.position, profile.sport].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    {/* Bio */}
                    {profile.bio && profile.bio.trim().length > 15 ? (
                      <p
                        className="mt-2 text-[10px] leading-[1.5] text-white/55 line-clamp-3"
                        style={{ overflowWrap: "break-word", wordBreak: "break-word" }}
                      >
                        {profile.bio.trim()}
                      </p>
                    ) : (
                      <p className="mt-2 text-[10px] italic text-white/25">
                        No bio added yet
                      </p>
                    )}

                    {/* Stats chips */}
                      {(() => {
                        const PLACEHOLDER_STATS = /^(test|asdf|foo|bar|baz|aaa|123|000|xxx|yyy|zzz|na|n\/a|none|sample|demo|example|temp|placeholder)$/i;
                        const validStats = (profile.stats ?? []).filter(s => {
                          if (!s.label?.trim() || !s.value?.trim()) return false;
                          const l = s.label.trim().toLowerCase();
                          const v = s.value.trim();
                          if (/^(.)\1+$/.test(l) && l.length > 2) return false;
                          if (/^(.)\1+$/.test(v) && v.length > 2) return false;
                          if (v.length > 50) return false;
                          if (PLACEHOLDER_STATS.test(l) || PLACEHOLDER_STATS.test(v)) return false;
                          return true;
                        }).slice(0, 3);
                        return validStats.length > 0 ? (
                          <div className="mt-3 flex gap-1.5">
                            {validStats.map((stat) => (
                              <div
                                key={stat.label}
                                className="flex-1 rounded-xl py-2 px-2 text-center backdrop-blur-md"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                }}
                              >
                                <p className="text-[11px] font-black text-white">{stat.value}</p>
                                <p className="text-[7px] font-bold text-white/35 uppercase tracking-wider mt-0.5">{stat.label}</p>
                              </div>
                            ))}
                          </div>
                        ) : null;
                      })()}

                      {/* Stats chips */}
                    </div>

                    {/* Hover: change photo (only when live) */}
                    {profile.profile_published && (
                      <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[20px]">
                        <div className="flex flex-col items-center gap-1.5">
                          <Camera className="h-5 w-5 text-white" />
                          <span className="text-[10px] text-white/80 font-medium">Change photo</span>
                        </div>
                        <AvatarUpload
                          currentUrl={avatarUrl}
                          userId={profile.id}
                          onUpload={handleAvatarUpload}
                          size="sm"
                          triggerOnly
                        />
                      </label>
                    )}
                  </div>

                  {/* Bottom bar: URL + actions */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-white/25 truncate max-w-[150px]">
                      athleteos.app/{profile.username}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { haptic.lightTap(); setShowQr(true); }}
                        aria-label="Show QR code"
                        className="h-8 w-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/50"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                      {profile.profile_published ? (
                        <Link
                          href={`/${profile.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-3 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-200 hover:brightness-110"
                          style={{ backgroundColor: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}25` }}
                        >
                          Open
                        </Link>
                      ) : (
                        <span
                          className="h-8 px-3 rounded-lg flex items-center justify-center text-[10px] font-bold text-white/20"
                          style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-5 pb-6 text-center">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
                    <Camera className="h-6 w-6 text-white/15" />
                  </div>
                  <p className="text-xs text-white/25 leading-relaxed">
                    Complete onboarding to set up your card.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {promo && promo.claimed && (
        <LaunchOfferBanner
          hasClaimed={true}
          trialEndsAt={promo.trialEndsAt}
          isAuthenticated={true}
        />
      )}
      {showPromoOffer && (
        <LaunchOfferBanner
          remainingSlots={promo!.remainingSlots}
          totalSlots={promo!.totalSlots}
          isAuthenticated={true}
        />
      )}
      {profile.username && (
        <QrShareModal
          url={`${process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app"}/${profile.username}`}
          open={showQr}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
    </PullToRefresh>
  );
}
