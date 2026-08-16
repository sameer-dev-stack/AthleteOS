import {
  IdCard,
  Link as LinkIcon,
  BarChart3,
  BadgeCheck,
  Paintbrush,
  MessageSquare,
  Lock,
  ChartLine,
} from "lucide-react";
import { Reveal, RevealStagger, RevealItem } from "./motion/reveal";
import { Spotlight } from "./motion/spotlight";

export function Features() {
  return (
    <section id="product" className="section">
      <div className="container-tight">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <div className="eyebrow justify-center">
              <span className="h-px w-6 bg-accent" />
              What you get
              <span className="h-px w-6 bg-accent" />
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-5 text-display-lg font-semibold tracking-tight text-balance">
              <span className="gradient-text">Every tool an athlete needs</span>
              <br />
              <span className="text-ink-muted">to act like a brand.</span>
            </h2>
          </Reveal>
        </div>

        <RevealStagger
          staggerChildren={0.07}
          delayChildren={0.1}
          amount={0.1}
          className="mt-16 grid auto-rows-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-6"
        >
          {/* Big card: profile */}
          <RevealItem className="sm:col-span-2 lg:col-span-4 lg:row-span-2">
            <FeatureCard
              icon={IdCard}
              title="A profile that looks pro out of the box"
              body="Premium athlete card with bio, sport, school, stats, highlights, media, and a verified athlete badge. No design skills required."
            >
              <div className="mt-6 rounded-2xl border border-white/[0.06] bg-bg-elev p-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/40 to-accent/10 animate-pulse-soft" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">Maya Reyes</p>
                      <BadgeCheck className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <p className="text-[11px] text-ink-muted">
                      Guard · Stanford Basketball
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {["Bio", "Stats", "Reel", "Shop"].map((t) => (
                    <div
                      key={t}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-2 text-center text-[10px] font-medium text-ink-muted transition-colors hover:border-accent/30 hover:text-accent"
                    >
                      {t}
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[78%] rounded-full bg-accent" />
                </div>
                <p className="mt-2 text-[10px] text-ink-dim">
                  Profile strength · 78%
                </p>
              </div>
            </FeatureCard>
          </RevealItem>

          <RevealItem className="sm:col-span-2 lg:col-span-2">
            <FeatureCard
              icon={LinkIcon}
              title="One link in bio"
              body="Replace every link-in-bio service. Your card hosts everything: socials, deals, content, monetization."
            />
          </RevealItem>

          <RevealItem className="sm:col-span-2 lg:col-span-2">
            <FeatureCard
              icon={BadgeCheck}
              title="Verified athlete badge"
              body="Prove you're the real deal. Brands and fans see a verified mark on every profile."
            />
          </RevealItem>

          <RevealItem className="sm:col-span-2 lg:col-span-2">
            <FeatureCard
              icon={BarChart3}
              title="Real analytics"
              body="Profile views, link clicks, deal inquiries, revenue — actually tracked, not guessed."
            >
              <div className="mt-5 flex items-end gap-1">
                {[28, 42, 35, 56, 48, 71, 65, 84].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-all duration-500 ${
                      i >= 5 ? "bg-accent" : "bg-white/10"
                    }`}
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </FeatureCard>
          </RevealItem>

          <RevealItem className="sm:col-span-2 lg:col-span-2">
            <FeatureCard
              icon={MessageSquare}
              title="Deal inbox"
              body="Brand inquiries, booking requests, and shoutout orders all land in one inbox."
            />
          </RevealItem>

          <RevealItem className="sm:col-span-2 lg:col-span-2">
            <FeatureCard
              icon={Paintbrush}
              title="Custom-built, not template-built"
              body="Themes, accent colors, layout blocks. Make your card feel like you, not a form."
            />
          </RevealItem>

          <RevealItem className="sm:col-span-2 lg:col-span-3">
            <FeatureCard
              icon={Lock}
              title="Social media integration"
              body="Connect Instagram, TikTok, and Twitter. Your follower count and engagement update automatically on your card."
            />
          </RevealItem>

          <RevealItem className="sm:col-span-2 lg:col-span-3">
            <FeatureCard
              icon={ChartLine}
              title="Profile improvement engine"
              body="NIL CARD scores your card and tells you exactly what to fix to look more brand-ready."
            />
          </RevealItem>
        </RevealStagger>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <Spotlight className="h-full overflow-hidden rounded-2xl">
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-bg-card/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-ink-muted transition-all duration-300 group-hover:border-accent/40 group-hover:text-accent group-hover:shadow-[0_0_20px_-4px_rgba(198,255,61,0.5)]">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <h3
          className="mt-5 text-base font-semibold tracking-tight"
        >
          {title.replace(/&rsquo;/g, "\u2019").replace(/&amp;/g, "&")}
        </h3>
        <p
          className="mt-1.5 text-sm leading-relaxed text-ink-muted text-pretty"
        >
          {body.replace(/&rsquo;/g, "\u2019").replace(/&amp;/g, "&")}
        </p>
        {children}
      </div>
    </Spotlight>
  );
}
