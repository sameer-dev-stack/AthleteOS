"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AtSign,
  User,
  GraduationCap,
  Copy,
  Instagram,
  Music2,
  Sparkles,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkUsername, updateProfile } from "@/lib/actions/profile";
import { assignFirst500ProBenefit } from "@/lib/actions/first-500-pro";
import { sendWelcomeEmail } from "@/lib/actions/emails";
import { recordReferral } from "@/lib/actions/referrals";
import confetti from "canvas-confetti";
import { Logo } from "@/components/logo";
import { AvatarUpload } from "@/components/avatar-upload";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { VerificationBanner } from "@/components/verification-banner";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";

const SPORTS = [
  "Football", "Basketball", "Baseball", "Soccer", "Track & Field",
  "Swimming", "Volleyball", "Gymnastics", "Wrestling", "Tennis",
  "Lacrosse", "Hockey", "Softball", "Golf", "Cross Country",
  "Fencing", "Rowing", "Rugby", "Esports", "Other",
];

const CLASS_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Grad Student"];

const STEP_META = [
  { key: "username", label: "Username", optional: false },
  { key: "profile", label: "Profile", optional: false },
  { key: "socials", label: "Socials", optional: true },
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
}) {
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
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
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
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
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
    if (username.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
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

  const skipOptional = useCallback(async () => {
    await updateProfile({
      username: username.trim() || undefined,
      full_name: fullName.trim() || undefined,
      sport: sport.trim() || undefined,
      school: school.trim() || undefined,
      class_year: classYear || undefined,
      position: position.trim() || undefined,
      bio: bio.trim() || undefined,
      avatar_url: avatarUrl || undefined,
      onboarding_completed: true,
    });
    setSlideDir(1);
    setStep("done");
  }, [username, fullName, sport, school, classYear, position, bio, avatarUrl]);

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
  const canProceedProfile = fullName.trim().length > 0 && sport.length > 0 && school.trim().length > 0;

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
        profile_published: true,
        onboarding_completed: true,
        referred_by: referredBy,
      });
      if (result.ok) {
        trackFunnel("onboarding_complete");
        assignFirst500ProBenefit().catch(() => {});
        if (referredBy) {
          recordReferral(referredBy).then((r) => {
            if (!r.ok) console.warn("[referral] recordReferral failed:", r.error);
          }).catch((e) => console.error("[referral] recordReferral exception:", e));
        }
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          sendWelcomeEmail(user.email, fullName.trim().split(" ")[0], username).catch(() => {});
        }
        setSlideDir(1);
        setStep("done");
      } else {
        setError(result.error || "Failed to save profile. Please try again.");
      }
    } catch {
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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <VerificationBanner />
      {showWelcome && <WelcomeModal onDismiss={() => setShowWelcome(false)} />}
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">AthleteOS</span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            {STEP_META.map((s, i) => {
              const isComplete = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                        isCurrent
                          ? "bg-accent text-bg scale-110"
                          : isComplete
                          ? "bg-accent/20 text-accent"
                          : "bg-white/[0.06] text-ink-dim"
                      }`}
                    >
                      {isComplete ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-medium transition-colors duration-300 ${
                        isCurrent ? "text-ink" : isComplete ? "text-accent" : "text-ink-dim"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEP_META.length - 1 && (
                    <div
                      className={`h-px w-8 mb-4 transition-colors duration-300 ${
                        i < currentIdx ? "bg-accent/40" : "bg-white/[0.06]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mx-auto max-w-xs mb-8">
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: "0%" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
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

              <div className="mt-8 space-y-4">
                <div>
                  <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ink-muted">
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
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
                      } w-full rounded-xl border bg-white/[0.03] py-3 pl-10 pr-10 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none transition-colors`}
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

              <div className="mt-8 flex flex-col gap-3">
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Build your profile</h1>
                  <p className="mt-2 text-sm text-ink-muted">Tell us about yourself. You can always add more later.</p>
                </div>
                <button
                  onClick={skipOptional}
                  className="flex items-center gap-1.5 text-xs font-medium text-ink-dim hover:text-ink transition-colors rounded-lg border border-white/[0.06] px-3 py-1.5"
                >
                  Skip
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-center">
                  <AvatarUpload
                    currentUrl={avatarUrl}
                    userId={userId}
                    onUpload={setAvatarUrl}
                    size="lg"
                  />
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
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => markTouched("fullName")}
                      placeholder="Maya Reyes"
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

                <div className="grid grid-cols-2 gap-3">
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
                      Position
                    </label>
                    <input
                      id="position"
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="Guard"
                      maxLength={50}
                      className={fieldClasses("idle")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                        placeholder="Stanford"
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
                      Class year
                    </label>
                    <select
                      id="classYear"
                      value={classYear}
                      onChange={(e) => setClassYear(e.target.value)}
                      className={selectClasses("idle")}
                    >
                      <option value="" className="bg-bg">Select year</option>
                      {CLASS_YEARS.map((y) => (
                        <option key={y} value={y} className="bg-bg">{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-ink-muted">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="D1 guard at Stanford. Game-changer on and off the court."
                    rows={3}
                    maxLength={280}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none resize-none transition-colors"
                  />
                  <p className="mt-1 text-right text-[11px] text-ink-dim">{bio.length}/280</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye className="h-3 w-3 text-ink-dim" />
                  <span className="text-[10px] font-medium text-ink-dim uppercase tracking-wider">Live preview</span>
                </div>
                <PreviewCard
                  avatarUrl={avatarUrl}
                  fullName={fullName}
                  sport={sport}
                  school={school}
                  classYear={classYear}
                  position={position}
                  bio={bio}
                  username={username}
                  instagram={instagram}
                  tiktok={tiktok}
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
                    className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    trackFunnel("onboarding_skip_profile");
                    goNext();
                  }}
                  className="text-center text-sm text-ink-dim hover:text-ink transition-colors"
                >
                  Skip for now &mdash; I&apos;ll finish later
                </button>
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Connect your socials</h1>
                  <p className="mt-2 text-sm text-ink-muted">Brands look at this first. Add your most followed account.</p>
                </div>
                <button
                  onClick={skipOptional}
                  className="flex items-center gap-1.5 text-xs font-medium text-ink-dim hover:text-ink transition-colors rounded-lg border border-white/[0.06] px-3 py-1.5"
                >
                  Skip
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-8 space-y-4">
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
                  <input
                    type="text"
                    placeholder="Instagram username"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className={fieldClassesPl(instagram.trim() ? "valid" : "idle")}
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
                    className={fieldClassesPl(tiktok.trim() ? "valid" : "idle")}
                  />
                  {tiktok.trim() && (
                    <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                  )}
                </div>
                <p className="text-[11px] text-ink-dim">Optional &mdash; you can always add these later from your dashboard.</p>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye className="h-3 w-3 text-ink-dim" />
                  <span className="text-[10px] font-medium text-ink-dim uppercase tracking-wider">Live preview</span>
                </div>
                <PreviewCard
                  avatarUrl={avatarUrl}
                  fullName={fullName}
                  sport={sport}
                  school={school}
                  classYear={classYear}
                  position={position}
                  bio={bio}
                  username={username}
                  instagram={instagram}
                  tiktok={tiktok}
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
                    onClick={handleComplete}
                    disabled={saving}
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
