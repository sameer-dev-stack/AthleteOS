import { Heart, Users, Mic, ShoppingBag, Handshake, Link as LinkIcon } from "lucide-react";
import { Reveal, RevealStagger, RevealItem } from "./motion/reveal";
import { Spotlight } from "./motion/spotlight";
import { Tilt } from "./motion/tilt";
import { Counter } from "./motion/counter";

const STREAMS = [
  { icon: Heart, label: "Tips", note: "From $1+" },
  { icon: Handshake, label: "Brand deals", note: "Won & logged" },
  { icon: Mic, label: "Paid shoutouts", note: "Per request" },
  { icon: ShoppingBag, label: "Merch", note: "Print + ship" },
  { icon: LinkIcon, label: "Affiliate links", note: "Auto-tracked" },
];

export function Monetization() {
  return (
    <section id="monetize" className="relative section">
      <div className="container-tight">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <Reveal>
              <div className="eyebrow">
                <span className="h-px w-6 bg-accent" />
                Monetization
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="mt-5 text-display-lg font-semibold tracking-tight text-balance">
                <span className="text-ink">Turn your audience</span>
                <br />
                <span className="text-accent">into income.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-5 max-w-lg text-lg text-ink-muted text-pretty">
                You shouldn&rsquo;t need 4 apps and a manager to make money from your following. Every
                athlete card ships with six revenue streams ready to switch on.
              </p>
            </Reveal>

            <RevealStagger
              staggerChildren={0.06}
              delayChildren={0.18}
              className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {STREAMS.map((s) => (
                <RevealItem key={s.label} y={16}>
                  <Spotlight className="rounded-xl">
                    <div className="group rounded-xl border border-white/[0.06] bg-bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/30">
                      <s.icon className="h-4 w-4 text-accent transition-transform duration-300 group-hover:scale-110" strokeWidth={1.8} />
                      <p className="mt-3 text-sm font-semibold">{s.label}</p>
                      <p className="mt-0.5 text-[11px] text-ink-dim">{s.note}</p>
                    </div>
                  </Spotlight>
                </RevealItem>
              ))}
            </RevealStagger>

            <Reveal delay={0.32}>
              <p className="mt-6 text-xs text-ink-dim">
                Payments via Stripe · Direct deposit · Athletes keep 92%+ of every dollar
              </p>
            </Reveal>
          </div>

          {/* Dashboard mockup */}
          <div className="lg:col-span-6">
            <Reveal delay={0.15} y={40}>
              <Tilt max={6} scale={1.01} sheen={false}>
                <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-bg-card glow-card">
                  <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    </div>
                    <span className="font-mono text-[11px] text-ink-dim">dashboard.nilcard.app</span>
                    <div className="w-8" />
                  </div>

                  <div className="p-5 sm:p-7">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-ink-dim">
                          Lifetime earnings
                        </p>
                        <p className="mt-1 text-4xl font-bold tracking-tight">
                          $<Counter to={12847} duration={2} />
                          <span className="text-ink-muted">.20</span>
                        </p>
                      </div>
                      <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        +$<Counter to={2348} duration={2} /> this mo
                      </span>
                    </div>

                    {/* Chart */}
                    <div className="mt-6 h-32 w-full">
                      <svg viewBox="0 0 300 100" className="h-full w-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="ch" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C6FF3D" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#C6FF3D" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,80 C30,75 50,60 80,55 C110,50 140,68 170,50 C200,35 230,40 260,22 L300,12 L300,100 L0,100 Z"
                          fill="url(#ch)"
                        />
                        <path
                          d="M0,80 C30,75 50,60 80,55 C110,50 140,68 170,50 C200,35 230,40 260,22 L300,12"
                          fill="none"
                          stroke="#C6FF3D"
                          strokeWidth="1.8"
                          strokeDasharray="500"
                          strokeDashoffset="500"
                          className="animate-[draw_2.5s_ease-out_forwards]"
                        />
                        <circle cx="300" cy="12" r="4" fill="#C6FF3D" className="animate-pulse-soft" />
                      </svg>
                    </div>

                    <div className="mt-2 grid grid-cols-7 text-center text-[10px] text-ink-dim">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>

                    {/* Recent activity */}
                    <div className="mt-6 space-y-2">
                      <ActivityRow source="Gymshark · Brand deal" amount="+$2,400" tag="Deal" />
                      <ActivityRow source="Membership · 42 fans" amount="+$378" tag="Recurring" />
                      <ActivityRow source="Tip · @jordan_h" amount="+$45" tag="Tip" />
                      <ActivityRow source="Shoutout · 8 orders" amount="+$240" tag="Bookings" />
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

function ActivityRow({
  source,
  amount,
  tag,
}: {
  source: string;
  amount: string;
  tag: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-2.5 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{source}</p>
        <p className="text-[10px] text-ink-dim">{tag}</p>
      </div>
      <span className="font-mono text-sm font-semibold text-accent">{amount}</span>
    </div>
  );
}
