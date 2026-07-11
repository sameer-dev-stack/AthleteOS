"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight, Check, AlertCircle, Lock, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "./motion/reveal";
import { Magnetic } from "./motion/magnetic";
import { LiveWaitlistCount } from "./motion/live-waitlist-count";
import {
  joinWaitlist,
  type WaitlistResult,
} from "@/lib/actions/waitlist";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";

const PRO_SPOTS_TOTAL = 500;

const initialState: WaitlistResult = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Magnetic strength={0.2}>
      <button
        type="submit"
        disabled={pending}
        className="btn-primary h-12 w-full px-6 sm:w-auto group disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {pending ? "Joining..." : "Get early access"}
        {!pending && (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        )}
      </button>
    </Magnetic>
  );
}

export function FinalCTA() {
  const [state, formAction] = useFormState(joinWaitlist, initialState);
  const submitted = state.ok;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [spotsClaimed, setSpotsClaimed] = useState(0);

  useEffect(() => {
    fetch("/api/waitlist", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { waitlist?: number } | null) => {
        if (data && typeof data.waitlist === "number") {
          setSpotsClaimed(Math.min(data.waitlist, PRO_SPOTS_TOTAL));
        }
      })
      .catch(() => {
        setSpotsClaimed(412);
      });
  }, []);

  useEffect(() => {
    if (submitted) {
      trackFunnel("waitlist_signup", { source: "landing_cta" });
      import("canvas-confetti").then((mod) => {
        mod.default({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      });
    }
  }, [submitted]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackFunnel("waitlist_view");
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="waitlist" ref={sectionRef} className="relative section">
      <div className="container-tight">
        <Reveal y={40}>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-b from-bg-card to-bg p-10 sm:p-16 lg:p-20">
            {/* Backdrop */}
            <div
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(198,255,61,0.18), transparent 70%)",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                maskImage:
                  "radial-gradient(ellipse 60% 60% at 50% 50%, black, transparent 70%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 60% 60% at 50% 50%, black, transparent 70%)",
              }}
              aria-hidden
            />
            {/* Floating accent orbs */}
            <div
              className="pointer-events-none absolute -left-20 top-1/3 -z-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-orb-1"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-20 bottom-0 -z-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl animate-orb-2"
              aria-hidden
            />

            <div className="mx-auto max-w-2xl text-center">
              <Reveal>
                <div className="chip mx-auto">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />
                  Private beta ·{" "}
                  <LiveWaitlistCount className="font-semibold text-ink" />
                  <span className="text-ink-muted">+ athletes waiting</span>
                </div>
              </Reveal>

              <Reveal delay={0.06}>
                <h2 className="mt-7 text-display-lg font-semibold tracking-tight text-balance">
                  <span className="text-ink">Your NIL business is</span>
                  <br />
                  <span className="gradient-text">one card away.</span>
                </h2>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="mt-6 text-lg text-ink-muted text-pretty">
                  First 500 athletes get <span className="text-accent font-semibold">3 months of Pro free</span>.
                  No card required. Takes 30 seconds.
                </p>
              </Reveal>

              {/* Progress bar */}
              <Reveal delay={0.16}>
                <div className="mx-auto mt-6 max-w-sm">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-ink-muted">
                      <span className="text-accent font-bold">{spotsClaimed}</span> of {PRO_SPOTS_TOTAL} Pro spots claimed
                    </span>
                    <span className="text-ink-dim">{PRO_SPOTS_TOTAL - spotsClaimed} left</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(spotsClaimed / PRO_SPOTS_TOTAL) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent"
                    />
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <AnimatePresence mode="wait" initial={false}>
                  {!submitted ? (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      action={formAction}
                      className="mx-auto mt-9 max-w-md"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <label htmlFor="waitlist-email" className="sr-only">
                          Email address
                        </label>
                        <input
                          id="waitlist-email"
                          name="email"
                          type="email"
                          required
                          placeholder="you@school.edu"
                          aria-invalid={!state.ok && state.message ? true : undefined}
                          aria-describedby={
                            !state.ok && state.message ? "waitlist-error" : undefined
                          }
                          className="h-12 flex-1 rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm text-ink placeholder:text-ink-dim transition-all focus:border-accent/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-accent/20 aria-[invalid=true]:border-red-500/40 aria-[invalid=true]:focus:ring-red-500/20"
                        />
                        <input
                          type="text"
                          name="company"
                          tabIndex={-1}
                          autoComplete="off"
                          className="absolute h-0 w-0 opacity-0"
                          aria-hidden
                        />
                        <input type="hidden" name="source" value="landing" />
                        <SubmitButton />
                      </div>
                      {!state.ok && state.message && (
                        <motion.p
                          id="waitlist-error"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          role="alert"
                          className="mt-3 flex items-center justify-center gap-1.5 text-xs text-red-400"
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          {state.message}
                        </motion.p>
                      )}
                    </motion.form>
                  ) : (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      role="status"
                      className="mx-auto mt-9 flex max-w-md items-center justify-center gap-3 rounded-full border border-accent/30 bg-accent/10 px-5 py-3"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      >
                        <Check className="h-4 w-4 text-accent" strokeWidth={3} />
                      </motion.div>
                      <span className="text-sm font-medium text-ink">
                        {state.message}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>

              {/* Trust signals */}
              <Reveal delay={0.24}>
                <div className="mt-5 flex items-center justify-center gap-4 text-xs text-ink-dim">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3" />
                    Secure signup
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-ink-dim sm:inline-block" />
                  <span>We never spam or sell your data</span>
                </div>
              </Reveal>

              <Reveal delay={0.28}>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-dim">
                  <span>Free forever plan</span>
                  <span className="hidden h-1 w-1 rounded-full bg-ink-dim sm:inline-block" />
                  <span>No credit card</span>
                  <span className="hidden h-1 w-1 rounded-full bg-ink-dim sm:inline-block" />
                  <span>Cancel anytime</span>
                </div>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
