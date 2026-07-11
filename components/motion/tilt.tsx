"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { useRef, useState, useEffect, type ReactNode } from "react";

export function Tilt({
  children,
  className = "",
  max = 12,
  scale = 1.02,
  perspective = 1200,
  sheen = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  scale?: number;
  perspective?: number;
  sheen?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spx = useSpring(px, { stiffness: 180, damping: 22, mass: 0.5 });
  const spy = useSpring(py, { stiffness: 180, damping: 22, mass: 0.5 });

  const rotateY = useTransform(spx, [0, 1], [-max, max]);
  const rotateX = useTransform(spy, [0, 1], [max, -max]);
  const sheenLeft = useTransform(spx, (v) => `${v * 100}%`);
  const sheenTop = useTransform(spy, (v) => `${v * 100}%`);
  const sheenBg = useMotionTemplate`radial-gradient(600px circle at ${sheenLeft} ${sheenTop}, rgba(255,255,255,0.10), transparent 45%)`;

  if (mounted && prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        perspective,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          scale,
        }}
        className="relative will-change-transform rounded-[inherit]"
      >
        {children}
        {sheen && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              background: sheenBg,
              mixBlendMode: "overlay",
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
