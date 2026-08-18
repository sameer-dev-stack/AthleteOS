"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/lib/hooks/use-mounted";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2, X, Check } from "lucide-react";
import { createTipSession } from "@/lib/actions/stripe";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";

type Props = {
  athleteId: string;
  athleteName: string;
  accentColor?: string;
  onOpenChange?: (open: boolean) => void;
};

const TIP_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export function TipButton({ athleteId, athleteName, accentColor = "#C6FF3D", onOpenChange }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mounted = useMounted();
  const firstRenderRef = useRef(true);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  async function handleTip() {
    const amount = selected || (customAmount ? Math.round(parseFloat(customAmount) * 100) : 0);
    if (amount < 500) {
      setError("Minimum tip is $5.00");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createTipSession(athleteId, amount);
    setLoading(false);

    if (result.ok && result.url) {
      trackFunnel("first_tip_received", { athleteId, amountCents: amount });
      window.location.href = result.url;
    } else {
      setError(result.error || "Failed to start checkout");
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
        aria-label={`Support ${athleteName.split(" ")[0] || "me"}`}
        className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[13px] font-black tracking-wide transition-colors duration-200 overflow-hidden min-w-0 transform translate-z-0 [backface-visibility:hidden] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          color: "#0A0A0B",
          boxShadow: `0 0 20px -4px ${accentColor}45, 0 8px 28px -8px ${accentColor}25`,
          outline: "1px solid transparent",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        <Heart className="h-4 w-4 flex-shrink-0" fill="currentColor" />
        <span className="truncate">Support {athleteName.split(" ")[0] || "me"}</span>
      </motion.button>

      {mounted && typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="fixed inset-0 z-[100] flex items-end justify-center pb-6 px-4"
                  style={{ background: "rgba(0,0,0,0.88)" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (e.target === e.currentTarget) setOpen(false);
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 12 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm rounded-3xl overflow-hidden"
                    style={{
                      background: "#111115",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: `0 -20px 60px rgba(0,0,0,0.6), 0 0 40px -10px ${accentColor}12`,
                      transform: "translateZ(0)",
                      willChange: "transform",
                    }}
                  >
                    {/* Header with accent gradient */}
                    <div
                      className="relative px-5 pt-5 pb-3"
                      style={{ background: `linear-gradient(180deg, ${accentColor}06, transparent)` }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[15px] font-bold text-white">
                            Tip {athleteName.split(" ")[0]}
                          </h3>
                          <p className="mt-0.5 text-[11px] text-white/30">
                            95% goes directly to the athlete
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                          }}
                          className="h-7 w-7 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-white/[0.08]"
                          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)" }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      {/* Amount grid */}
                      <div className="relative grid grid-cols-3 gap-1.5 mb-3">
                        {TIP_AMOUNTS.map((amt) => (
                          <motion.button
                            key={amt}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(amt);
                              setCustomAmount("");
                            }}
                            className="relative rounded-xl border px-2 py-2.5 text-[13px] font-semibold transition-colors duration-150"
                            style={{
                              borderColor: selected === amt ? `${accentColor}50` : "rgba(255,255,255,0.05)",
                              background: selected === amt ? `${accentColor}12` : "rgba(255,255,255,0.02)",
                              color: selected === amt ? accentColor : "rgba(255,255,255,0.5)",
                            }}
                          >
                            {selected === amt && (
                              <motion.div
                                layoutId="tip-selected"
                                className="absolute inset-0 rounded-xl z-0"
                                style={{ border: `1px solid ${accentColor}35`, background: `${accentColor}08` }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                              />
                            )}
                            <span className="relative z-10">
                              ${(amt / 100).toFixed(amt % 100 === 0 ? 0 : 2)}
                            </span>
                          </motion.button>
                        ))}
                        <input
                          type="number"
                          min="5"
                          max="1000"
                          step="1"
                          value={customAmount}
                          onChange={(e) => {
                            setCustomAmount(e.target.value);
                            setSelected(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Custom"
                          className="rounded-xl border px-2 py-2.5 text-[13px] text-white placeholder:text-white/20 focus:outline-none transition-colors duration-150"
                          style={{
                            borderColor: customAmount ? `${accentColor}50` : "rgba(255,255,255,0.05)",
                            background: customAmount ? `${accentColor}08` : "rgba(255,255,255,0.02)",
                          }}
                        />
                      </div>

                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-3 text-[12px] text-red-400"
                        >
                          {error}
                        </motion.p>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 26 }}
                        onClick={handleTip}
                        disabled={loading || (!selected && !customAmount)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[13px] font-black tracking-wide transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                          color: "#0A0A0B",
                          boxShadow: `0 0 20px -4px ${accentColor}40, 0 8px 24px -8px ${accentColor}25`,
                        }}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" strokeWidth={3} />
                        )}
                        {loading ? "Redirecting..." : "Send support"}
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
