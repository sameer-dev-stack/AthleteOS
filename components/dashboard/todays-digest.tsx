"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Eye, MousePointerClick, MessageCircle, Sparkles, ArrowRight, Share2 } from "lucide-react";
import type { AnalyticsData } from "@/lib/actions/analytics";

type Props = {
  analytics: AnalyticsData | null;
  nilScore: number | null;
  tipsCount: number;
  inquiriesCount?: number;
  themeAccent: string;
  isPublished?: boolean;
  isPro?: boolean;
  username?: string | null;
  onShare?: () => void;
};

type DigestItem = {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  detail: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export function TodaysDigest({
  analytics,
  nilScore,
  tipsCount,
  inquiriesCount = 0,
  themeAccent,
  isPublished = false,
  isPro = false,
  username,
  onShare,
}: Props) {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    if (!analytics) return;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const todayViews = analytics.viewsByDay.find((d) => d.date === today)?.count || 0;
    const yesterdayViews = analytics.viewsByDay.find((d) => d.date === yesterday)?.count || 0;
    const viewTrend = todayViews > yesterdayViews ? "up" : todayViews < yesterdayViews ? "down" : "neutral";

    const newItems: DigestItem[] = [];

    if (analytics.totalViews > 0) {
      newItems.push({
        label: "Card Views",
        value: formatCompact(analytics.totalViews),
        trend: viewTrend,
        detail: todayViews > 0 ? `${todayViews} today` : "No views today yet",
      });
    }

    if (isPro && analytics.totalClicks > 0) {
      newItems.push({
        label: "Link Clicks",
        value: formatCompact(analytics.totalClicks),
        trend: analytics.totalClicks > 0 ? "up" : "neutral",
        detail: `${analytics.topLinks.length} unique links clicked`,
      });
    }

    if (tipsCount > 0) {
      newItems.push({
        label: "Tips",
        value: formatCompact(tipsCount),
        trend: "up",
        detail: "Fans are supporting you",
      });
    }

    if (nilScore !== null && nilScore > 0) {
      newItems.push({
        label: "NIL Score",
        value: nilScore.toString(),
        trend: nilScore >= 50 ? "up" : "neutral",
        detail: nilScore >= 70 ? "Strong brand potential" : nilScore >= 40 ? "Growing steadily" : "Building momentum",
      });
    }

    if (inquiriesCount > 0) {
      newItems.push({
        label: "Inquiries",
        value: formatCompact(inquiriesCount),
        trend: "up",
        detail: "Brands want to connect",
      });
    }

    queueMicrotask(() => setItems(newItems));
  }, [analytics, nilScore, tipsCount, inquiriesCount, isPro]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white" suppressHydrationWarning>{greeting}</p>
            <p className="text-xs text-white/40 mt-0.5">
              {isPublished ? "Your card is live and ready for visitors" : "Your NIL activity will appear here"}
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${themeAccent}15` }}>
            <Sparkles className="h-4 w-4" style={{ color: themeAccent }} />
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] p-6 text-center">
          {isPublished ? (
            <>
              <p className="text-xs font-semibold text-white/70 mb-1">Your card is live!</p>
              <p className="text-xs text-white/40 mb-4 max-w-sm mx-auto leading-relaxed">
                Share your card link on social media to start receiving card views, link clicks, and brand inquiries.
              </p>
              <div className="flex items-center justify-center gap-3">
                {onShare ? (
                  <button
                    onClick={onShare}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:opacity-90"
                    style={{ backgroundColor: themeAccent, color: "#111115" }}
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share your card
                  </button>
                ) : username ? (
                  <Link
                    href={`/${username}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:opacity-90"
                    style={{ backgroundColor: themeAccent, color: "#111115" }}
                  >
                    <Share2 className="h-3.5 w-3.5" /> View public card
                  </Link>
                ) : null}
                {username && onShare && (
                  <Link
                    href={`/${username}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all"
                    style={{ backgroundColor: `${themeAccent}15`, color: themeAccent, border: `1px solid ${themeAccent}30` }}
                  >
                    View card <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-white/40 mb-3">Publish your card to start seeing analytics</p>
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all"
                style={{ backgroundColor: `${themeAccent}15`, color: themeAccent, border: `1px solid ${themeAccent}30` }}
              >
                Complete your profile <ArrowRight className="h-3 w-3" />
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-white" suppressHydrationWarning>{greeting}</p>
          <p className="text-xs text-white/40 mt-0.5">Here&apos;s your NIL activity snapshot</p>
        </div>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${themeAccent}15` }}>
          <Sparkles className="h-4 w-4" style={{ color: themeAccent }} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{item.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-white">{item.value}</span>
              {item.trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-400" />}
              {item.trend === "down" && <TrendingDown className="h-3 w-3 text-red-400" />}
            </div>
            <p className="text-[10px] text-white/30 mt-1">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-[10px] text-white/30">Updated just now</span>
        <Link
          href="/dashboard/analytics"
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors hover:text-white"
          style={{ color: themeAccent }}
        >
          View Analytics <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
