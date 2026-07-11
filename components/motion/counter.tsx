"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function Counter({
  to,
  duration = 1.8,
  prefix = "",
  suffix = "",
  format,
  className = "",
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const raw = useMotionValue(prefersReducedMotion ? to : 0);
  const spring = useSpring(raw, {
    stiffness: 60,
    damping: 22,
    mass: 0.6,
    duration: duration * 1000,
  });
  const display = useTransform(spring, (v) => {
    const n = Math.round(v);
    return format ? format(n) : n.toLocaleString();
  });

  useEffect(() => {
    if (inView) raw.set(to);
  }, [inView, to, raw]);

  if (!mounted) {
    const staticValue = format ? format(to) : to.toLocaleString();
    return (
      <span ref={ref} className={className}>
        {prefix}
        {staticValue}
        {suffix}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
