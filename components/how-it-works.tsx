import { Reveal, RevealStagger, RevealItem } from "./motion/reveal";
import { Spotlight } from "./motion/spotlight";

const STEPS = [
  {
    n: "01",
    title: "Claim your athlete card",
    body: "Sign up, drop your sport and school, and grab your custom URL: www.nilcard.app/yourname.",
    detail: "Takes under 2 minutes. Free to start.",
  },
  {
    n: "02",
    title: "Let AI build the first draft",
    body: "Generate your bio, captions, and sponsor pitches in one click. Edit, approve, publish.",
    detail: "5 free AI generations included.",
  },
  {
    n: "03",
    title: "Plug in monetization",
    body: "Turn on tips and brand inquiries, and run deals from first message to signed — all in one card.",
    detail: "Powered by Stripe. Direct deposit.",
  },
  {
    n: "04",
    title: "Share it everywhere",
    body: "Drop your link in every bio. Fans support you. Brands DM you. The card does the rest.",
    detail: "Tracked, analyzed, and optimized.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative section">
      <div className="container-tight">
        <div className="grid items-end gap-8 lg:grid-cols-2">
          <div>
            <Reveal>
              <div className="eyebrow">
                <span className="h-px w-6 bg-accent" />
                How it works
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-5 text-display-lg font-semibold tracking-tight text-balance">
                <span className="text-ink">Live in </span>
                <span className="text-accent">10 minutes.</span>
                <br />
                <span className="text-ink-muted">Earning in 10 days.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <p className="text-base text-ink-muted text-pretty lg:max-w-md lg:text-right lg:ml-auto">
              No agency. No web designer. No copywriter. Just you, your card, and a platform built
              specifically for the way athletes make money in 2026.
            </p>
          </Reveal>
        </div>

        <RevealStagger
          staggerChildren={0.1}
          delayChildren={0.1}
          className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map((s, i) => (
            <RevealItem key={s.n} y={30}>
              <Spotlight className="rounded-2xl">
                <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/30">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium tracking-wider text-ink-dim">
                      STEP {s.n}
                    </span>
                    <span className="text-3xl font-bold text-white/[0.04] transition-colors duration-500 group-hover:text-accent/30">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted text-pretty">{s.body}</p>
                  <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-[11px] text-ink-dim">
                    <span className="h-1 w-1 rounded-full bg-accent" />
                    {s.detail}
                  </div>
                </div>
              </Spotlight>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
