import { Shield, Zap, Users } from "lucide-react";
import { AthleteCard } from "./athlete-card";
import { Reveal } from "./motion/reveal";
import { Tilt } from "./motion/tilt";
import { LiveWaitlistCount } from "./motion/live-waitlist-count";
import { HeroCta } from "./hero-cta";
import { TypingText } from "./motion/typing-text";
import { FloatingElements } from "./motion/floating-elements";
import { AnimatedGradientBg } from "./motion/animated-gradient-bg";
import { SocialProofAvatars } from "./motion/social-proof-avatars";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 sm:pt-24 sm:pb-32 lg:pt-28 lg:pb-40">
      <div className="absolute inset-0 grid-bg" aria-hidden />

      <AnimatedGradientBg />
      <FloatingElements />

      {/* Drifting ambient orbs */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[700px] w-[1200px] -translate-x-1/2 rounded-full bg-accent/[0.08] blur-[160px] animate-orb-1"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 -z-10 h-[420px] w-[420px] rounded-full bg-accent/[0.05] blur-[140px] animate-orb-2"
        aria-hidden
      />

      <div className="container-wide relative">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <Reveal>
              <div className="chip">
                <Zap className="h-3 w-3 text-accent" />
                <span>The NIL operating system for athletes</span>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <h1 className="mt-6 text-display-xl font-semibold tracking-tight text-balance">
                <span className="gradient-text">One card.</span>{" "}
                <span className="gradient-text">One link.</span>
                <br />
                <span className="text-ink">Your entire </span>
                <span className="relative inline-block">
                  <TypingText
                    words={["brand.", "empire.", "legacy.", "NIL business."]}
                    className="text-accent"
                    speed={70}
                    deleteSpeed={40}
                    pauseDuration={2400}
                  />
                  <span
                    className="absolute -bottom-1 left-0 right-0 h-[3px] bg-accent/40"
                    aria-hidden
                  />
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-muted text-pretty">
                Build your athlete card, share it everywhere, and turn fans, brands, and sponsors into income —
                all from one page. AI-assisted. Athlete-owned. Built for the next generation.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <HeroCta />
            </Reveal>

            <Reveal delay={0.28}>
              <div className="mt-10 flex flex-col gap-4">
                {/* Social proof row */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-ink-dim">
                  <div className="flex items-center gap-2.5">
                    <SocialProofAvatars />
                    <span>
                      <LiveWaitlistCount className="font-semibold text-ink" />+ athletes joined
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />
                    <span>Free to start · No credit card</span>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-dim">
                  <TrustBadge icon={<Shield className="h-3 w-3" />} text="NCAA compliant" />
                  <TrustBadge icon={<Zap className="h-3 w-3" />} text="2-min setup" />
                  <TrustBadge icon={<Users className="h-3 w-3" />} text="1,247+ athletes" />
                </div>
              </div>
            </Reveal>
          </div>

          <div className="relative flex justify-center lg:col-span-5 lg:justify-end">
            <Reveal delay={0.15} y={40}>
              <Tilt max={9} scale={1.01} className="rounded-[34px]">
                <AthleteCard />
              </Tilt>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 backdrop-blur-sm">
      <span className="text-accent/70">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
