import { Sparkles, Zap, Mail, FileText, Lock } from "lucide-react";
import { Reveal, RevealStagger, RevealItem } from "./motion/reveal";
import { Spotlight } from "./motion/spotlight";
import { Tilt } from "./motion/tilt";

const TOOLS = [
  {
    icon: FileText,
    name: "Bio Generator",
    desc: "Punchy, on-brand bios in your voice. Pick a tone, hit go.",
    free: "3/mo",
    pro: "Unlimited",
  },
  {
    icon: Mail,
    name: "Sponsor Pitch Writer",
    desc: "Outreach DMs and emails to brands, collectives, and agencies.",
    free: "2/mo",
    pro: "Unlimited",
  },
  {
    icon: Sparkles,
    name: "Caption Generator",
    desc: "Post-game captions, highlight drops, sponsor posts. Done in seconds.",
    free: "5/mo",
    pro: "Unlimited",
  },
  {
    icon: Zap,
    name: "Profile Improver",
    desc: "AI scans your card and rewrites weak sections to be more brand-ready.",
    free: "1/mo",
    pro: "Unlimited",
  },
];

export function AIFeatures() {
  return (
    <section id="ai" className="relative section">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-gradient-to-b from-accent/[0.04] to-transparent"
        aria-hidden
      />
      <div className="container-tight">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="eyebrow">
                <span className="h-px w-6 bg-accent" />
                AI, but useful
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-5 text-display-lg font-semibold tracking-tight text-balance">
                <span className="text-ink">Built-in AI tools</span>
                <br />
                <span className="gradient-text">that actually save you hours.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 text-lg text-ink-muted text-pretty">
                No chatbot. No fluff. Structured tools that draft your bio, pitch sponsors, and
                write captions in your voice — so you stop typing and start playing.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-7 rounded-2xl border border-white/[0.06] bg-bg-card p-5">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-ink-muted" />
                  <p className="text-sm font-semibold">Free has limits. On purpose.</p>
                </div>
                <p className="mt-2 text-sm text-ink-muted text-pretty">
                  Each free account gets a monthly quota across all AI tools. Hit the cap?
                  You&rsquo;ll see exactly where you stand — and upgrade only if it&rsquo;s pulling
                  its weight.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <RevealStagger
              staggerChildren={0.08}
              delayChildren={0.1}
              className="grid gap-3 sm:grid-cols-2"
            >
              {TOOLS.map((tool) => (
                <RevealItem key={tool.name} y={20}>
                  <Spotlight className="rounded-2xl">
                    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/20">
                      <div className="flex items-start justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent transition-all duration-300 group-hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)]">
                          <tool.icon className="h-4 w-4" strokeWidth={1.8} />
                        </div>
                        <span className="chip !text-[10px]">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI
                        </span>
                      </div>
                      <h3 className="mt-4 text-base font-semibold tracking-tight">{tool.name}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-muted text-pretty">
                        {tool.desc}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-ink-dim">Free:</span>
                          <span className="font-mono font-medium text-ink-muted">{tool.free}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-ink-dim">Pro:</span>
                          <span className="font-mono font-medium text-accent">{tool.pro}</span>
                        </div>
                      </div>
                    </div>
                  </Spotlight>
                </RevealItem>
              ))}
            </RevealStagger>

            <Reveal delay={0.3}>
              <Tilt max={4} scale={1} sheen={false}>
                <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-bg-card to-bg p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-bg">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm font-semibold">Sponsor Pitch · drafted in 3.2s</p>
                    </div>
                    <span className="font-mono text-[10px] text-ink-dim">attempt 1 of 2 free</span>
                  </div>
                  <div className="mt-4 rounded-xl border border-white/[0.05] bg-bg p-4 font-mono text-[12px] leading-relaxed text-ink-muted">
                    <span className="text-accent">{"// To:"}</span> partnerships@gymshark.com
                    <br />
                    <span className="text-accent">{"// Subject:"}</span> D1 guard at Stanford — quick collab idea
                    <br />
                    <br />
                    Hey Gymshark team — I&rsquo;m Maya, a starting guard at Stanford. Played in front of
                    14K+ fans this season and built a 142K-follower audience that overlaps hard with your
                    core demo. Saw your new training line drop — I&rsquo;d love to put together a content
                    package that...
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
