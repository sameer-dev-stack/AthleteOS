"use client";

import { useState, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useHaptic } from "./use-haptic";

type Props = {
  children: ReactNode[];
  onIndexChange?: (index: number) => void;
  className?: string;
};

export function SwipeCards({ children, onIndexChange, className }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dragX = useMotionValue(0);
  const haptic = useHaptic();
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, children.length - 1));
    setCurrentIndex(clamped);
    onIndexChange?.(clamped);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX.current - endX;

    if (Math.abs(diff) > 50) {
      haptic.lightTap();
      if (diff > 0 && currentIndex < children.length - 1) {
        goTo(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        goTo(currentIndex - 1);
      }
    }
  };

  return (
    <div className={className} ref={containerRef}>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden touch-pan-y"
      >
        <motion.div
          className="flex"
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {children.map((child, i) => (
            <div key={i} className="w-full flex-shrink-0">
              {child}
            </div>
          ))}
        </motion.div>
      </div>

      {children.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                haptic.lightTap();
                goTo(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-5 bg-accent" : "w-1.5 bg-white/20"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
