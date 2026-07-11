"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AnimatedGradientBg() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Main gradient blob */}
      <motion.div
        className="absolute -left-[30%] top-[-20%] h-[800px] w-[800px] rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(circle, rgba(198,255,61,0.5) 0%, rgba(198,255,61,0.1) 40%, transparent 70%)",
        }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                x: [0, 60, -30, 0],
                y: [0, 40, -20, 0],
                scale: [1, 1.1, 0.95, 1],
              }
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Secondary blob */}
      <motion.div
        className="absolute -right-[20%] bottom-[-10%] h-[600px] w-[600px] rounded-full opacity-[0.04]"
        style={{
          background:
            "radial-gradient(circle, rgba(198,255,61,0.6) 0%, rgba(198,255,61,0.15) 35%, transparent 70%)",
        }}
        animate={
          prefersReducedMotion
            ? {}
            : {
                x: [0, -50, 30, 0],
                y: [0, -30, 50, 0],
                scale: [1, 0.9, 1.08, 1],
              }
        }
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Thin accent line at top */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
    </div>
  );
}
