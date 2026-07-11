"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { motion, useAnimation } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useHaptic } from "./use-haptic";

type Props = {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
};

export function PullToRefresh({ children, onRefresh, threshold = 80 }: Props) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const controls = useAnimation();
  const haptic = useHaptic();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    setPulling(true);
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const diff = Math.max(0, (e.touches[0].clientY - startY.current) * 0.5);
    if (diff > 0) {
      setPullDistance(Math.min(diff, threshold * 1.5));
    }
  }, [pulling, refreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);

    if (pullDistance >= threshold) {
      haptic.mediumTap();
      setRefreshing(true);
      setPullDistance(threshold);
      await onRefresh();
      haptic.success();
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pulling, pullDistance, threshold, onRefresh, haptic]);

  const rotation = (pullDistance / threshold) * 360;
  const opacity = Math.min(pullDistance / threshold, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      <motion.div
        animate={{ height: pullDistance }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="overflow-hidden flex items-center justify-center"
      >
        <motion.div
          style={{ opacity }}
          animate={refreshing ? { rotate: 360 } : { rotate: rotation }}
          transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0 }}
        >
          <RefreshCw className="h-5 w-5 text-accent" />
        </motion.div>
        <span className="ml-2 text-xs text-white/50 font-medium">
          {refreshing ? "Refreshing..." : pullDistance >= threshold ? "Release to refresh" : "Pull to refresh"}
        </span>
      </motion.div>
      <motion.div
        animate={{ y: pullDistance }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
