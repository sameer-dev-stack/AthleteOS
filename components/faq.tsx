"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Reveal, RevealStagger, RevealItem } from "./motion/reveal";

const FAQS = [
  {
    q: "Who is NIL CARD for?",
    a: "Student-athletes at any level who want to look professional, get discovered by brands, and turn their audience into income. Works for D1 stars, JUCO, high-school recruits, and Olympic hopefuls.",
  },
  {
    q: "Is this compliant with NCAA and state NIL rules?",
    a: "Yes. NIL CARD gives athletes the platform; you control which deals you accept. We integrate with standard NIL disclosure flows and support school and collective compliance teams at the Team tier.",
  },
  {
    q: "What does the free plan actually include?",
    a: "A live public athlete card, custom URL, tip jar, basic monetization, 5 total AI generations per month, and basic analytics. It&rsquo;s a real product — not a 14-day trial.",
  },
  {
    q: "Why are AI tools metered instead of unlimited?",
    a: "Honesty: real AI is expensive. Metering keeps the free plan free forever, and keeps Pro affordable. Power users get unlimited generations on Pro for $14/month.",
  },
  {
    q: "How do payouts work?",
    a: "Stripe-powered. Direct deposit to your bank account, usually within 2 business days. Athletes keep 92%+ of every dollar after standard payment processing.",
  },
  {
    q: "Can my school or collective onboard a whole roster?",
    a: "Yes. The Team plan handles bulk onboarding, branded team pages, roster analytics, and compliance support. Hit Contact sales to talk.",
  },
  {
    q: "When does the platform launch?",
    a: "Private beta is rolling out now. Waitlist athletes get early access in waves. The first 500 signups get 3 months of Pro for free.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section">
      <div className="container-tight">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <div className="eyebrow">
                <span className="h-px w-6 bg-accent" />
                FAQ
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-5 text-display-lg font-semibold tracking-tight text-balance">
                <span className="text-ink">Real questions,</span>
                <br />
                <span className="gradient-text">straight answers.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 text-sm text-ink-muted text-pretty">
                Still curious? Email{" "}
                <a href="mailto:hey@nilcard.app" className="text-accent hover:underline">
                  hey@nilcard.app
                </a>{" "}
                and a real person will get back to you fast.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <Reveal delay={0.1}>
              <RevealStagger
                staggerChildren={0.05}
                className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-bg-card overflow-hidden"
              >
                {FAQS.map((item, i) => {
                  const isOpen = open === i;
                  const panelId = `faq-panel-${i}`;
                  const buttonId = `faq-button-${i}`;
                  return (
                    <RevealItem key={item.q} y={10}>
                      <div className="group">
                        <button
                          id={buttonId}
                          onClick={() => setOpen(isOpen ? null : i)}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          className="w-full text-left transition-colors hover:bg-white/[0.02]"
                        >
                          <div className="flex items-center justify-between gap-4 px-6 py-5">
                            <span
                              className={cn(
                                "text-[15px] font-medium tracking-tight transition-colors",
                                isOpen ? "text-ink" : "text-ink group-hover:text-ink"
                              )}
                            >
                              {item.q}
                            </span>
                            <span
                              aria-hidden
                              className={cn(
                                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                                isOpen
                                  ? "border-accent bg-accent text-bg scale-105"
                                  : "border-white/10 bg-white/[0.03] text-ink-muted group-hover:border-white/20"
                              )}
                            >
                              {isOpen ? (
                                <Minus className="h-3.5 w-3.5" strokeWidth={2.4} />
                              ) : (
                                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                              )}
                            </span>
                          </div>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              id={panelId}
                              role="region"
                              aria-labelledby={buttonId}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden"
                            >
                              <p
                                className="px-6 pb-6 text-[14px] leading-relaxed text-ink-muted text-pretty"
                                dangerouslySetInnerHTML={{ __html: item.a }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </RevealItem>
                  );
                })}
              </RevealStagger>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
