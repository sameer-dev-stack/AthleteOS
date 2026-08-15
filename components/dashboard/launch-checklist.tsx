"use client";

import { useState } from "react";
import { useMounted } from "@/lib/hooks/use-mounted";
import Link from "next/link";
import { Check, Circle, ExternalLink, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import type { Profile } from "@/lib/actions/profile";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href?: string;
};

export function LaunchChecklist({ profile }: { profile: Profile }) {
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem(`athleteos_checklist_dismissed_${profile.id}`) === "true",
  );

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(`athleteos_checklist_dismissed_${profile.id}`, "true");
  }

  const items: ChecklistItem[] = [
    {
      id: "avatar",
      label: "Upload a profile photo",
      description: "Athletes with photos get 10x more views",
      done: !!profile.avatar_url,
      href: "/dashboard/profile",
    },
    {
      id: "bio",
      label: "Write your bio",
      description: "Tell brands who you are in 280 characters",
      done: !!profile.bio && profile.bio.length > 15,
      href: "/dashboard/profile",
    },
    {
      id: "stats",
      label: "Add your stats",
      description: "Show your numbers — PPG, GPA, 40-yard dash",
      done: (profile.stats?.length || 0) >= 1,
      href: "/dashboard/profile",
    },
    {
      id: "socials",
      label: "Connect social accounts",
      description: "Link Instagram, TikTok, Twitter for follower count",
      done: !!(profile.social?.instagram || profile.social?.twitter || profile.social?.tiktok),
      href: "/dashboard/profile?tab=social",
    },
    {
      id: "links",
      label: "Add your links",
      description: "Hudl, merch store, or any link you want on your card",
      done: (profile.links?.length || 0) >= 1,
      href: "/dashboard/profile",
    },
    {
      id: "highlights",
      label: "Add a highlight",
      description: "Show off game film, YouTube, or a news feature",
      done: (profile.highlights?.length || 0) >= 1,
      href: "/dashboard/profile",
    },
    {
      id: "contact",
      label: "Add contact info",
      description: "An email or phone so brands can reach you",
      done: !!(profile.contact_email?.trim() || profile.contact_phone?.trim()),
      href: "/dashboard/profile",
    },
    {
      id: "publish",
      label: "Publish your card",
      description: "Go live so brands and fans can find you",
      done: profile.profile_published,
      href: "/dashboard/profile",
    },
    {
      id: "stripe",
      label: "Connect PayPal",
      description: "Connect your PayPal account to receive fan tips",
      done: profile.stripe_onboarding_complete || profile.payout_method === "paypal",
      href: "/dashboard/nil",
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const allDone = completedCount === totalCount;
  const progress = (completedCount / totalCount) * 100;

  if (!mounted || dismissed || allDone) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-white">Launch Checklist</h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[10px] text-ink-dim hover:text-ink-muted transition-colors"
        >
          Dismiss
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[10px] mb-1.5">
          <span className="text-ink-dim">{completedCount} of {totalCount} complete</span>
          <span className="font-semibold text-accent">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => {
          const isIncomplete = !item.done;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                item.done
                  ? "bg-accent/5"
                  : "bg-accent/[0.03] border border-accent/10"
              }`}
            >
              <div className={`flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0 ${
                item.done
                  ? "bg-accent/20"
                  : "border border-accent/30"
              }`}>
                {item.done ? (
                  <Check className="h-3 w-3 text-accent" strokeWidth={3} />
                ) : (
                  <Circle className="h-2.5 w-2.5 text-accent/70" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${item.done ? "text-white/60 line-through" : "text-white"}`}>
                  {item.label}
                </p>
                {!item.done && (
                  <p className="text-[10px] text-ink-dim mt-0.5">{item.description}</p>
                )}
              </div>
              {item.href && (
                <Link
                  href={item.href}
                  className="flex-shrink-0 text-[10px] font-semibold text-accent hover:text-accent-soft transition-colors"
                >
                  {item.done ? "Edit" : "Connect"}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
