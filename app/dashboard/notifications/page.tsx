"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Mail, Bell, MessageCircle, DollarSign, TrendingUp, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/actions/profile";

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

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<EmailPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
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
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-lg px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-8" aria-label="AthleteOS home">
          <Logo />
          <span className="text-lg font-semibold tracking-tight text-white">AthleteOS</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Email Preferences</h1>
          <p className="mt-2 text-sm text-ink-muted">Choose which emails you want to receive.</p>
        </div>

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
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    enabled
                      ? "border-accent/20 bg-accent/5"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${enabled ? "bg-accent/15" : "bg-white/[0.04]"}`}>
                        <Icon className={`h-4 w-4 ${enabled ? "text-accent" : "text-white/30"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${enabled ? "text-white" : "text-white/60"}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <div
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        enabled ? "bg-accent" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
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
                className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50"
              >
                {saving ? "Saving..." : saved ? "Saved!" : "Save preferences"}
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-ink-dim">
          <Link href="/dashboard" className="text-ink-muted hover:text-white">
            Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
