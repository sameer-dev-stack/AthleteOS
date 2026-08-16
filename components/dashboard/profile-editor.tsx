"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Loader2, Plus, X, Save, BarChart3, Link2, Play, Palette, Check,
  Trophy, Zap, Target, Timer, GraduationCap, Medal, TrendingUp, Percent, Heart, Star, Lock
} from "lucide-react";
import { updateProfile, updateTheme, type Profile } from "@/lib/actions/profile";
import { resolvePlan } from "@/lib/referral-reward";
import { EmptyState } from "./empty-state";
import { ThemePicker } from "./theme-picker";
import { AvatarUpload } from "@/components/avatar-upload";
import { getStatTemplatesForSport } from "@/lib/sport-stat-templates";
import { SPORT_CONFIG, getPositionsForSport } from "@/lib/sport-config";

type Tab = "bio" | "stats" | "links" | "social" | "highlights" | "contact" | "theme";

type Props = {
  profile: Profile;
  onSaved?: (profile: Profile) => void;
};

const TABS: { id: Tab; label: string; icon?: typeof Palette }[] = [
  { id: "bio", label: "Bio" },
  { id: "stats", label: "Stats" },
  { id: "links", label: "Links" },
  { id: "social", label: "Social" },
  { id: "highlights", label: "Highlights" },
  { id: "contact", label: "Contact" },
  { id: "theme", label: "Theme", icon: Palette },
];

const SOCIAL_PLATFORMS = [
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "johndoe",
    prefixes: ["instagram.com/", "www.instagram.com/"],
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    placeholder: "johndoe",
    prefixes: ["twitter.com/", "x.com/", "www.twitter.com/", "www.x.com/"],
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "johndoe",
    prefixes: ["tiktok.com/@", "www.tiktok.com/@", "tiktok.com/", "www.tiktok.com/"],
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "@johndoe",
    prefixes: ["youtube.com/@", "www.youtube.com/@", "youtube.com/", "www.youtube.com/"],
  },
] as const;

/** Strip protocol + domain prefix from a social handle if the user pasted a full URL */
function cleanSocialHandle(value: string, prefixes: readonly string[]): string {
  let v = value.trim();
  if (!v) return v;
  // Repeat until stable to handle doubled URLs (e.g. site.com/site.com/user)
  for (let i = 0; i < 5; i++) {
    let changed = false;
    const lower = v.toLowerCase();
    if (/^https?:\/\//i.test(v)) {
      v = v.replace(/^https?:\/\//i, "");
      changed = true;
    } else if (/^www\./i.test(v)) {
      v = v.replace(/^www\./i, "");
      changed = true;
    } else {
      const matched = prefixes.find((p) => lower.startsWith(p.toLowerCase()));
      if (matched) {
        v = v.slice(matched.length);
        changed = true;
      }
    }
    if (!changed) break;
  }
  // Keep only the first path segment (drop trailing slash, path, query)
  const slash = v.indexOf("/");
  if (slash !== -1) v = v.slice(0, slash);
  // Card prefixes add "@" where needed, so strip any leading/trailing @ and dots
  v = v.replace(/^@+/, "").replace(/\.+$/, "");
  return v;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

// Keep only digits and auto-format to US-style "+1 (999) 999-9999".
// International numbers (more than 10 digits) fall back to a "+<digits>" string.
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

export function DashboardEditor({ profile, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>("bio");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab rail scroll state: fades + auto-scroll active tab into view
  const tabRailRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const [tabCanScrollLeft, setTabCanScrollLeft] = useState(false);
  const [tabCanScrollRight, setTabCanScrollRight] = useState(false);

  const updateTabScrollState = useCallback(() => {
    const el = tabRailRef.current;
    if (!el) return;
    setTabCanScrollLeft(el.scrollLeft > 2);
    setTabCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = tabRailRef.current;
    if (!el) return;
    updateTabScrollState();
    el.addEventListener("scroll", updateTabScrollState, { passive: true });
    const ro = new ResizeObserver(updateTabScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateTabScrollState);
      ro.disconnect();
    };
  }, [updateTabScrollState]);

  // When a tab is selected, center it in the rail if it's off-screen
  useEffect(() => {
    const container = tabRailRef.current;
    const activeBtn = tabButtonRefs.current[tab];
    if (!container || !activeBtn) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    if (btnRect.left < containerRect.left || btnRect.right > containerRect.right) {
      const delta = btnRect.left - containerRect.left - (containerRect.width - btnRect.width) / 2;
      container.scrollBy({ left: delta, behavior: "smooth" });
    }
  }, [tab]);

  // Content state
  const [bio, setBio] = useState(profile.bio || "");
  const [stats, setStats] = useState(profile.stats || []);
  const [links, setLinks] = useState(profile.links || []);
  const [social, setSocial] = useState(profile.social || {});
  const [highlights, setHighlights] = useState(profile.highlights || []);
  const [contactEmail, setContactEmail] = useState(profile.contact_email || "");
  const [contactPhone, setContactPhone] = useState(profile.contact_phone || "");
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [sport, setSport] = useState(profile.sport || "");
  const [position, setPosition] = useState(profile.position || "");
  const [school, setSchool] = useState(profile.school || "");
  const [classYear, setClassYear] = useState(profile.class_year || "");

  // Theme state — unified into main save
  const [accent, setAccent] = useState(profile.theme_accent || "#C6FF3D");

  // Stable stringified baselines for change detection
  const profileBio = profile.bio || "";
  const profileStatsStr = JSON.stringify(profile.stats || []);
  const profileLinksStr = JSON.stringify(profile.links || []);
  const profileSocialStr = JSON.stringify(profile.social || {});
  const profileHighlightsStr = JSON.stringify(profile.highlights || []);
  const profileAccent = profile.theme_accent || "#C6FF3D";
  const profileContactEmail = profile.contact_email || "";
  const profileContactPhone = profile.contact_phone || "";
  const profileFullName = profile.full_name || "";
  const profileUsername = profile.username || "";
  const profileSport = profile.sport || "";
  const profilePosition = profile.position || "";
  const profileSchool = profile.school || "";
  const profileClassYear = profile.class_year || "";

  useEffect(() => {
    queueMicrotask(() => {
      setBio(profile.bio || "");
      setStats(profile.stats || []);
      setLinks(profile.links || []);
      setSocial(profile.social || {});
      setHighlights(profile.highlights || []);
      setAccent(profile.theme_accent || "#C6FF3D");
      setContactEmail(profile.contact_email || "");
      setContactPhone(profile.contact_phone || "");
      setFullName(profile.full_name || "");
      setUsername(profile.username || "");
      setSport(profile.sport || "");
      setPosition(profile.position || "");
      setSchool(profile.school || "");
      setClassYear(profile.class_year || "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileBio, profileStatsStr, profileLinksStr, profileSocialStr, profileHighlightsStr, profileAccent, profileContactEmail, profileContactPhone, profileFullName, profileUsername, profileSport, profilePosition, profileSchool, profileClassYear]);

  const contentChanged =
    bio !== profileBio ||
    JSON.stringify(stats) !== profileStatsStr ||
    JSON.stringify(links) !== profileLinksStr ||
    JSON.stringify(social) !== profileSocialStr ||
    JSON.stringify(highlights) !== profileHighlightsStr ||
    contactEmail !== profileContactEmail ||
    contactPhone !== profileContactPhone ||
    fullName !== profileFullName ||
    username !== profileUsername ||
    sport !== profileSport ||
    position !== profilePosition ||
    school !== profileSchool ||
    classYear !== profileClassYear;

  const themeChanged = accent !== profileAccent;
  const hasChanges = contentChanged || themeChanged;
  const contactEmailInvalid = contactEmail.trim().length > 0 && !isValidEmail(contactEmail);
  const usernameInvalid = username.trim().length > 0 && !/^[a-zA-Z0-9_-]+$/.test(username.trim());

  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    if (contactEmailInvalid) {
      setSaving(false);
      setError("Please enter a valid email address.");
      return;
    }

    if (usernameInvalid) {
      setSaving(false);
      setError("Username can only contain letters, numbers, underscores, and dashes.");
      return;
    }

    const cleanLinks = links
      .map((l) => {
        let url = l.url.trim();
        if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
        return { label: l.label.trim(), url };
      })
      .filter((l) => l.label && l.url && /^https?:\/\/.+/.test(l.url));

    const cleanHighlights = highlights
      .map((h) => {
        let url = h.url.trim();
        if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
        return { title: h.title.trim(), url };
      })
      .filter((h) => h.title && h.url && /^https?:\/\/.+/.test(h.url));

    // Clean social handles — strip any accidentally pasted full URLs
    const cleanSocial: Record<string, string | undefined> = {};
    for (const platform of SOCIAL_PLATFORMS) {
      const raw = (social as Record<string, string | undefined>)[platform.key];
      if (raw) {
        const cleaned = cleanSocialHandle(raw, platform.prefixes);
        if (cleaned) cleanSocial[platform.key] = cleaned;
      }
    }

    // Run content save and theme save in parallel when both changed
    const promises: Promise<unknown>[] = [];

    if (contentChanged) {
      promises.push(
        updateProfile({
          full_name: fullName.trim() || null,
          username: username.trim() || null,
          sport: sport.trim() || null,
          position: position.trim() || null,
          school: school.trim() || null,
          class_year: classYear.trim() || null,
          bio: bio.trim() || null,
          stats: stats.filter((s) => {
            if (!s.label.trim() || !s.value.trim()) return false;
            const PLACEHOLDER_STATS = /^(test|asdf|foo|bar|baz|aaa|123|000|xxx|yyy|zzz|na|n\/a|none|sample|demo|example|temp|placeholder)$/i;
            return !PLACEHOLDER_STATS.test(s.label.trim()) && !PLACEHOLDER_STATS.test(s.value.trim());
          }),
          links: cleanLinks,
          social: cleanSocial,
          highlights: cleanHighlights,
          contact_email: contactEmail.trim() || null,
          contact_phone: contactPhone.trim() || null,
        })
      );
    }

    if (themeChanged) {
      promises.push(updateTheme(accent, profile.theme_layout || "classic"));
    }

    const results = await Promise.all(promises);
    setSaving(false);

    // Check any failure
    const failed = results.find((r) => r && typeof r === "object" && "ok" in r && !(r as { ok: boolean }).ok);
    if (failed) {
      setError((failed as { error?: string }).error || "Failed to save");
      return;
    }

    // Use the last successful result that has profile data
    const lastOk = [...results].reverse().find((r) => r && typeof r === "object" && "ok" in r && (r as { ok: boolean }).ok);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (lastOk && (lastOk as { data?: Profile }).data) {
      onSaved?.((lastOk as { data: Profile }).data);
    } else {
      onSaved?.(profile);
    }
  }, [bio, stats, links, social, highlights, accent, contactEmail, contactPhone, fullName, username, sport, position, school, classYear, contentChanged, themeChanged, contactEmailInvalid, usernameInvalid, onSaved, profile]);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges || contactEmailInvalid || usernameInvalid}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
        </div>

        <div className="relative mt-4">
          <div
            ref={tabRailRef}
            className="flex gap-1 overflow-x-auto scrollbar-none overscroll-x-contain"
          >
            {TABS.map((t) => {
              let isComplete = false;
              if (t.id === "bio") isComplete = !!bio && bio.length >= 15;
              else if (t.id === "stats") isComplete = stats.length >= 1;
              else if (t.id === "links") isComplete = links.length >= 1;
              else if (t.id === "social") isComplete = !!(social.instagram || social.twitter || social.tiktok || social.youtube);
              else if (t.id === "highlights") isComplete = highlights.length >= 1;
              else if (t.id === "contact") isComplete = !!(contactEmail || contactPhone);
              else if (t.id === "theme") isComplete = accent !== "#C6FF3D";

              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabButtonRefs.current[t.id] = el;
                  }}
                  onClick={() => setTab(t.id)}
                  className={`flex-shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${tab === t.id
                      ? "bg-accent/15 text-accent"
                      : "text-ink-muted hover:bg-white/[0.04] hover:text-white"
                    }`}
                >
                  {t.label}
                  {isComplete && (
                    <Check className="ml-1.5 inline-block h-3 w-3 text-accent" />
                  )}
                  {t.id === "theme" && themeChanged && !isComplete && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Edge fades indicating the rail continues horizontally */}
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#111113] to-transparent transition-opacity duration-200 ${tabCanScrollLeft ? "opacity-100" : "opacity-0"}`}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#111113] to-transparent transition-opacity duration-200 ${tabCanScrollRight ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {tab === "bio" && (
          <BioEditor
            profile={profile}
            fullName={fullName}
            onFullNameChange={setFullName}
            username={username}
            onUsernameChange={setUsername}
            sport={sport}
            onSportChange={setSport}
            position={position}
            onPositionChange={setPosition}
            school={school}
            onSchoolChange={setSchool}
            classYear={classYear}
            onClassYearChange={setClassYear}
            bio={bio}
            onChange={setBio}
            onSaved={onSaved}
          />
        )}

        {tab === "stats" && (
          <StatsEditor
            stats={stats}
            onChange={setStats}
            sport={profile.sport ?? undefined}
            isPro={resolvePlan(profile.plan, profile.extended_pro_until) === "pro"}
          />
        )}

        {tab === "links" && (
          <LinksEditor links={links} onChange={setLinks} />
        )}

        {tab === "social" && (
          <SocialEditor social={social} onChange={setSocial} />
        )}

        {tab === "highlights" && (
          <HighlightsEditor highlights={highlights} onChange={setHighlights} />
        )}

        {tab === "contact" && (
          <ContactEditor
            email={contactEmail}
            phone={contactPhone}
            onEmailChange={setContactEmail}
            onPhoneChange={setContactPhone}
          />
        )}

        {tab === "theme" && (
          <ThemePicker
            accent={accent}
            onAccentChange={setAccent}
            isPro={resolvePlan(profile.plan, profile.extended_pro_until) === "pro"}
          />
        )}
      </div>

      {hasChanges && (
        <div className="fixed bottom-4 inset-x-4 z-50 lg:hidden">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges || contactEmailInvalid || usernameInvalid}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg shadow-lg shadow-accent/20 transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}

function BioEditor({
  profile,
  fullName,
  onFullNameChange,
  username,
  onUsernameChange,
  sport,
  onSportChange,
  position,
  onPositionChange,
  school,
  onSchoolChange,
  classYear,
  onClassYearChange,
  bio,
  onChange,
  onSaved,
}: {
  profile: Profile;
  fullName: string;
  onFullNameChange: (v: string) => void;
  username: string;
  onUsernameChange: (v: string) => void;
  sport: string;
  onSportChange: (v: string) => void;
  position: string;
  onPositionChange: (v: string) => void;
  school: string;
  onSchoolChange: (v: string) => void;
  classYear: string;
  onClassYearChange: (v: string) => void;
  bio: string;
  onChange: (v: string) => void;
  onSaved?: (profile: Profile) => void;
}) {
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);

  async function handleAvatarUpload(newUrl: string) {
    setAvatarUrl(newUrl);
    setAvatarSaving(true);
    setAvatarError(null);
    const result = await updateProfile({ avatar_url: newUrl });
    setAvatarSaving(false);
    if (!result.ok) {
      setAvatarError(result.error || "Failed to save photo");
    } else if (result.data) {
      onSaved?.(result.data);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <div>
        <label className="mb-3 block text-sm font-medium text-ink-muted">
          Profile Photo
        </label>
        <div className="flex items-center gap-5">
          <AvatarUpload
            currentUrl={avatarUrl}
            userId={profile.id}
            onUpload={handleAvatarUpload}
            size="lg"
          />
          <div className="space-y-1">
            <p className="text-sm text-white/60">
              {avatarSaving ? (
                <span className="text-accent/70">Saving photo...</span>
              ) : avatarUrl ? (
                "Hover over your photo to change it"
              ) : (
                "Click the circle to upload a photo"
              )}
            </p>
            <p className="text-xs text-white/25">JPG, PNG or GIF · Max 2 MB</p>
            {avatarError && (
              <p className="text-xs text-red-400">{avatarError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Name and Username */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="e.g. Jaylen Carter"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Username
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-sm text-white/20 select-none">nilcard.app/</span>
            <input
              type="text"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="johndoe"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-[108px] pr-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Sport and Position */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Sport
          </label>
          <select
            value={sport}
            onChange={(e) => {
              onSportChange(e.target.value);
              onPositionChange("");
            }}
            className="w-full rounded-xl border border-white/[0.08] bg-neutral-900 px-4 py-3 text-sm text-white focus:border-accent/40 focus:outline-none"
          >
            <option value="">Select a Sport</option>
            {Object.values(SPORT_CONFIG).map((cfg) => (
              <option key={cfg.code} value={cfg.label}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Position
          </label>
          {sport ? (
            <select
              value={position}
              onChange={(e) => onPositionChange(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-neutral-900 px-4 py-3 text-sm text-white focus:border-accent/40 focus:outline-none"
            >
              <option value="">Select a Position</option>
              {getPositionsForSport(sport).map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={position}
              onChange={(e) => onPositionChange(e.target.value)}
              placeholder="Select sport first"
              disabled
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.01] px-4 py-3 text-sm text-white/30 cursor-not-allowed"
            />
          )}
        </div>
      </div>

      {/* School and Class Year */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            School
          </label>
          <input
            type="text"
            value={school}
            onChange={(e) => onSchoolChange(e.target.value)}
            placeholder="e.g. Stanford University"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Class Year
          </label>
          <select
            value={classYear}
            onChange={(e) => onClassYearChange(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-neutral-900 px-4 py-3 text-sm text-white focus:border-accent/40 focus:outline-none"
          >
            <option value="">Select Class Year</option>
            <option value="FR">FR (Freshman)</option>
            <option value="SO">SO (Sophomore)</option>
            <option value="JR">JR (Junior)</option>
            <option value="SR">SR (Senior)</option>
            <option value="GS">GS (Graduate Student)</option>
            <option value="PRO">PRO (Professional)</option>
          </select>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Bio */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-muted">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => onChange(e.target.value)}
          placeholder="D1 guard at Stanford. Game-changer on and off the court."
          rows={3}
          maxLength={280}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none resize-none"
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-[11px] text-ink-dim">
            {bio.length < 15 && bio.length > 0 ? (
              <span className="text-amber-400/70">
                Minimum 15 characters to show on your card ({15 - bio.length} more needed)
              </span>
            ) : (
              <span className="text-white/20">Minimum 15 characters to appear on your card</span>
            )}
          </p>
          <p className="text-[11px] text-ink-dim">{bio.length}/280</p>
        </div>
      </div>
    </div>
  );
}

const STAT_ICONS = [
  { name: "trophy", Icon: Trophy, label: "Trophy" },
  { name: "zap", Icon: Zap, label: "Speed/Power" },
  { name: "target", Icon: Target, label: "Accuracy" },
  { name: "timer", Icon: Timer, label: "Time" },
  { name: "graduationcap", Icon: GraduationCap, label: "Academic" },
  { name: "medal", Icon: Medal, label: "Medal" },
  { name: "trendingup", Icon: TrendingUp, label: "Growth" },
  { name: "percent", Icon: Percent, label: "Percentage" },
  { name: "heart", Icon: Heart, label: "Heart" },
  { name: "star", Icon: Star, label: "Star" },
];

function StatsEditor({
  stats,
  onChange,
  sport,
  isPro,
}: {
  stats: { label: string; value: string; icon?: string | null }[];
  onChange: (v: { label: string; value: string; icon?: string | null }[]) => void;
  sport?: string;
  isPro: boolean;
}) {
  const templates = sport ? getStatTemplatesForSport(sport) : null;
  const usedLabels = new Set(stats.map((s) => s.label.toLowerCase()));
  const availableTemplates = templates?.filter((t) => !usedLabels.has(t.label.toLowerCase())) || [];
  const [activePicker, setActivePicker] = useState<number | null>(null);

  function addStat() {
    if (stats.length >= 10) return;
    onChange([...stats, { label: "", value: "", icon: null }]);
  }

  function addFromTemplate(template: { label: string; placeholder: string; example: string }) {
    if (stats.length >= 10) return;
    onChange([...stats, { label: template.label, value: "", icon: null }]);
  }

  function updateStat(index: number, field: "label" | "value" | "icon", value: string | null) {
    const updated = [...stats];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function removeStat(index: number) {
    onChange(stats.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-dim">
        Add key stats that show up on your public card (e.g., PPG, GPA, 40-yard
        dash). The first 3 are featured on the front face of your card — reorder
        by removing and re-adding, or clear a row to push others up.
      </p>
      {stats.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No stats yet"
          description="Add your key numbers — points per game, GPA, 40-yard dash time. Stats make your card stand out."
          action={{ label: "Add your first stat", onClick: addStat }}
        />
      ) : (
        <>
          <div className="flex items-center gap-2 px-1">
            <span className="w-9 shrink-0" />
            <span className="w-9 shrink-0 text-[10px] font-bold uppercase tracking-widest text-ink-dim text-center">
              Icon
            </span>
            <span className="w-[45%] text-[10px] font-bold uppercase tracking-widest text-ink-dim">
              Stat Label
            </span>
            <span className="w-[45%] text-[10px] font-bold uppercase tracking-widest text-ink-dim">
              Value
            </span>
            <span className="w-9 shrink-0" />
          </div>
          {stats.map((stat, i) => {
            const selectedIconObj = STAT_ICONS.find(item => item.name === (stat.icon || "").toLowerCase()) || STAT_ICONS[0];
            const SelectedIcon = selectedIconObj.Icon;

            return (
              <div key={i} className="flex items-center gap-2">
                {i < 3 ? (
                  <span
                    className="flex w-9 shrink-0 justify-center rounded-md border border-accent/30 bg-accent/10 text-[8px] font-bold uppercase tracking-wide text-accent py-1"
                    title="Featured on the front of your card"
                  >
                    ★
                  </span>
                ) : (
                  <span className="w-9 shrink-0" />
                )}

                {/* Icon Selector / Locked state */}
                {!isPro ? (
                  <button
                    type="button"
                    disabled
                    className="flex items-center justify-center h-9 w-9 rounded-lg border border-white/[0.06] bg-white/[0.01] text-white/30 cursor-not-allowed relative flex-shrink-0"
                    title="Pro Feature: Customize stat icons"
                  >
                    <SelectedIcon className="h-4 w-4 opacity-40" />
                    <Lock className="absolute -bottom-1 -right-1 h-3 w-3 text-amber-500/70" />
                  </button>
                ) : (
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setActivePicker(activePicker === i ? null : i)}
                      className="flex items-center justify-center h-9 w-9 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-accent/40 hover:text-accent transition-colors"
                      title="Choose stat icon"
                    >
                      <SelectedIcon className="h-4 w-4" />
                    </button>
                    {activePicker === i && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActivePicker(null)} />
                        <div className="absolute left-0 mt-1.5 z-20 grid grid-cols-5 gap-1 p-2 rounded-xl border border-white/[0.08] bg-neutral-950 shadow-2xl w-[220px]">
                          {STAT_ICONS.map((opt) => {
                            const OptIcon = opt.Icon;
                            return (
                              <button
                                key={opt.name}
                                type="button"
                                onClick={() => {
                                  updateStat(i, "icon", opt.name);
                                  setActivePicker(null);
                                }}
                                className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                                  stat.icon === opt.name
                                    ? "bg-accent/20 text-accent"
                                    : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                                }`}
                                title={opt.label}
                              >
                                <OptIcon className="h-4 w-4" />
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <input
                  type="text"
                  value={stat.label}
                  onChange={(e) => updateStat(i, "label", e.target.value)}
                  placeholder="e.g., 40-yard"
                  maxLength={50}
                  className="w-[45%] rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                />
                <input
                  type="text"
                  value={stat.value}
                  onChange={(e) => updateStat(i, "value", e.target.value)}
                  placeholder="e.g., 4.5s"
                  maxLength={50}
                  className="w-[45%] rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                />
                <button
                  onClick={() => removeStat(i)}
                  className="w-9 shrink-0 rounded-lg border border-white/[0.06] p-2 text-ink-dim hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {stats.length < 10 && (
            <button
              onClick={addStat}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add stat
            </button>
          )}
          {availableTemplates.length > 0 && stats.length < 10 && (
            <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-xs font-medium text-ink-muted mb-2">
                Quick add {sport} stats:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableTemplates.slice(0, 8).map((t) => (
                  <button
                    key={t.label}
                    onClick={() => addFromTemplate(t)}
                    className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-ink-muted hover:border-accent/40 hover:text-accent transition-colors"
                    title={t.example}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LinksEditor({
  links,
  onChange,
}: {
  links: { label: string; url: string }[];
  onChange: (v: { label: string; url: string }[]) => void;
}) {
  function addLink() {
    if (links.length >= 3) return;
    onChange([...links, { label: "", url: "" }]);
  }

  function updateLink(index: number, field: "label" | "url", value: string) {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-dim">
        Add links you want on your public card (Hudl, Instagram, merch store,
        etc.). Limit of 3 links.
      </p>
      {links.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No links yet"
          description="Add your Hudl, Instagram, merch store, or any other link you want visitors to see."
          action={{ label: "Add your first link", onClick: addLink }}
        />
      ) : (
        <>
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(i, "label", e.target.value)}
                placeholder="Label (e.g., Hudl)"
                maxLength={100}
                className="w-2/5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(i, "url", e.target.value)}
                placeholder="https://..."
                maxLength={500}
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
              />
              <button
                onClick={() => removeLink(i)}
                className="rounded-lg border border-white/[0.06] p-2 text-ink-dim hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {links.length < 3 && (
            <button
              onClick={addLink}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add link
            </button>
          )}
        </>
      )}
    </div>
  );
}

function SocialEditor({
  social,
  onChange,
}: {
  social: { twitter?: string; instagram?: string; tiktok?: string; youtube?: string };
  onChange: (v: { twitter?: string; instagram?: string; tiktok?: string; youtube?: string }) => void;
}) {
  function updatePlatform(key: string, value: string) {
    const platform = SOCIAL_PLATFORMS.find((p) => p.key === key);
    const cleaned = platform ? cleanSocialHandle(value, platform.prefixes) : value;
    onChange({ ...social, [key]: cleaned || undefined });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-dim">
        Add your social media handles. These appear as clickable icons on your public card.
      </p>
      {SOCIAL_PLATFORMS.map((p) => (
        <div key={p.key}>
          <label className="mb-1 block text-sm font-medium text-ink-muted">
            {p.label}
          </label>
          <input
            type="text"
            value={(social as Record<string, string | undefined>)[p.key] || ""}
            onChange={(e) => updatePlatform(p.key, e.target.value)}
            placeholder={p.placeholder}
            maxLength={50}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-white/50">
            Handle only — e.g. <span className="font-semibold text-white/70">{p.placeholder}</span>. If you paste a full link, we&apos;ll trim it to your handle automatically.
          </p>
        </div>
      ))}
    </div>
  );
}

function HighlightsEditor({
  highlights,
  onChange,
}: {
  highlights: { title: string; url: string }[];
  onChange: (v: { title: string; url: string }[]) => void;
}) {
  function addHighlight() {
    if (highlights.length >= 2) return;
    onChange([...highlights, { title: "", url: "" }]);
  }

  function updateHighlight(index: number, field: "title" | "url", value: string) {
    const updated = [...highlights];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function removeHighlight(index: number) {
    onChange(highlights.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-dim">
        Add highlight videos or articles (YouTube, Hudl, news features, etc.). Limit of 2 highlights.
      </p>
      {highlights.length === 0 ? (
        <EmptyState
          icon={Play}
          title="No highlights yet"
          description="Showcase your best moments — game highlights, news features, or training videos."
          action={{ label: "Add your first highlight", onClick: addHighlight }}
        />
      ) : (
        <>
          {highlights.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={h.title}
                onChange={(e) => updateHighlight(i, "title", e.target.value)}
                placeholder="Title (e.g., Junior Season Highlights)"
                maxLength={100}
                className="w-2/5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
              />
              <input
                type="url"
                value={h.url}
                onChange={(e) => updateHighlight(i, "url", e.target.value)}
                placeholder="https://..."
                maxLength={500}
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
              />
              <button
                onClick={() => removeHighlight(i)}
                className="rounded-lg border border-white/[0.06] p-2 text-ink-dim hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {highlights.length < 2 && (
            <button
              onClick={addHighlight}
              className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add highlight
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ContactEditor({
  email,
  phone,
  onEmailChange,
  onPhoneChange,
}: {
  email: string;
  phone: string;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
}) {
  const emailError = email.trim().length > 0 && !isValidEmail(email);
  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-dim">
        Provide contact information for brands, scouts, or fans to reach you directly.
      </p>
      <div>
        <label htmlFor="contact_email" className="mb-1 block text-sm font-medium text-ink-muted">
          Contact Email
        </label>
        <input
          id="contact_email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          onBlur={() => onEmailChange(email.trim())}
          placeholder="contact@yourname.com"
          maxLength={200}
          aria-invalid={emailError}
          className={`w-full rounded-lg border bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:outline-none ${emailError
              ? "border-red-500/60 focus:border-red-500/60"
              : "border-white/[0.08] focus:border-accent/40"
            }`}
        />
        {emailError ? (
          <p className="mt-1 text-[11px] text-red-400">Please enter a valid email address.</p>
        ) : (
          <p className="mt-1 text-[11px] text-white/20">
            This email will be visible to users who click the Contact button on your card.
          </p>
        )}
      </div>
      <div>
        <label htmlFor="contact_phone" className="mb-1 block text-sm font-medium text-ink-muted">
          Contact Phone
        </label>
        <input
          id="contact_phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => onPhoneChange(formatPhone(e.target.value))}
          placeholder="+1 (555) 000-0000"
          maxLength={17}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-white/20">
          Your phone number for direct calls, texts, or WhatsApp. Digits only — formatting is applied automatically.
        </p>
      </div>
    </div>
  );
}
