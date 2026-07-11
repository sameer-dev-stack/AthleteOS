"use client";

import { useState, useTransition } from "react";
import {
  User,
  Moon,
  Bell,
  Link2,
  Key,
  Download,
  Trash2,
  Mail,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Palette,
} from "lucide-react";
import { updateProfile, updateTheme, type Profile } from "@/lib/actions/profile";
import { updatePassword } from "@/lib/actions/auth";
import { exportUserData, deleteAccount } from "@/lib/actions/gdpr";
import { ThemePicker } from "./theme-picker";

type Props = {
  profile: Profile;
  user: { email?: string; id: string; created_at?: string };
};

type SectionKey = "account" | "theme" | "notifications" | "connections" | "security" | "data" | "danger";

const ACCENT_COLORS = [
  { name: "Electric Lime", value: "#C6FF3D" },
  { name: "Coral", value: "#FF6B6B" },
  { name: "Teal", value: "#4ECDC4" },
  { name: "Gold", value: "#FFE66D" },
  { name: "Lavender", value: "#A78BFA" },
  { name: "Sky", value: "#38BDF8" },
  { name: "Rose", value: "#FB7185" },
  { name: "Amber", value: "#FBBF24" },
];

const EMAIL_PREF_KEYS = [
  { key: "deal_alerts", label: "Deal alerts", desc: "When a brand sends you an inquiry" },
  { key: "tip_notifications", label: "Tip notifications", desc: "When someone tips your profile" },
  { key: "weekly_digest", label: "Weekly digest", desc: "Summary of your profile activity" },
  { key: "product_updates", label: "Product updates", desc: "New features and improvements" },
  { key: "marketing", label: "Marketing emails", desc: "Tips, NIL news, and promotions" },
] as const;

function SectionHeader({
  icon: Icon,
  title,
  description,
  accent,
}: {
  icon: typeof User;
  title: string;
  description: string;
  accent?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]"
        style={accent ? { color: accent } : { color: "rgba(255,255,255,0.5)" }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-ink-dim">{description}</p>
      </div>
    </div>
  );
}

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-40 ${
        enabled ? "bg-accent" : "bg-white/[0.12]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-bg shadow-lg ring-0 transition-transform duration-200 ${
          enabled ? "translate-x-[18px]" : "translate-x-[1px]"
        }`}
      />
    </button>
  );
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl transition-all ${
        type === "success"
          ? "border-accent/20 bg-accent/10 text-accent"
          : "border-red-500/20 bg-red-500/10 text-red-400"
      }`}
    >
      {type === "success" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      {message}
    </div>
  );
}

export function SettingsPanel({ profile, user }: Props) {
  const [openSection, setOpenSection] = useState<SectionKey | null>("account");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Theme
  const [accent, setAccent] = useState(profile.theme_accent || "#C6FF3D");
  const [darkModePref, setDarkModePref] = useState<"dark" | "system">("dark");

  // Notifications
  const prefs = (profile.email_preferences as Record<string, boolean> | null) || {};
  const [emailPrefs, setEmailPrefs] = useState<Record<string, boolean>>({
    deal_alerts: prefs.deal_alerts ?? true,
    tip_notifications: prefs.tip_notifications ?? true,
    weekly_digest: prefs.weekly_digest ?? true,
    product_updates: prefs.product_updates ?? true,
    marketing: prefs.marketing ?? false,
  });

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Account deletion
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function toggleSection(key: SectionKey) {
    setOpenSection(openSection === key ? null : key);
  }

  async function handleSaveTheme() {
    startTransition(async () => {
      const result = await updateTheme(accent, profile.theme_layout || "classic");
      if (result.ok) {
        showToast("Theme saved");
      } else {
        showToast(result.error || "Failed to save", "error");
      }
    });
  }

  async function handleSaveNotifications() {
    startTransition(async () => {
      const result = await updateProfile({ email_preferences: emailPrefs });
      if (result.ok) {
        showToast("Notification preferences saved");
      } else {
        showToast(result.error || "Failed to save", "error");
      }
    });
  }

  async function handlePasswordChange() {
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    const result = await updatePassword(newPassword);
    setPasswordSaving(false);

    if (result.ok) {
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated");
    } else {
      setPasswordError(result.message || "Failed to update password");
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportUserData();
      if (result.ok && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `athleteos-data-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Data exported successfully");
      } else {
        showToast(result.error || "Failed to export data", "error");
      }
    } catch {
      showToast("Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }
    if (deleteStep === 1) {
      if (deleteConfirmText !== "DELETE") {
        setPasswordError("Type DELETE to confirm");
        return;
      }
      setDeleteStep(2);
      setPasswordError(null);
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.ok) {
        showToast("Account deleted. Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        showToast(result.error || "Failed to delete account", "error");
        setDeleting(false);
      }
    } catch {
      showToast("Failed to delete account", "error");
      setDeleting(false);
    }
  }

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Unknown";

  const sections: { key: SectionKey; icon: typeof User; title: string; description: string }[] = [
    {
      key: "account",
      icon: User,
      title: "Account",
      description: "Your profile info and public URL",
    },
    {
      key: "theme",
      icon: Palette,
      title: "Appearance",
      description: "Accent color and display preferences",
    },
    {
      key: "notifications",
      icon: Bell,
      title: "Notifications",
      description: "Choose what emails you receive",
    },
    {
      key: "connections",
      icon: Link2,
      title: "Connected Accounts",
      description: "Social platforms linked to your profile",
    },
    {
      key: "security",
      icon: Key,
      title: "Security",
      description: "Change your password",
    },
    {
      key: "data",
      icon: Download,
      title: "Data & Privacy",
      description: "Export your data or manage your account",
    },
    {
      key: "danger",
      icon: Trash2,
      title: "Danger Zone",
      description: "Permanently delete your account",
    },
  ];

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const isOpen = openSection === section.key;
        const Icon = section.icon;
        const isDanger = section.key === "danger";

        return (
          <div
            key={section.key}
            className={`rounded-xl border transition-colors ${
              isDanger
                ? "border-red-500/15 bg-red-500/[0.03]"
                : isOpen
                  ? "border-white/[0.08] bg-[#121216]"
                  : "border-white/[0.06] bg-[#121216]"
            }`}
          >
            <button
              onClick={() => toggleSection(section.key)}
              className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
                isDanger ? "hover:bg-red-500/[0.04]" : "hover:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${
                    isDanger
                      ? "border-red-500/20 bg-red-500/5 text-red-400"
                      : "border-white/[0.06] bg-white/[0.03] text-white/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h2
                    className={`text-sm font-semibold ${
                      isDanger ? "text-red-400" : "text-white"
                    }`}
                  >
                    {section.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-dim">{section.description}</p>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-ink-dim" />
              ) : (
                <ChevronDown className="h-4 w-4 text-ink-dim" />
              )}
            </button>

            {isOpen && (
              <div className="border-t border-white/[0.04] px-5 py-5">
                {/* Account */}
                {section.key === "account" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-medium text-ink-muted">Email</label>
                        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                          <Mail className="h-3.5 w-3.5 text-ink-dim" />
                          <span className="text-sm text-white">{user.email}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-ink-muted">Member since</label>
                        <div className="mt-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                          <span className="text-sm text-white">{memberSince}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-muted">Account ID</label>
                      <div className="mt-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                        <span className="font-mono text-xs text-ink-dim">{user.id}</span>
                      </div>
                    </div>
                    {profile.username && (
                      <div>
                        <label className="text-xs font-medium text-ink-muted">Public profile</label>
                        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                          <ExternalLink className="h-3.5 w-3.5 text-ink-dim" />
                          <span className="text-sm text-accent font-mono">
                            athlete-os-vert.vercel.app/{profile.username}
                          </span>
                        </div>
                      </div>
                    )}
                    {profile.plan && profile.plan !== "free" && (
                      <div>
                        <label className="text-xs font-medium text-ink-muted">Plan</label>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 text-xs font-semibold text-accent capitalize">
                            <Shield className="h-3 w-3" />
                            {profile.plan}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Theme */}
                {section.key === "theme" && (
                  <div className="space-y-6">
                    <div>
                      <SectionHeader
                        icon={Moon}
                        title="Dark Mode"
                        description="AthleteOS is dark by default"
                      />
                      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <div>
                          <p className="text-sm text-white">Dark mode</p>
                          <p className="text-xs text-ink-dim">Always on. No light theme available.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-accent">Enabled</span>
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15">
                            <Check className="h-3 w-3 text-accent" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {(["dark", "system"] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setDarkModePref(opt)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                              darkModePref === opt
                                ? "border-accent/30 bg-accent/10 text-accent"
                                : "border-white/[0.06] bg-white/[0.02] text-ink-muted hover:text-white"
                            }`}
                          >
                            {opt === "dark" ? "Always dark" : "Follow system"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-white/[0.04]" />

                    <div>
                      <SectionHeader
                        icon={Palette}
                        title="Accent Color"
                        description="The highlight color across your experience"
                      />
                      <div className="mt-4 flex flex-wrap gap-3">
                        {ACCENT_COLORS.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => setAccent(c.value)}
                            className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                              accent === c.value
                                ? "border-white scale-110"
                                : "border-white/[0.06] hover:border-white/30"
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.name}
                          >
                            {accent === c.value && <Check className="h-4 w-4 text-bg" />}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-ink-dim">
                        {ACCENT_COLORS.find((c) => c.value === accent)?.name || "Custom"}
                        {accent !== profile.theme_accent && (
                          <span className="ml-2 text-accent/70">Unsaved</span>
                        )}
                      </p>
                    </div>

                    {accent !== profile.theme_accent && (
                      <button
                        onClick={handleSaveTheme}
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40"
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {isPending ? "Saving..." : "Save theme"}
                      </button>
                    )}
                  </div>
                )}

                {/* Notifications */}
                {section.key === "notifications" && (
                  <div className="space-y-1">
                    {EMAIL_PREF_KEYS.map((pref) => (
                      <div
                        key={pref.key}
                        className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-white/[0.02]"
                      >
                        <div>
                          <p className="text-sm text-white">{pref.label}</p>
                          <p className="text-xs text-ink-dim">{pref.desc}</p>
                        </div>
                        <Toggle
                          enabled={emailPrefs[pref.key]}
                          onChange={(v) =>
                            setEmailPrefs((prev) => ({ ...prev, [pref.key]: v }))
                          }
                        />
                      </div>
                    ))}
                    <div className="mt-4">
                      <button
                        onClick={handleSaveNotifications}
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40"
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {isPending ? "Saving..." : "Save preferences"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Connected Accounts */}
                {section.key === "connections" && (
                  <div className="space-y-4">
                    <p className="text-xs text-ink-dim">
                      Manage social platforms linked to your AthleteOS profile.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        { name: "Instagram", key: "instagram" },
                        { name: "TikTok", key: "tiktok" },
                        { name: "X / Twitter", key: "twitter" },
                        { name: "YouTube", key: "youtube" },
                      ].map((platform) => {
                        const handle = (profile.social as Record<string, string | undefined>)?.[platform.key];
                        return (
                          <div
                            key={platform.key}
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                              handle
                                ? "border-green-500/20 bg-green-500/[0.04]"
                                : "border-white/[0.06] bg-white/[0.02]"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium text-white">{platform.name}</p>
                              <p className={`text-xs ${handle ? "text-green-400" : "text-ink-dim"}`}>
                                {handle || "Not connected"}
                              </p>
                            </div>
                            {handle && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15">
                                <Check className="h-3 w-3 text-green-400" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-ink-dim">
                      Edit your social handles in the{" "}
                      <span className="text-accent">Profile editor</span> under the Social tab.
                    </p>
                  </div>
                )}

                {/* Security */}
                {section.key === "security" && (
                  <div className="space-y-4">
                    <p className="text-xs text-ink-dim">
                      Use a strong, unique password. We recommend at least 12 characters.
                    </p>
                    <div>
                      <label className="text-xs font-medium text-ink-muted">New password</label>
                      <div className="relative mt-1.5">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPasswordError(null);
                          }}
                          placeholder="Enter new password"
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 pr-10 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-dim hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink-muted">Confirm password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPasswordError(null);
                        }}
                        placeholder="Re-enter new password"
                        className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                      />
                    </div>
                    {passwordError && (
                      <p className="text-xs text-red-400">{passwordError}</p>
                    )}
                    <button
                      onClick={handlePasswordChange}
                      disabled={passwordSaving || !newPassword || !confirmPassword}
                      className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {passwordSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      {passwordSaving ? "Updating..." : "Update password"}
                    </button>
                  </div>
                )}

                {/* Data & Privacy */}
                {section.key === "data" && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-start gap-3">
                        <Download className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-muted" />
                        <div>
                          <h3 className="text-sm font-medium text-white">Export your data</h3>
                          <p className="mt-1 text-xs text-ink-dim">
                            Download a JSON file containing your profile, tips, inquiries,
                            AI usage, and analytics data.
                          </p>
                          <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                          >
                            {exporting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            {exporting ? "Exporting..." : "Download data"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-muted" />
                        <div>
                          <h3 className="text-sm font-medium text-white">Privacy</h3>
                          <p className="mt-1 text-xs text-ink-dim">
                            Your data is encrypted at rest and in transit. We never sell your
                            information to third parties. Read our privacy policy for full details.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Danger Zone */}
                {section.key === "danger" && (
                  <div className="space-y-4">
                    {deleteStep === 0 && (
                      <div className="rounded-lg border border-red-500/15 bg-red-500/[0.04] p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                          <div>
                            <h3 className="text-sm font-medium text-red-400">Delete your account</h3>
                            <p className="mt-1 text-xs text-ink-dim">
                              This action is permanent and cannot be undone. All your data,
                              including profile, tips, inquiries, and analytics will be
                              permanently deleted.
                            </p>
                            <button
                              onClick={() => setDeleteStep(1)}
                              className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/15 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete account
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {deleteStep === 1 && (
                      <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-4 space-y-3">
                        <p className="text-xs text-red-400 font-medium">
                          Type <span className="font-bold">DELETE</span> to confirm you want to
                          permanently delete your account.
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => {
                            setDeleteConfirmText(e.target.value);
                            setPasswordError(null);
                          }}
                          placeholder='Type "DELETE"'
                          className="w-full rounded-lg border border-red-500/20 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-red-500/40 focus:outline-none"
                        />
                        {passwordError && (
                          <p className="text-xs text-red-400">{passwordError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== "DELETE"}
                            className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Continue
                          </button>
                          <button
                            onClick={() => {
                              setDeleteStep(0);
                              setDeleteConfirmText("");
                              setPasswordError(null);
                            }}
                            className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {deleteStep === 2 && (
                      <div className="rounded-lg border border-red-500/25 bg-red-500/[0.08] p-4 space-y-3">
                        <p className="text-xs text-red-400 font-bold">
                          Final confirmation. Your account and all data will be permanently
                          erased. This cannot be reversed.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40"
                          >
                            {deleting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            {deleting ? "Deleting..." : "Permanently delete"}
                          </button>
                          <button
                            onClick={() => {
                              setDeleteStep(0);
                              setDeleteConfirmText("");
                            }}
                            disabled={deleting}
                            className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-white transition-colors disabled:opacity-40"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
