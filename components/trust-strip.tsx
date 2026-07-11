import { Reveal } from "./motion/reveal";

const TRUST_ITEMS = [
  "D1 Basketball",
  "Football",
  "Track & Field",
  "Gymnastics",
  "Soccer",
  "Volleyball",
  "Wrestling",
  "Swim",
  "Lacrosse",
  "Hockey",
  "Tennis",
  "Baseball",
  "Softball",
  "Esports",
];

export function TrustStrip() {
  return (
    <section className="relative border-y border-white/[0.05] bg-white/[0.01] py-8">
      <div className="container-wide">
        <Reveal>
          <p className="mb-5 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-ink-dim">
            Built for the next generation of NIL athletes
          </p>
        </Reveal>
        <div className="relative mask-fade-edges overflow-hidden">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
            {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
              <span
                key={i}
                className="text-sm font-medium tracking-tight text-ink-muted/80 transition-colors hover:text-accent"
              >
                {item}
                <span className="ml-10 text-ink-dim/30">&middot;</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
