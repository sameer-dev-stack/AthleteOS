"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { motion, useMotionValue, useMotionTemplate, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Spotlight({
  children,
  className = "",
  size = 320,
  color = "rgba(198, 255, 61, 0.12)",
}: {
  children: ReactNode;
  className?: string;
  size?: number;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const opacity = useMotionValue(0);
  const bg = useMotionTemplate`radial-gradient(${size}px circle at ${x}px ${y}px, ${color}, transparent 70%)`;

  if (mounted && prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
    opacity.set(1);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => opacity.set(1)}
      onMouseLeave={() => opacity.set(0)}
      className={cn("group relative", className)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{ background: bg, opacity }}
      />
      {children}
    </div>
  );
}
