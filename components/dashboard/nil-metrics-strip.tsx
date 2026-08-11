"use client";

import { Eye, MousePointerClick, TrendingUp, HandCoins, Users, Lock } from "lucide-react";
import Link from "next/link";

type Props = {
  cardViews: number;
  linkClicks: number;
  clickThroughRate: number;
  tipsAmount: number;
  followersTotal: number;
  themeAccent: string;
  followerDelta?: number;
  engagementDelta?: number;
  isPro?: boolean;
};

export function NilMetricsStrip({
  cardViews,
  linkClicks,
  clickThroughRate,
  tipsAmount,
  followersTotal,
  themeAccent,
  followerDelta,
  engagementDelta,
  isPro = false,
}: Props) {
  const stats = [
    {
      label: "Card Views",
      value: cardViews.toLocaleString(),
      icon: Eye,
      isLocked: false,
    },
    {
      label: "Link Clicks",
      value: isPro ? linkClicks.toLocaleString() : "🔒 Pro",
      icon: MousePointerClick,
      isLocked: !isPro,
    },
    {
      label: "Click-Through",
      value: isPro ? `${(clickThroughRate * 100).toFixed(1)}%` : "🔒 Pro",
      icon: TrendingUp,
      delta: isPro ? engagementDelta : undefined,
      isLocked: !isPro,
    },
    {
      label: "Tips Earned",
      value: `$${tipsAmount.toFixed(2)}`,
      icon: HandCoins,
      isLocked: false,
    },
    {
      label: "Followers",
      value: followersTotal.toLocaleString(),
      icon: Users,
      delta: followerDelta,
      isLocked: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        const CardContent = (
          <div
            className={`rounded-xl border p-4 flex flex-col justify-between min-h-[90px] transition-all duration-200 ${
              stat.isLocked
                ? "border-amber-400/20 bg-amber-400/5 hover:border-amber-400/40 cursor-pointer"
                : "border-white/[0.05] bg-[#111113]/80 hover:border-white/[0.1] hover:bg-[#111113]"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                {stat.label}
                {stat.isLocked && <Lock className="h-2.5 w-2.5 text-amber-400" />}
              </span>
              <Icon className="h-3.5 w-3.5" style={{ color: stat.isLocked ? "#f59e0b" : themeAccent }} />
            </div>

            <div className="flex items-baseline justify-between w-full mt-2">
              <span className={`text-lg font-black tracking-tight ${stat.isLocked ? "text-amber-400 text-xs font-bold" : "text-white"}`}>
                {stat.value}
              </span>
              {stat.delta !== undefined && (
                stat.delta > 0 ? (
                  <span className="text-[10px] font-bold text-[#C6FF3D]">
                    +{stat.delta.toFixed(1)}%
                  </span>
                ) : stat.delta < 0 ? (
                  <span className="text-[10px] font-bold text-red-400">
                    {stat.delta.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-white/30">—</span>
                )
              )}
            </div>
          </div>
        );

        if (stat.isLocked) {
          return (
            <Link key={i} href="/dashboard/billing" title="Unlock Pro Analytics">
              {CardContent}
            </Link>
          );
        }

        return <div key={i}>{CardContent}</div>;
      })}
    </div>
  );
}
