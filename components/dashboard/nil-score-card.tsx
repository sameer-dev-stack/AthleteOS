"use client";

import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";

type Props = {
  score: number;
  label: "Emerging" | "Growing" | "Established" | "Strong" | "Elite";
  themeAccent: string;
  onRefresh: () => void;
  loading: boolean;
};

export function NilScoreCard({ score, label, themeAccent, onRefresh, loading }: Props) {
  // Circular gauge config
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Tier badges colors
  const badgeColors: Record<string, string> = {
    Emerging: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Growing: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    Established: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Strong: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Elite: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111113] p-6 flex flex-col items-center justify-between min-h-[300px]">
      {/* Background glow */}
      <div 
        className="absolute -right-20 -top-20 w-48 h-48 rounded-full blur-[100px] opacity-20 pointer-events-none"
        style={{ backgroundColor: themeAccent }}
      />

      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5" style={{ color: themeAccent }} />
          <span className="text-sm font-bold text-white/90">NIL Value Score</span>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg border border-white/[0.05] bg-[#16161A]/80 text-white/40 hover:text-white hover:bg-white/[0.04] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          title="Recalculate Score"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Circle Gauge */}
      <div className="relative my-4 flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          {/* Base Circle */}
          <circle
            stroke="rgba(255,255,255,0.03)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Animated score circle */}
          <motion.circle
            stroke={themeAccent}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white tracking-tight">{score}</span>
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mt-0.5">Scale</span>
        </div>
      </div>

      <div className="w-full text-center">
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-black tracking-wider uppercase mb-2 bg-[#16161A]/80 border-white/[0.08]" style={{ color: themeAccent }}>
          {label} Rank
        </div>
        <p className="text-[11px] text-white/40 leading-normal max-w-[200px] mx-auto">
          Based on your aggregate views, link clicks, tips, and network metrics.
        </p>
      </div>
    </div>
  );
}
