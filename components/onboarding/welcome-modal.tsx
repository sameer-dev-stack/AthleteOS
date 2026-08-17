"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Palette, Rocket, X } from "lucide-react";
import { Logo } from "@/components/logo";

const STEPS = [
  {
    icon: User,
    title: "Pick your username",
    description: "This becomes your public card link — www.nilcard.app/yourname",
  },
  {
    icon: Palette,
    title: "Build your profile",
    description: "Add your sport, school, position, and a quick bio.",
  },
  {
    icon: Rocket,
    title: "Publish & share",
    description: "Hit publish and share your card everywhere. It takes 2 minutes.",
  },
];

type WelcomeModalProps = {
  onDismiss: () => void;
};

export function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const [current, setCurrent] = useState(0);

  function handleNext() {
    if (current < STEPS.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      onDismiss();
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md rounded-3xl border border-white/[0.08] bg-bg-card p-8 glow-card"
        >
          <button
            onClick={onDismiss}
            className="absolute right-4 top-4 text-ink-dim transition-colors hover:text-white"
            aria-label="Close welcome modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6 flex justify-center">
            <Logo />
          </div>

          <h2 className="mb-2 text-center text-xl font-bold text-white">
            Welcome to NIL CARD
          </h2>
          <p className="mb-8 text-center text-sm text-ink-muted">
            Let&apos;s get your athlete card live in 3 quick steps.
          </p>

          <div className="space-y-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === current;
              const isPast = i < current;
              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{
                    opacity: isActive || isPast ? 1 : 0.4,
                    scale: isActive ? 1 : 0.97,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`flex items-start gap-4 rounded-2xl border p-4 transition-colors ${
                    isActive
                      ? "border-accent/30 bg-accent/[0.04]"
                      : "border-white/[0.04] bg-white/[0.01]"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                      isPast
                        ? "bg-accent text-bg"
                        : isActive
                          ? "bg-accent/10 text-accent"
                          : "bg-white/5 text-ink-dim"
                    }`}
                  >
                    {isPast ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{s.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={handleNext}
              className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)]"
            >
              {current < STEPS.length - 1 ? "Next step" : "Let's go"}
            </button>
            <button
              onClick={onDismiss}
              className="w-full text-center text-xs text-ink-dim transition-colors hover:text-ink-muted"
            >
              Skip tour
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === current ? "w-6 bg-accent" : i < current ? "w-1.5 bg-accent/50" : "w-1.5 bg-white/10"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
