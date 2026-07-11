"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function CardSection({ children, className = "", delay = 0 }: SectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function CardLabel({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/25 pl-0.5 pt-1">
      {icon}
      {children}
    </p>
  );
}

export function CardDivider({ accent }: { accent: string }) {
  return (
    <div
      className="mx-5 h-px"
      style={{ background: `linear-gradient(90deg, transparent, ${accent}15, transparent)` }}
    />
  );
}

export function SocialPill({
  Icon,
  href,
  accent,
}: {
  Icon: React.ElementType;
  href: string;
  accent: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `${accent}15`, border: `1px solid ${accent}40` }}
      />
      <Icon className="h-3.5 w-3.5 relative z-10 text-white/40 group-hover:text-white transition-colors duration-300" />
    </a>
  );
}

export function StatItem({
  value,
  label,
  accent,
  index,
  placeholder,
}: {
  value: string;
  label: string;
  accent: string;
  index: number;
  placeholder?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 flex flex-col items-center py-3 px-1"
    >
      <p
        className="text-[19px] font-black leading-none tabular-nums"
        style={{ color: placeholder ? `${accent}30` : accent }}
      >
        {value}
      </p>
      <p className="mt-1 text-[7.5px] uppercase tracking-widest text-white/30 font-bold">
        {placeholder ? "Add stat" : label}
      </p>
    </motion.div>
  );
}

export function LinkCard({
  label,
  url,
  accent,
  index,
  onClick,
  placeholder,
}: {
  label: string;
  url: string;
  accent: string;
  index: number;
  onClick?: () => void;
  placeholder?: boolean;
}) {
  if (placeholder) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08 * index + 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: `${accent}04`, border: `1px dashed ${accent}15` }}
      >
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}08` }}
        >
          <span className="text-[11px] font-bold" style={{ color: `${accent}40` }}>
            {label.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <span className="flex-1 text-[12px] font-medium text-white/20 truncate">
          {label}
        </span>
        <span className="text-[9px] text-white/15 font-medium">Add link</span>
      </motion.div>
    );
  }

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 * index + 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 card-glass hover:card-glass-strong"
    >
      <div
        className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
        style={{ background: `${accent}12` }}
      >
        <span className="text-[11px] font-bold" style={{ color: accent }}>
          {label.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <span className="flex-1 text-[12px] font-semibold text-white/80 truncate">
        {label}
      </span>
      <svg
        className="h-3.5 w-3.5 flex-shrink-0 text-white/20 group-hover:text-white/50 transition-all duration-300 group-hover:translate-x-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </motion.a>
  );
}

export function HighlightCard({
  title,
  url,
  accent,
  index,
  onClick,
  placeholder,
}: {
  title: string;
  url: string;
  accent: string;
  index: number;
  onClick?: () => void;
  placeholder?: boolean;
}) {
  if (placeholder) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 * index + 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: `${accent}04`, border: `1px dashed ${accent}15` }}
      >
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}08` }}
        >
          <svg className="h-4 w-4" style={{ color: `${accent}30` }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="flex-1 text-[12px] font-medium text-white/20 truncate">
          {title}
        </span>
        <span className="text-[9px] text-white/15 font-medium">Add</span>
      </motion.div>
    );
  }

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index + 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 card-glass hover:card-glass-strong"
    >
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
        style={{ background: `${accent}12` }}
      >
        <svg
          className="h-4 w-4"
          style={{ color: accent }}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <span className="flex-1 text-[12px] font-semibold text-white/75 truncate">
        {title}
      </span>
      <svg
        className="h-3.5 w-3.5 flex-shrink-0 text-white/15 group-hover:text-white/40 transition-all duration-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </motion.a>
  );
}

export function InterestChip({
  label,
  accent,
  index,
  placeholder,
}: {
  label: string;
  accent: string;
  index: number;
  placeholder?: boolean;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * index + 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-300 hover:scale-105"
      style={{
        background: placeholder ? `${accent}04` : `${accent}08`,
        border: `1px ${placeholder ? "dashed" : "solid"} ${placeholder ? `${accent}15` : `${accent}20`}`,
        color: placeholder ? `${accent}50` : `${accent}cc`,
      }}
    >
      {placeholder ? `${label}` : label}
    </motion.span>
  );
}
