import { Check } from "lucide-react";
import { Reveal, RevealStagger, RevealItem } from "./motion/reveal";
import { Tilt } from "./motion/tilt";

const PILLARS = [
  "Your athlete card replaces 8 scattered links",
  "Built-in monetization from day one",
  "AI does the copy so you can play the game",
  "Brand-ready profile that gets you taken seriously",
];

export function Solution() {
  return (
    <section className="relative section">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-accent/[0.04] blur-[140px] animate-orb-1"
        aria-hidden
      />
      <div className="container-tight relative">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <div className="eyebrow">
                <span className="h-px w-6 bg-accent" />
                The solution
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-5 text-display-lg font-semibold tracking-tight text-balance">
                <span className="text-ink">One athlete card.</span>
                <br />
                <span className="gradient-text">Everything that pays.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 max-w-lg text-lg text-ink-muted text-pretty">
                 NIL CARD is the operating system for your name, image, and likeness. Build a premium public
                card, plug in monetization, and let AI do the writing — so your audience becomes your business.
              </p>
            </Reveal>

            <RevealStagger
              staggerChildren={0.08}
              delayChildren={0.18}
              className="mt-8 space-y-3.5"
            >
              {PILLARS.map((p) => (
                <RevealItem key={p} y={12}>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] text-ink">{p}</span>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>

          <div className="lg:col-span-6">
            <Reveal delay={0.15} y={40}>
              <Tilt max={6} scale={1.01} sheen={false}>
                <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-bg-card via-bg-elev to-bg p-1">
                  <div className="rounded-[22px] bg-bg p-6 sm:p-8">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-accent animate-pulse-soft" />
                        <span className="font-mono text-[11px] text-ink-muted">nilcard.app/maya</span>
                      </div>
                      <span className="chip">Live profile</span>
                    </div>

                    <div className="space-y-3">
                      <PreviewRow label="Bio" value="AI-drafted in 4 sec" tone="accent" />
                      <PreviewRow label="Stats card" value="PPG · APG · Reach" />
                      <PreviewRow label="Highlight reel" value="3 videos · 14K plays" />
                      <PreviewRow label="Tip jar" value="$847 this month" tone="accent" />
                      <PreviewRow label="Sponsor inquiries" value="2 new · Gymshark, Celsius" />
                      <PreviewRow label="Membership" value="42 paying fans" />
                    </div>

                    <div className="mt-6 flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/[0.06] p-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-accent">
                          Monthly takeaway
                        </p>
                        <p className="mt-0.5 text-2xl font-bold tracking-tight">$2,348</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-accent">
                        <span>↑ 38%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Tilt>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "accent";
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <span className={`text-[13px] font-medium ${tone === "accent" ? "text-accent" : "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}
