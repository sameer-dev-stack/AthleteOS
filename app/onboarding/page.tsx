"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  User,
  GraduationCap,
  Copy,
  Instagram,
  Music2,
  Sparkles,
  Plus,
  X,
  Mail,
  Phone,
  Link2,
  Play,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkUsername, updateProfile } from "@/lib/actions/profile";
import { sendWelcomeEmail } from "@/lib/actions/emails";
import { recordReferral } from "@/lib/actions/referrals";
import confetti from "canvas-confetti";
import { Logo } from "@/components/logo";
import { AvatarUpload } from "@/components/avatar-upload";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";
import { getStatTemplatesForSport } from "@/lib/sport-stat-templates";

const SPORTS = [
  "Football", "Basketball", "Baseball", "Soccer", "Track & Field",
  "Swimming", "Volleyball", "Gymnastics", "Wrestling", "Tennis",
  "Lacrosse", "Hockey", "Softball", "Golf", "Cross Country",
  "Fencing", "Rowing", "Rugby", "Esports", "Other",
];

const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Grad Student"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PLACEHOLDER_STATS = /^(test|asdf|foo|bar|baz|aaa|123|000|xxx|yyy|zzz|na|n\/a|none|sample|demo|example|temp|placeholder)$/i;

const DRAFT_PREFIX = "athleteos:onboarding:draft:v1:";

type OnboardingDraft = {
  step: StepKey;
  username: string;
  fullName: string;
  sport: string;
  school: string;
  classYear: string;
  position: string;
  bio: string;
  avatarUrl: string | null;
  instagram: string;
  tiktok: string;
  stats: { label: string; value: string }[];
  links: { label: string; url: string }[];
  highlights: { title: string; url: string }[];
  contactEmail: string;
  contactPhone: string;
};

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length > 10) {
    return `+${digits.startsWith("1") ? digits : `1${digits}`}`.slice(0, 17);
  }
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

const STEP_META = [
  { key: "username", label: "Username", optional: false },
  { key: "profile", label: "Profile", optional: false },
  { key: "socials", label: "Socials", optional: false },
  { key: "stats", label: "Stats", optional: false },
  { key: "details", label: "Links", optional: false },
  { key: "done", label: "Complete", optional: false },
] as const;

type StepKey = (typeof STEP_META)[number]["key"];

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

function fireCelebration() {
  const duration = 2500;
  const end = Date.now() + duration;
  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#C6FF3D", "#E4FF8A", "#9BD400"],
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#C6FF3D", "#E4FF8A", "#9BD400"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

function PreviewCard({
  avatarUrl,
  fullName,
  sport,
  school,
  classYear,
  position,
  bio,
  username,
  instagram,
  tiktok,
  stats,
}: {
  avatarUrl: string | null;
  fullName: string;
  sport: string;
  school: string;
  classYear: string;
  position: string;
  bio: string;
  username: string;
  instagram: string;
  tiktok: string;
  stats: { label: string; value: string }[];
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const displayName = fullName || "Your Name";

  const subtitle = [position, sport].filter(Boolean).join(" ");
  const schoolLine = [school, classYear].filter(Boolean).join(" \u00b7 ");
  const hasSocials = instagram.trim() || tiktok.trim();

  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-bg-elev overflow-hidden">
      <div className="relative h-20 bg-gradient-to-br from-accent/20 via-accent/5 to-transparent">
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: "radial-gradient(circle at 30% 50%, rgba(198,255,61,0.3), transparent 40%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.06), transparent 50%)",
        }} />
      </div>

      <div className="relative px-4 pb-4 -mt-8">
        <div className="flex items-end gap-3">
          {avatarUrl && avatarUrl !== failedUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              unoptimized
              width={64}
              height={64}
              onError={() => setFailedUrl(avatarUrl)}
              className="h-16 w-16 rounded-2xl object-cover ring-4 ring-bg-elev"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-accent/15 ring-4 ring-bg-elev flex items-center justify-center">
              <span className="text-xl font-bold text-accent">
                {fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "A"}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-ink truncate">{displayName}</h3>
            <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
          </div>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-ink-muted">{subtitle}</p>
          )}
          {schoolLine && (
            <p className="mt-0.5 text-[11px] text-ink-dim">{schoolLine}</p>
          )}
        </div>

        {bio && (
          <p className="mt-2 text-[11px] text-ink-muted line-clamp-2">{bio}</p>
        )}

        {stats.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {stats.slice(0, 4).map((s, i) => (
              <div key={i} className="rounded-lg border border-white/[0.05] bg-white/[0.04] px-2 py-1.5">
                <p className="truncate text-[8px] uppercase tracking-wider text-ink-dim">{s.label}</p>
                <p className="truncate text-xs font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {hasSocials && (
          <div className="mt-2 flex items-center gap-2">
            {instagram.trim() && (
              <div className="flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-1">
                <Instagram className="h-3 w-3 text-pink-400" />
                <span className="text-[9px] text-ink-dim font-medium">{instagram.replace(/^@/, "")}</span>
              </div>
            )}
            {tiktok.trim() && (
              <div className="flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-1">
                <Music2 className="h-3 w-3 text-cyan-400" />
                <span className="text-[9px] text-ink-dim font-medium">{tiktok.replace(/^@/, "")}</span>
              </div>
            )}
          </div>
        )}

        <p className="mt-3 text-[9px] text-ink-dim text-center font-medium truncate">
          athleteos.app/{username || "yourname"}
        </p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>("username");
  const [slideDir, setSlideDir] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [fullName, setFullName] = useState("");
  const [sport, setSport] = useState("");
  const [school, setSchool] = useState("");
  const [classYear, setClassYear] = useState("");
  const [position, setPosition] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLocalUrl, setAvatarLocalUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [stats, setStats] = useState<{ label: string; value: string }[]>([]);
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [highlights, setHighlights] = useState<{ title: string; url: string }[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  function restoreDraft(userId: string) {
    let draft: OnboardingDraft | null = null;
    try {
      const raw = localStorage.getItem(`${DRAFT_PREFIX}${userId}`);
      if (raw) draft = JSON.parse(raw);
    } catch {
      draft = null;
    }
    if (!draft || !STEP_META.some((s) => s.key === draft!.step)) return;

    setStep(draft.step);
    setUsername(draft.username);
    setFullName(draft.fullName);
    setSport(draft.sport);
    setSchool(draft.school);
    setClassYear(draft.classYear);
    setPosition(draft.position);
    setBio(draft.bio);
    setAvatarUrl(draft.avatarUrl);
    setInstagram(draft.instagram);
    setTiktok(draft.tiktok);
    setStats(draft.stats);
    setLinks(draft.links);
    setHighlights(draft.highlights);
    setContactEmail(draft.contactEmail);
    setContactPhone(draft.contactPhone);
  }

  function saveDraft(userId: string) {
    const draft: OnboardingDraft = {
      step,
      username,
      fullName,
      sport,
      school,
      classYear,
      position,
      bio,
      avatarUrl,
      instagram,
      tiktok,
      stats,
      links,
      highlights,
      contactEmail,
      contactPhone,
    };
    try {
      localStorage.setItem(`${DRAFT_PREFIX}${userId}`, JSON.stringify(draft));
    } catch {
      // storage full/unavailable; ignore
    }
  }

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      if (!user) {
        router.push("/auth/sign-in");
        return;
      }
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || "");
      setUserId(user.id);
      setAvatarUrl(user.user_metadata?.avatar_url || null);

      supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (cancelled) return;
          if (data?.onboarding_completed) {
            router.push("/dashboard");
            return;
          }
          restoreDraft(user.id);
          setLoading(false);
          setShowWelcome(true);
          trackFunnel("onboarding_start");
        }, () => {
          if (!cancelled) setLoading(false);
        });
    }, () => {
      if (!cancelled) router.push("/auth/sign-in");
    });
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (!userId || loading) return;
    const t = setTimeout(() => saveDraft(userId), 400);
    return () => clearTimeout(t);
  }, [
    userId,
    loading,
    step,
    username,
    fullName,
    sport,
    school,
    classYear,
    position,
    bio,
    avatarUrl,
    instagram,
    tiktok,
    stats,
    links,
    highlights,
    contactEmail,
    contactPhone,
  ]);

  useEffect(() => {
    if (username.length < 3) {
      queueMicrotask(() => setUsernameStatus("idle"));
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      queueMicrotask(() => setUsernameStatus("invalid"));
      return;
    }

    queueMicrotask(() => setUsernameStatus("checking"));
    const t = setTimeout(() => {
      checkUsername(username).then(({ available }) => {
        setUsernameStatus(available ? "available" : "taken");
      }).catch(() => {
        setUsernameStatus("idle");
      });
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  const goNext = useCallback(() => {
    const idx = STEP_META.findIndex((s) => s.key === step);
    if (idx < STEP_META.length - 1) {
      setSlideDir(1);
      setStep(STEP_META[idx + 1].key);
    }
  }, [step]);

  const goBack = useCallback(() => {
    const idx = STEP_META.findIndex((s) => s.key === step);
    if (idx > 0) {
      setSlideDir(-1);
      setStep(STEP_META[idx - 1].key);
    }
  }, [step]);

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const fieldState = useCallback(
    (field: string, valid: boolean) => {
      if (!touched[field]) return "idle";
      return valid ? "valid" : "invalid";
    },
    [touched]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const canProceedUsername = usernameStatus === "available" && username.length >= 3;
  const canProceedProfile =
    avatarUrl !== null &&
    fullName.trim().length > 0 &&
    sport.length > 0 &&
    position.trim().length > 0 &&
    school.trim().length > 0 &&
    classYear.length > 0 &&
    bio.trim().length >= 15;
  const canProceedSocials = instagram.trim().length > 0 || tiktok.trim().length > 0;
  const canProceedStats = stats.some(
    (s) =>
      s.label.trim().length > 0 &&
      s.value.trim().length > 0 &&
      !PLACEHOLDER_STATS.test(s.label.trim()) &&
      !PLACEHOLDER_STATS.test(s.value.trim())
  );

  const contactEmailInvalid = contactEmail.trim().length > 0 && !isValidEmail(contactEmail);
  const hasLinks = links.some((l) => l.label.trim() && l.url.trim());
  const hasHighlights = highlights.some((h) => h.title.trim() && h.url.trim());
  const hasContact = contactEmail.trim().length > 0 || contactPhone.trim().length > 0;
  const canProceedDetails = !contactEmailInvalid && hasLinks && hasHighlights && hasContact;

  const statTemplates = sport ? getStatTemplatesForSport(sport) : null;
  const usedStatLabels = new Set(stats.map((s) => s.label.toLowerCase()));
  const availableStatTemplates = statTemplates?.filter((t) => !usedStatLabels.has(t.label.toLowerCase())) || [];

  const currentIdx = STEP_META.findIndex((s) => s.key === step);
  const progressPct = step === "done" ? 100 : Math.round(((currentIdx + 1) / (STEP_META.length - 1)) * 100);

  async function handleComplete() {
    setSaving(true);
    setError(null);
    try {
      const refMatch = document.cookie.match(/(?:^|;\s*)athleteos_ref=([^;]+)/);
      const referredBy = refMatch ? decodeURIComponent(refMatch[1]) : null;

      const socialData: { instagram?: string; tiktok?: string } = {};
      if (instagram.trim()) socialData.instagram = instagram.trim().replace(/^@/, "");
      if (tiktok.trim()) socialData.tiktok = tiktok.trim().replace(/^@/, "");

      const cleanStats = stats
        .filter(
          (s) =>
            s.label.trim() &&
            s.value.trim() &&
            !PLACEHOLDER_STATS.test(s.label.trim()) &&
            !PLACEHOLDER_STATS.test(s.value.trim())
        )
        .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
        .slice(0, 10);

      const cleanLinks = links
        .map((l) => {
          let url = l.url.trim();
          if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
          return { label: l.label.trim(), url };
        })
        .filter((l) => l.label && l.url && /^https?:\/\/.+/.test(l.url))
        .slice(0, 10);

      const cleanHighlights = highlights
        .map((h) => {
          let url = h.url.trim();
          if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
          return { title: h.title.trim(), url };
        })
        .filter((h) => h.title && h.url && /^https?:\/\/.+/.test(h.url))
        .slice(0, 10);

      const result = await updateProfile({
        username,
        full_name: fullName.trim(),
        sport,
        school: school.trim(),
        class_year: classYear || null,
        position: position.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        social: Object.keys(socialData).length > 0 ? socialData : undefined,
        stats: cleanStats,
        links: cleanLinks,
        highlights: cleanHighlights,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        profile_published: true,
        onboarding_completed: true,
        referred_by: referredBy,
      });
      if (result.ok) {
        try {
          localStorage.removeItem(`${DRAFT_PREFIX}${userId}`);
        } catch {
          // ignore
        }
        trackFunnel("onboarding_complete");
        if (referredBy) {
          recordReferral(referredBy).then((r) => {
            if (!r.ok) console.warn("[referral] recordReferral failed:", r.error);
          }).catch((e) => console.error("[referral] recordReferral exception:", e));
        }
        const supabase = createClient();
        const { data: { user } } = await supabase!.auth.getUser();
        if (user?.email) {
          sendWelcomeEmail(user.email, fullName.trim().split(" ")[0], username).catch(() => {});
        }
        setSlideDir(1);
        setStep("done");
      } else {
        setError(result.error || "Failed to save profile. Please try again.");
      }
    } catch (e) {
      console.error("[onboarding] handleComplete error:", e);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function fieldClasses(state: "idle" | "valid" | "invalid") {
    const base =
      "w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:outline-none transition-colors";
    if (state === "valid") return `${base} border-accent/40 focus:border-accent/60`;
    if (state === "invalid") return `${base} border-red-400/40 focus:border-red-400/60`;
    return `${base} border-white/[0.08] focus:border-accent/40`;
  }

  function fieldClassesPl(state: "idle" | "valid" | "invalid") {
    const base =
      "w-full rounded-xl border bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white placeholder:text-ink-dim focus:outline-none transition-colors";
    if (state === "valid") return `${base} border-accent/40 focus:border-accent/60`;
    if (state === "invalid") return `${base} border-red-400/40 focus:border-red-400/60`;
    return `${base} border-white/[0.08] focus:border-accent/40`;
  }

  function selectClasses(state: "idle" | "valid" | "invalid") {
    const base =
      "w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white focus:outline-none appearance-none transition-colors";
    if (state === "valid") return `${base} border-accent/40 focus:border-accent/60`;
    if (state === "invalid") return `${base} border-red-400/40 focus:border-red-400/60`;
    return `${base} border-white/[0.08] focus:border-accent/40`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:pt-12 sm:pb-12">
      {showWelcome && <WelcomeModal onDismiss={() => setShowWelcome(false)} />}
      <div className="w-full max-w-lg">
        <div className="mb-4 sm:mb-8 text-center">
          <div className="inline-flex items-center gap-2.5 mb-4 sm:mb-6">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">AthleteOS</span>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3">
            {STEP_META.map((s, i) => {
              const isComplete = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={s.key} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[11px] sm:text-xs font-semibold transition-all duration-300 ${
                        isCurrent
                          ? "bg-accent text-bg scale-110"
                          : isComplete
                          ? "bg-accent/20 text-accent"
                          : "bg-white/[0.06] text-ink-dim"
                      }`}
                    >
                      {isComplete ? (
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`hidden sm:block text-[10px] font-medium whitespace-nowrap transition-colors duration-300 ${
                        isCurrent ? "text-ink" : isComplete ? "text-accent" : "text-ink-dim"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEP_META.length - 1 && (
                    <div
                      className={`h-px w-3 sm:w-8 mb-0 sm:mb-4 transition-colors duration-300 ${
                        i < currentIdx ? "bg-accent/40" : "bg-white/[0.06]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mx-auto max-w-xs mb-6 sm:mb-8">
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: "0%" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="mt-2 text-center text-[11px] font-medium text-ink-muted sm:hidden">
              Step {currentIdx + 1} of {STEP_META.length} &middot; {STEP_META[currentIdx].label}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait" custom={slideDir}>
          {step === "username" && (
            <motion.div
              key="username"
              custom={slideDir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-2xl font-bold tracking-tight">Claim your athlete card</h1>
              <p className="mt-2 text-sm text-ink-muted">
                This will be your public URL: athleteos.app/
                <span className="text-accent">{username || "yourname"}</span>
              </p>

              <div className="mt-5 sm:mt-8 space-y-4">
                <div>
                  <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ink-muted">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      onBlur={() => markTouched("username")}
                      placeholder="yourname"
                      maxLength={30}
                      className={`${
                        usernameStatus === "available"
                          ? "border-accent/40"
                          : usernameStatus === "taken" || usernameStatus === "invalid"
                          ? "border-red-400/40"
                          : "border-white/[0.08]"
                      } w-full rounded-xl border bg-white/[0.03] py-3 pl-4 pr-10 text-sm text-white placeholder:text-ink-muted/70 focus:border-accent/40 focus:outline-none transition-colors`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && (
                        <Loader2 className="h-4 w-4 animate-spin text-ink-dim" />
                      )}
                      {usernameStatus === "available" && (
                        <Check className="h-4 w-4 text-accent" />
                      )}
                      {usernameStatus === "taken" && (
                        <span className="text-[10px] font-medium text-red-400">Taken</span>
                      )}
                      {usernameStatus === "invalid" && (
                        <span className="text-[10px] font-medium text-red-400">Invalid</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 min-h-[18px]">
                    {usernameStatus === "taken" && (
                      <p className="text-xs text-red-400">That username is already taken.</p>
                    )}
                    {usernameStatus === "invalid" && (
                      <p className="text-xs text-red-400">Only lowercase letters, numbers, hyphens, and underscores.</p>
                    )}
                    {usernameStatus === "available" && (
                      <p className="text-xs text-accent">athleteos.app/{username} is available!</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-8 flex flex-col gap-3">
                <button
                  onClick={goNext}
                  disabled={!canProceedUsername}
                  className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === "profile" && (
            <motion.div
              key="profile"
              custom={slideDir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Build your profile</h1>
                <p className="mt-2 text-sm text-ink-muted">
                  Every field is required so your card looks complete.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-center">
                    <AvatarUpload
                      currentUrl={avatarLocalUrl ?? avatarUrl}
                      userId={userId}
                      onUpload={(url, localUrl) => {
                        setAvatarUrl(url);
                        setAvatarLocalUrl(localUrl ?? null);
                      }}
                      size="lg"
                    />
                  </div>
                  {!avatarUrl && (
                    <p className="mt-3 text-center text-xs text-red-400/80">
                      A profile photo is required &mdash; cards without one look unfinished.
                    </p>
                  )}
                  {avatarUrl && (
                    <p className="mt-3 text-center text-xs text-accent/80">
                      Photo added. Looking sharp.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-ink-muted">
                    Full name <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'\-]/g, ""))}
                      onBlur={() => markTouched("fullName")}
                      placeholder="e.g. Maya Reyes"
                      maxLength={100}
                      className={fieldClassesPl(fieldState("fullName", fullName.trim().length > 0))}
                    />
                    {touched["fullName"] && fullName.trim().length > 0 && (
                      <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                    )}
                  </div>
                  {touched["fullName"] && fullName.trim().length === 0 && (
                    <p className="mt-1 text-xs text-red-400">Full name is required.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="sport" className="mb-1.5 block text-sm font-medium text-ink-muted">
                      Sport <span className="text-accent">*</span>
                    </label>
                    <select
                      id="sport"
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      onBlur={() => markTouched("sport")}
                      className={selectClasses(fieldState("sport", sport.length > 0))}
                    >
                      <option value="" className="bg-bg">Select sport</option>
                      {SPORTS.map((s) => (
                        <option key={s} value={s} className="bg-bg">{s}</option>
                      ))}
                    </select>
                    {touched["sport"] && sport.length === 0 && (
                      <p className="mt-1 text-xs text-red-400">Sport is required.</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="position" className="mb-1.5 block text-sm font-medium text-ink-muted">
                      Position <span className="text-accent">*</span>
                    </label>
<input
      id="position"
      type="text"
      value={position}
      onChange={(e) => setPosition(e.target.value)}
      onBlur={() => markTouched("position")}
                      placeholder="e.g. Guard"
                      maxLength={50}
      className={fieldClasses(fieldState("position", position.trim().length > 0))}
    />
                    {touched["position"] && position.trim().length === 0 && (
                      <p className="mt-1 text-xs text-red-400">Position is required.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="school" className="mb-1.5 block text-sm font-medium text-ink-muted">
                      School <span className="text-accent">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
                      <input
                        id="school"
                        type="text"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        onBlur={() => markTouched("school")}
                        placeholder="e.g. Stanford"
                        maxLength={100}
                        className={fieldClassesPl(fieldState("school", school.trim().length > 0))}
                      />
                      {touched["school"] && school.trim().length > 0 && (
                        <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                      )}
                    </div>
                    {touched["school"] && school.trim().length === 0 && (
                      <p className="mt-1 text-xs text-red-400">School is required.</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="classYear" className="mb-1.5 block text-sm font-medium text-ink-muted">
                      Class year <span className="text-accent">*</span>
                    </label>
                    <select
                      id="classYear"
                      value={classYear}
                      onChange={(e) => setClassYear(e.target.value)}
                      onBlur={() => markTouched("classYear")}
                      className={selectClasses(fieldState("classYear", classYear.length > 0))}
                    >
                      <option value="" className="bg-bg">Select year</option>
                      {CLASS_YEARS.map((y) => (
                        <option key={y} value={y} className="bg-bg">{y}</option>
                      ))}
                    </select>
                    {touched["classYear"] && classYear.length === 0 && (
                      <p className="mt-1 text-xs text-red-400">Class year is required.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-ink-muted">
                    Bio <span className="text-accent">*</span>
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    onBlur={() => markTouched("bio")}
                    placeholder="e.g. D1 guard at Stanford. Game-changer on and off the court."
                    rows={3}
                    maxLength={280}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none resize-none transition-colors"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    {bio.trim().length < 15 ? (
                      <p className="text-[11px] text-red-400/80">
                        {bio.trim().length === 0
                          ? "Bio is required."
                          : `Minimum 15 characters to show on your card (${15 - bio.trim().length} more needed).`}
                      </p>
                    ) : (
                      <p className="text-[11px] text-accent/60">Looks good.</p>
                    )}
                    <p className="text-[11px] text-ink-muted">{bio.length}/280</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <PreviewCard
                  avatarUrl={avatarLocalUrl ?? avatarUrl}
                  fullName={fullName}
                  sport={sport}
                  school={school}
                  classYear={classYear}
                  position={position}
                  bio={bio}
                  username={username}
                  instagram={instagram}
                  tiktok={tiktok}
                  stats={stats}
                />
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={goBack}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-ink transition-all hover:bg-white/[0.05]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!canProceedProfile}
                    className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:bg-white/[0.06] disabled:text-ink-muted disabled:opacity-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "socials" && (
            <motion.div
              key="socials"
              custom={slideDir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Connect your socials</h1>
                <p className="mt-2 text-sm text-ink-muted">
                  Brands look at this first. Add at least one account.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
                  <input
                    type="text"
                    placeholder="Instagram username"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    onBlur={() => markTouched("instagram")}
                    className={fieldClassesPl(fieldState("instagram", instagram.trim().length > 0))}
                  />
                  {instagram.trim() && (
                    <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                  )}
                </div>
                <div className="relative">
                  <Music2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
                  <input
                    type="text"
                    placeholder="TikTok username"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    onBlur={() => markTouched("tiktok")}
                    className={fieldClassesPl(fieldState("tiktok", tiktok.trim().length > 0))}
                  />
                  {tiktok.trim() && (
                    <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                  )}
                </div>
                {touched["instagram"] && touched["tiktok"] && !canProceedSocials && (
                  <p className="text-xs text-red-400">Add at least one social handle before continuing.</p>
                )}
                <p className="text-[11px] text-ink-dim">You can add more handles later from your dashboard.</p>
              </div>

              <div className="mt-6">
                <PreviewCard
                  avatarUrl={avatarLocalUrl ?? avatarUrl}
                  fullName={fullName}
                  sport={sport}
                  school={school}
                  classYear={classYear}
                  position={position}
                  bio={bio}
                  username={username}
                  instagram={instagram}
                  tiktok={tiktok}
                  stats={stats}
                />
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={goBack}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-ink transition-all hover:bg-white/[0.05]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!canProceedSocials}
                    className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "stats" && (
            <motion.div
              key="stats"
              custom={slideDir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Show your numbers</h1>
                <p className="mt-2 text-sm text-ink-muted">
                  At least one stat is required. The first 3 appear on the front of your card.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) =>
                        setStats((prev) => prev.map((s, j) => (j === i ? { ...s, label: e.target.value } : s)))
                      }
                      placeholder="Label (e.g., PPG)"
                      maxLength={50}
                      className="w-1/2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) =>
                        setStats((prev) => prev.map((s, j) => (j === i ? { ...s, value: e.target.value } : s)))
                      }
                      placeholder="Value (e.g., 18.4)"
                      maxLength={50}
                      className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                    />
                    <button
                      onClick={() => setStats((prev) => prev.filter((_, j) => j !== i))}
                      className="rounded-lg border border-white/[0.06] p-2 text-ink-dim hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {stats.length < 10 && (
                  <button
                    onClick={() => setStats((prev) => [...prev, { label: "", value: "" }])}
                    className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add stat
                  </button>
                )}
              </div>

              {availableStatTemplates.length > 0 && stats.length < 10 && (
                <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-xs font-medium text-ink-muted mb-2">Quick add {sport} stats:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableStatTemplates.slice(0, 8).map((t) => (
                      <button
                        key={t.label}
                        onClick={() => setStats((prev) => [...prev, { label: t.label, value: "" }])}
                        className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-ink-muted hover:border-accent/40 hover:text-accent transition-colors"
                        title={t.example}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {stats.length > 0 && !canProceedStats && (
                <p className="mt-3 text-xs text-red-400">Fill in the label and value for at least one stat.</p>
              )}

              <div className="mt-6">
                <PreviewCard
                  avatarUrl={avatarLocalUrl ?? avatarUrl}
                  fullName={fullName}
                  sport={sport}
                  school={school}
                  classYear={classYear}
                  position={position}
                  bio={bio}
                  username={username}
                  instagram={instagram}
                  tiktok={tiktok}
                  stats={stats}
                />
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={goBack}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-ink transition-all hover:bg-white/[0.05]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    onClick={goNext}
                    disabled={!canProceedStats}
                    className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div
              key="details"
              custom={slideDir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Finish your card</h1>
                <p className="mt-2 text-sm text-ink-muted">
                  Links, highlights, and a way to reach you &mdash; all required so nothing is missing.
                </p>
              </div>

              <div className="mt-8 space-y-8">
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Link2 className="h-4 w-4 text-ink-dim" />
                    <h2 className="text-sm font-semibold text-ink">Links <span className="text-accent">*</span></h2>
                  </div>
                  <div className="space-y-2.5">
                    {links.map((link, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) =>
                            setLinks((prev) => prev.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))
                          }
                          placeholder="Label (e.g., Hudl)"
                          maxLength={100}
                          className="w-2/5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) =>
                            setLinks((prev) => prev.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)))
                          }
                          placeholder="https://..."
                          maxLength={500}
                          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                        />
                        <button
                          onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
                          className="rounded-lg border border-white/[0.06] p-2 text-ink-dim hover:text-red-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {links.length < 3 && (
                    <button
                      onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
                      className="mt-2.5 flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add link
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Play className="h-4 w-4 text-ink-dim" />
                    <h2 className="text-sm font-semibold text-ink">Highlights <span className="text-accent">*</span></h2>
                  </div>
                  <div className="space-y-2.5">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={h.title}
                          onChange={(e) =>
                            setHighlights((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                          }
                          placeholder="Title (e.g., Junior Season Highlights)"
                          maxLength={100}
                          className="w-2/5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                        />
                        <input
                          type="url"
                          value={h.url}
                          onChange={(e) =>
                            setHighlights((prev) => prev.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                          }
                          placeholder="https://..."
                          maxLength={500}
                          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                        />
                        <button
                          onClick={() => setHighlights((prev) => prev.filter((_, j) => j !== i))}
                          className="rounded-lg border border-white/[0.06] p-2 text-ink-dim hover:text-red-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {highlights.length < 3 && (
                    <button
                      onClick={() => setHighlights((prev) => [...prev, { title: "", url: "" }])}
                      className="mt-2.5 flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add highlight
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Mail className="h-4 w-4 text-ink-dim" />
                    <h2 className="text-sm font-semibold text-ink">Contact <span className="text-accent">*</span></h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="detail_email" className="mb-1 block text-sm font-medium text-ink-muted">
                        Contact Email
                      </label>
                      <input
                        id="detail_email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contact@yourname.com"
                        maxLength={200}
                        className={`w-full rounded-lg border bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-ink-dim focus:outline-none ${contactEmailInvalid ? "border-red-500/60 focus:border-red-500/60" : "border-white/[0.08] focus:border-accent/40"}`}
                      />
                      {contactEmailInvalid && (
                        <p className="mt-1 text-[11px] text-red-400">Please enter a valid email address.</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="detail_phone" className="mb-1 block text-sm font-medium text-ink-muted">
                        Contact Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
                        <input
                          id="detail_phone"
                          type="tel"
                          inputMode="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(formatPhone(e.target.value))}
                          placeholder="+1 (555) 000-0000"
                          maxLength={17}
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-ink-dim">
                      Provide an email or phone number (with area code) so brands and fans can reach you directly.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={goBack}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-ink transition-all hover:bg-white/[0.05]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={saving || !canProceedDetails}
                    className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Launch my card
                        <Sparkles className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
                {!canProceedDetails && (
                  <p className="text-center text-xs text-red-400/80">
                    {!hasLinks && !hasHighlights && !hasContact
                      ? "Add at least one link, one highlight, and a contact method."
                      : !hasLinks
                        ? "Add at least one link."
                        : !hasHighlights
                          ? "Add at least one highlight."
                          : !hasContact
                            ? "Add a contact email or phone number."
                            : "Fix the highlighted fields above."}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              custom={slideDir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
              onAnimationComplete={() => {
                fireCelebration();
                setTimeout(() => router.push("/dashboard"), 5000);
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.35 }}
                >
                  <Check className="h-10 w-10 text-accent" strokeWidth={2.5} />
                </motion.div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold tracking-tight"
              >
                Your card is live!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-3 text-sm text-ink-muted"
              >
                Share your link with fans, brands, and sponsors.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-2 text-sm"
              >
                <span className="text-accent font-semibold">athleteos.app/{username}</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-6"
              >
                <button
                  onClick={() => {
                    const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://athleteos.app"}/${username}`;
                    navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-ink transition-all hover:bg-white/[0.06]"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 text-accent" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy link
                    </>
                  )}
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
                className="mt-8 flex flex-col gap-3"
              >
                <a
                  href={`/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] flex items-center justify-center gap-2"
                >
                  View my card
                  <ArrowRight className="h-4 w-4" />
                </a>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-ink transition-all hover:bg-white/[0.05]"
                >
                  Go to dashboard
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
