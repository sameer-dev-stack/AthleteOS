"use client";

import { Eye, MousePointerClick, TrendingUp, HandCoins, Users } from "lucide-react";

type Props = {
  cardViews: number;
  linkClicks: number;
  clickThroughRate: number;
  tipsAmount: number;
  followersTotal: number;
  themeAccent: string;
};

export function NilMetricsStrip({
  cardViews,
  linkClicks,
  clickThroughRate,
  tipsAmount,
  followersTotal,
  themeAccent,
}: Props) {
  const stats = [
    {
      label: "Card Views",
      value: cardViews.toLocaleString(),
      icon: Eye,
    },
    {
      label: "Link Clicks",
      value: linkClicks.toLocaleString(),
      icon: MousePointerClick,
    },
    {
      label: "Click-Through",
      value: `${(clickThroughRate * 100).toFixed(1)}%`,
      icon: TrendingUp,
    },
    {
      label: "Tips Earned",
      value: `$${tipsAmount.toFixed(2)}`,
      icon: HandCoins,
    },
    {
      label: "Followers",
      value: followersTotal.toLocaleString(),
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="rounded-xl border border-white/[0.05] bg-[#111113]/80 p-4 flex flex-col justify-between min-h-[90px] transition-all duration-200 hover:border-white/[0.1] hover:bg-[#111113]"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                {stat.label}
              </span>
              <Icon className="h-3.5 w-3.5" style={{ color: themeAccent }} />
            </div>
            <span className="text-lg font-black text-white tracking-tight mt-2">
              {stat.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
