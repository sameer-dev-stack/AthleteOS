import { Link2Off, EyeOff, Wallet, Hourglass } from "lucide-react";
import { Reveal, RevealStagger, RevealItem } from "./motion/reveal";
import { Spotlight } from "./motion/spotlight";

const PROBLEMS = [
  {
    icon: Link2Off,
    title: "Your brand lives in 8 different apps.",
    body: "Instagram bio. TikTok link. Highlights on Hudl. DMs for deals. Nothing is consolidated. Nothing converts.",
  },
  {
    icon: EyeOff,
    title: "Brands can&rsquo;t find you.",
    body: "Sponsors and collectives scroll past athletes who don&rsquo;t look professional online. A bad profile loses you real money.",
  },
  {
    icon: Wallet,
    title: "Your audience isn&rsquo;t paying you.",
    body: "You&rsquo;ve got 50K followers but $0 from them. Tips, memberships, shoutouts, merch — none of it is set up.",
  },
  {
    icon: Hourglass,
    title: "Writing copy eats your time.",
    body: "Bios, captions, sponsor pitches, DMs. You&rsquo;re an athlete, not a copywriter. Most pitches never get sent.",
  },
];

export function Problem() {
  return (
    <section className="section">
      <div className="container-tight">
        <div className="max-w-2xl">
          <Reveal>
            <div className="eyebrow">
              <span className="h-px w-6 bg-accent" />
              The problem
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-5 text-display-lg font-semibold tracking-tight text-balance">
              <span className="text-ink">NIL changed the game.</span>{" "}
              <span className="text-ink-muted">The tools didn&rsquo;t.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-5 text-lg text-ink-muted text-pretty">
              Athletes are running a business now — without the infrastructure of one.
              The result: blown opportunities, lost income, and slow growth.
            </p>
          </Reveal>
        </div>

        <RevealStagger
          staggerChildren={0.1}
          delayChildren={0.1}
          className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.03] sm:grid-cols-2"
        >
          {PROBLEMS.map((p) => (
            <RevealItem key={p.title}>
              <Spotlight className="h-full overflow-hidden">
                <div className="group relative h-full bg-bg p-8 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-ink-muted transition-colors group-hover:border-accent/30 group-hover:text-accent">
                    <p.icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <h3
                    className="mt-5 text-lg font-semibold tracking-tight"
                    dangerouslySetInnerHTML={{ __html: p.title }}
                  />
                  <p
                    className="mt-2 text-[15px] leading-relaxed text-ink-muted text-pretty"
                    dangerouslySetInnerHTML={{ __html: p.body }}
                  />
                </div>
              </Spotlight>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
