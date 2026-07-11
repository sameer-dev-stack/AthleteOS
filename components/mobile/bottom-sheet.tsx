"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useHaptic } from "./use-haptic";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
};

export function BottomSheet({ open, onClose, children, title }: Props) {
  const haptic = useHaptic();
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - startY.current;
    if (diff > 80) {
      haptic.lightTap();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-white/[0.08] bg-[#111113]"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-white/15" />
            </div>

            {title && (
              <div className="flex items-center justify-between px-5 pb-4">
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <button
                  onClick={() => { haptic.lightTap(); onClose(); }}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-white/[0.06] text-white/50 transition-colors hover:bg-white/[0.1]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="overflow-y-auto overscroll-contain px-5 pb-8 safe-area-bottom">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
