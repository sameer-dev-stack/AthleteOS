import { Star } from "lucide-react";
import { Reveal } from "./motion/reveal";

const TESTIMONIALS = [
  {
    quote: "I set up my card in 10 minutes and got my first brand inquiry the next week. AthleteOS made me look legit.",
    name: "Maya Chen",
    sport: "Track & Field",
    school: "University of Oregon",
    initials: "MC",
    gradient: "from-accent/60 to-accent/20",
  },
  {
    quote: "The AI bio builder alone saved me hours. My profile went from basic to professional in minutes.",
    name: "DeShawn Williams",
    sport: "Football",
    school: "Ohio State",
    initials: "DW",
    gradient: "from-blue-500/60 to-blue-500/20",
  },
  {
    quote: "I've earned more from tips on AthleteOS than I ever did from DM deals. The Stripe integration just works.",
    name: "Sofia Rodriguez",
    sport: "Soccer",
    school: "Stanford University",
    initials: "SR",
    gradient: "from-pink-500/60 to-pink-500/20",
  },
];

export function Testimonials() {
  return (
    <section className="relative section">
      <div className="container-tight">
        <Reveal>
          <div className="text-center mb-12">
            <div className="chip mx-auto mb-4">
              <Star className="h-3 w-3 text-accent" />
              <span>What athletes are saying</span>
            </div>
            <h2 className="text-display-lg font-semibold tracking-tight">
              Built by athletes, <span className="gradient-text">for athletes.</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="group relative rounded-2xl border border-white/[0.06] bg-bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/20 hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-ink-muted mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{t.initials}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">{t.name}</div>
                    <div className="text-xs text-ink-dim">{t.sport} · {t.school}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
