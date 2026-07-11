"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, X, Save, BarChart3, Link2, Play, Palette, Check } from "lucide-react";
import { updateProfile, updateTheme, type Profile } from "@/lib/actions/profile";
import { EmptyState } from "./empty-state";
import { ThemePicker } from "./theme-picker";
import { AvatarUpload } from "@/components/avatar-upload";
import { CoverImageUpload } from "@/components/cover-image-upload";
import { getStatTemplatesForSport } from "@/lib/sport-stat-templates";

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
  // Strip protocol
  v = v.replace(/^https?:\/\//i, "");
  // Strip known domain prefixes
  for (const prefix of prefixes) {
    if (v.toLowerCase().startsWith(prefix.toLowerCase())) {
      v = v.slice(prefix.length);
      break;
    }
  }
  // Strip leading @ for non-youtube platforms (YouTube uses @handle convention)
  return v;
}

export function DashboardEditor({ profile, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>("bio");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Content state
  const [bio, setBio] = useState(profile.bio || "");
  const [stats, setStats] = useState(profile.stats || []);
  const [links, setLinks] = useState(profile.links || []);
  const [social, setSocial] = useState(profile.social || {});
  const [highlights, setHighlights] = useState(profile.highlights || []);
  const [contactEmail, setContactEmail] = useState(profile.contact_email || "");
  const [contactPhone, setContactPhone] = useState(profile.contact_phone || "");

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

  useEffect(() => {
    setBio(profile.bio || "");
    setStats(profile.stats || []);
    setLinks(profile.links || []);
    setSocial(profile.social || {});
    setHighlights(profile.highlights || []);
    setAccent(profile.theme_accent || "#C6FF3D");
    setContactEmail(profile.contact_email || "");
    setContactPhone(profile.contact_phone || "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileBio, profileStatsStr, profileLinksStr, profileSocialStr, profileHighlightsStr, profileAccent, profileContactEmail, profileContactPhone]);

  const contentChanged =
    bio !== profileBio ||
    JSON.stringify(stats) !== profileStatsStr ||
    JSON.stringify(links) !== profileLinksStr ||
    JSON.stringify(social) !== profileSocialStr ||
    JSON.stringify(highlights) !== profileHighlightsStr ||
    contactEmail !== profileContactEmail ||
    contactPhone !== profileContactPhone;

  const themeChanged = accent !== profileAccent;
  const hasChanges = contentChanged || themeChanged;

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
          bio: bio.trim() || null,
          stats: stats.filter((s) => s.label.trim() && s.value.trim()),
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
  }, [bio, stats, links, social, highlights, accent, contactEmail, contactPhone, contentChanged, themeChanged, onSaved, profile]);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
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

        <div className="mt-4 flex gap-1 overflow-x-auto">
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
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  tab === t.id
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
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {tab === "bio" && (
          <BioEditor profile={profile} bio={bio} onChange={setBio} onSaved={onSaved} />
        )}

        {tab === "stats" && (
          <StatsEditor stats={stats} onChange={setStats} sport={profile.sport ?? undefined} />
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
          />
        )}
      </div>

      {hasChanges && (
        <div className="fixed bottom-4 inset-x-4 z-50 lg:hidden">
          <button
            onClick={handleSave}
            disabled={saving}
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
  bio,
  onChange,
  onSaved,
}: {
  profile: Profile;
  bio: string;
  onChange: (v: string) => void;
  onSaved?: (profile: Profile) => void;
}) {
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [coverUrl, setCoverUrl] = useState<string | null>(profile.cover_url ?? null);

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
    <div className="space-y-5">
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

      {/* Cover Image */}
      <CoverImageUpload
        currentUrl={coverUrl}
        userId={profile.id}
        onUpload={async (url) => {
          setCoverUrl(url);
          await updateProfile({ cover_url: url });
        }}
        onRemove={async () => {
          setCoverUrl(null);
          await updateProfile({ cover_url: null });
        }}
      />

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

function StatsEditor({
  stats,
  onChange,
  sport,
}: {
  stats: { label: string; value: string }[];
  onChange: (v: { label: string; value: string }[]) => void;
  sport?: string;
}) {
  const templates = sport ? getStatTemplatesForSport(sport) : null;
  const usedLabels = new Set(stats.map((s) => s.label.toLowerCase()));
  const availableTemplates = templates?.filter((t) => !usedLabels.has(t.label.toLowerCase())) || [];

  function addStat() {
    if (stats.length >= 10) return;
    onChange([...stats, { label: "", value: "" }]);
  }

  function addFromTemplate(template: { label: string; placeholder: string; example: string }) {
    if (stats.length >= 10) return;
    onChange([...stats, { label: template.label, value: "" }]);
  }

  function updateStat(index: number, field: "label" | "value", value: string) {
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
        dash). Up to 3 appear on the front face of your card.
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
          {stats.map((stat, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={stat.label}
                onChange={(e) => updateStat(i, "label", e.target.value)}
                placeholder="Label (e.g., PPG)"
                maxLength={50}
                className="w-1/2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
              />
              <input
                type="text"
                value={stat.value}
                onChange={(e) => updateStat(i, "value", e.target.value)}
                placeholder="Value (e.g., 24.5)"
                maxLength={50}
                className="w-1/2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
              />
              <button
                onClick={() => removeStat(i)}
                className="rounded-lg border border-white/[0.06] p-2 text-ink-dim hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
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
    if (links.length >= 10) return;
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
        etc.). Up to 4 appear on the back of your card.
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
          {links.length < 10 && (
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
    onChange({ ...social, [key]: value || undefined });
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
          <p className="mt-1 text-[11px] text-white/20">
            Handle only — e.g. <span className="text-white/35">{p.placeholder}</span>. Don&apos;t paste the full URL.
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
    if (highlights.length >= 10) return;
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
        Add highlight videos or articles (YouTube, Hudl, news features, etc.). Up to 3 appear on the back of your card.
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
          {highlights.length < 10 && (
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
          placeholder="contact@yourname.com"
          maxLength={200}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-white/20">
          This email will be visible to users who click the Contact button on your card.
        </p>
      </div>
      <div>
        <label htmlFor="contact_phone" className="mb-1 block text-sm font-medium text-ink-muted">
          Contact Phone
        </label>
        <input
          id="contact_phone"
          type="text"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+1 (555) 000-0000"
          maxLength={30}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-white/20">
          Your phone number for direct calls, texts, or WhatsApp.
        </p>
      </div>
    </div>
  );
}
