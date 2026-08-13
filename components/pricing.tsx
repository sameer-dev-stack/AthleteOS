import Link from "next/link";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Reveal, RevealStagger, RevealItem } from "./motion/reveal";
import { Spotlight } from "./motion/spotlight";
import { Magnetic } from "./motion/magnetic";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Get your card live and start collecting tips today.",
    cta: "Start free",
    ctaHref: "/auth/sign-up",
    highlight: false,
    features: [
      "Public athlete card",
      "Custom URL",
      "Tips & basic monetization",
      "5 AI actions / mo",
      "Basic analytics",
    ],
  },
  {
    name: "Pro",
    price: "$14",
    cadence: "/ month",
    blurb: "For serious athletes building a real NIL business.",
    cta: "Go Pro",
    ctaHref: "/auth/sign-up",
    highlight: true,
    features: [
      "Everything in Free",
      "NIL Valuation & Score Card",
      "Editable NIL Rate Card",
      "3-in-1 Sponsor Pitch Generator",
      "300 AI actions / mo",
      "Full revenue dashboard",
    ],
  },
  {
    name: "Elite",
    price: "$29",
    cadence: "/ month",
    blurb: "For top athletes who want the full NIL operating system.",
    cta: "Go Elite",
    ctaHref: "/auth/sign-up",
    highlight: false,
    features: [
      "Everything in Pro",
      "500 AI actions / mo",
      "Advanced sponsor kit",
      "Custom domain",
      "Verified athlete badge",
      "Early access features",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="section">
      <div className="container-tight">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <div className="eyebrow justify-center">
              <span className="h-px w-6 bg-accent" />
              Pricing
              <span className="h-px w-6 bg-accent" />
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-5 text-display-lg font-semibold tracking-tight text-balance">
              <span className="text-ink">Free to launch.</span>{" "}
              <span className="text-ink-muted">Pay when it pays off.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-5 text-lg text-ink-muted text-pretty">
              Start with a real product, not a trial. Upgrade when you&rsquo;re ready to scale.
            </p>
          </Reveal>
        </div>

        <RevealStagger
          staggerChildren={0.1}
          delayChildren={0.15}
          className="mt-14 grid gap-5 lg:grid-cols-3"
        >
          {PLANS.map((plan) => (
            <RevealItem key={plan.name} y={30}>
              <Spotlight
                className="h-full rounded-3xl"
                color={plan.highlight ? "rgba(198, 255, 61, 0.18)" : "rgba(198, 255, 61, 0.1)"}
              >
                <div
                  className={`relative flex h-full flex-col rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
                    plan.highlight
                      ? "border-accent/40 bg-gradient-to-b from-accent/[0.06] to-bg-card glow-accent"
                      : "border-white/[0.06] bg-bg-card hover:border-white/[0.14]"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-bg">
                        <Sparkles className="h-3 w-3" />
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-semibold tracking-tight">{plan.name}</h3>
                    {plan.highlight && (
                      <span className="font-mono text-[10px] text-accent">RECOMMENDED</span>
                    )}
                  </div>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    <span className="text-sm text-ink-muted">{plan.price !== "$0" ? plan.cadence : plan.cadence}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">{plan.blurb}</p>

                  <Magnetic strength={0.15} className="mt-6">
                    <Link
                      href={plan.ctaHref}
                      className={
                        plan.highlight
                          ? "btn-primary w-full"
                          : "btn-ghost w-full"
                      }
                    >
                      {plan.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Magnetic>

                  <ul className="mt-7 space-y-3 border-t border-white/[0.06] pt-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-ink">
                        <Check
                          className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                            plan.highlight ? "text-accent" : "text-ink-muted"
                          }`}
                          strokeWidth={2.4}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Spotlight>
            </RevealItem>
          ))}
        </RevealStagger>

        <Reveal delay={0.3}>
          <p className="mt-10 text-center text-xs text-ink-dim">
            Prices in USD · Cancel anytime · Stripe secure checkout
          </p>
        </Reveal>
      </div>
    </section>
  );
}
