"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMounted } from "@/lib/hooks/use-mounted";

const ELEMENTS = [
  { icon: "$", x: "8%", y: "18%", delay: 0, size: 40, rotate: -12 },
  { icon: "NIL", x: "85%", y: "12%", delay: 0.8, size: 48, rotate: 8 },
  { icon: "%", x: "92%", y: "65%", delay: 1.6, size: 36, rotate: -6 },
  { icon: "0x", x: "5%", y: "72%", delay: 2.4, size: 38, rotate: 14 },
];

export function FloatingElements() {
  const prefersReducedMotion = useReducedMotion();
  const mounted = useMounted();

  if (mounted && prefersReducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {ELEMENTS.map((el, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:flex items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm font-mono text-xs font-medium text-ink-dim/60"
          style={{ left: el.x, top: el.y, width: el.size, height: el.size }}
          initial={{ opacity: 0, scale: 0.6, rotate: el.rotate }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: el.rotate,
            y: [0, -12, 0],
          }}
          transition={{
            opacity: { delay: el.delay, duration: 0.8 },
            scale: { delay: el.delay, duration: 0.8 },
            y: {
              delay: el.delay,
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          {el.icon}
        </motion.div>
      ))}
    </div>
  );
}
