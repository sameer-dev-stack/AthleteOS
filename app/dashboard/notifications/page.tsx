"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import {
  Mail,
  Bell,
  MessageCircle,
  DollarSign,
  TrendingUp,
  Loader2,
  Check,
  Zap,
  UserPlus,
  CheckCircle2,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/actions/profile";
import type { SystemNotification } from "@/lib/actions/notifications";

type EmailPrefs = {
  welcome: boolean;
  published: boolean;
  inquiry: boolean;
  tips: boolean;
  weekly: boolean;
};

const DEFAULT_PREFS: EmailPrefs = {
  welcome: true,
  published: true,
  inquiry: true,
  tips: true,
  weekly: true,
};

const PREF_ITEMS = [
  { key: "welcome" as const, label: "Welcome email", description: "Getting started tips when you join", icon: Mail },
  { key: "published" as const, label: "Card published", description: "Confirmation when your card goes live", icon: Check },
  { key: "inquiry" as const, label: "New inquiries", description: "When a brand or sponsor reaches out", icon: MessageCircle },
  { key: "tips" as const, label: "Tip notifications", description: "When a fan sends you a tip", icon: DollarSign },
  { key: "weekly" as const, label: "Weekly digest", description: "Card views, clicks, and performance summary", icon: TrendingUp },
];

function getNotificationIcon(type: SystemNotification["type"]) {
  switch (type) {
    case "inquiry":
      return <MessageCircle className="h-4 w-4 text-[#C6FF3D]" />;
    case "tip":
      return <DollarSign className="h-4 w-4 text-emerald-400" />;
    case "referral":
      return <UserPlus className="h-4 w-4 text-cyan-400" />;
    case "milestone":
      return <Zap className="h-4 w-4 text-amber-400" />;
    case "published":
      return <CheckCircle2 className="h-4 w-4 text-[#C6FF3D]" />;
    default:
      return <Bell className="h-4 w-4 text-white/50" />;
  }
}

function formatTimeAgo(isoString: string): string {
  try {
    const now = new Date();
    const date = new Date(isoString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<EmailPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"activity" | "preferences">("activity");

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase?.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .select("email_preferences")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile?.email_preferences) {
              setPrefs({ ...DEFAULT_PREFS, ...(profile.email_preferences as Partial<EmailPrefs>) });
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    fetch("/api/notifications")
      .then((r) => r.json())
      .then((res) => {
        if (res?.ok && res?.data) {
          setNotifications(res.data);
        }
        setLoadingNotifs(false);
      })
      .catch(() => {
        setLoadingNotifs(false);
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    await updateProfile({ email_preferences: prefs });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggle(key: keyof EmailPrefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-8">
        {/* Header navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 rounded-md bg-[#C6FF3D]" />
            <span className="text-sm font-black tracking-wider uppercase text-white">AthleteOS</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-black tracking-tight">Notifications Center</h1>
          <p className="mt-1 text-sm text-white/40">
            View system alerts, fan activity, and manage your email notification preferences.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.08] gap-6">
          <button
            onClick={() => setActiveTab("activity")}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === "activity"
                ? "text-[#C6FF3D]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5" />
              <span>Recent Activity ({notifications.length})</span>
            </div>
            {activeTab === "activity" && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#C6FF3D] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === "preferences"
                ? "text-[#C6FF3D]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Email Preferences</span>
            </div>
            {activeTab === "preferences" && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#C6FF3D] rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: System Activity */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            {loadingNotifs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-white/30" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-8 text-center space-y-2">
                <Bell className="h-8 w-8 text-white/20 mx-auto" />
                <h3 className="text-sm font-bold text-white">No notifications yet</h3>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  When you receive fan tips, brand inquiries, or reach milestones, they'll appear right here.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-[#111113] divide-y divide-white/[0.04] overflow-hidden">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.link) window.location.href = notif.link;
                    }}
                    className="p-4 flex items-start gap-4 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                        <span className="text-[10px] text-white/30 font-medium">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Email Preferences */}
        {activeTab === "preferences" && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-white/30" />
              </div>
            ) : (
              <div className="space-y-3">
                {PREF_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const enabled = prefs[item.key];
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggle(item.key)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        enabled
                          ? "border-[#C6FF3D]/20 bg-[#C6FF3D]/5"
                          : "border-white/[0.06] bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-xl p-2.5 ${
                              enabled ? "bg-[#C6FF3D]/15" : "bg-white/[0.04]"
                            }`}
                          >
                            <Icon
                              className={`h-4 w-4 ${enabled ? "text-[#C6FF3D]" : "text-white/30"}`}
                            />
                          </div>
                          <div>
                            <p
                              className={`text-sm font-bold ${
                                enabled ? "text-white" : "text-white/60"
                              }`}
                            >
                              {item.label}
                            </p>
                            <p className="text-xs text-white/40 mt-0.5">{item.description}</p>
                          </div>
                        </div>
                        <div
                          className={`relative h-5 w-9 rounded-full transition-colors ${
                            enabled ? "bg-[#C6FF3D]" : "bg-white/10"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#0A0A0B] shadow-sm transition-transform ${
                              enabled ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}

                <div className="pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full rounded-xl bg-[#C6FF3D] px-4 py-3 text-sm font-bold text-[#0A0A0B] transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : saved ? "Preferences Saved! ✓" : "Save Email Preferences"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
