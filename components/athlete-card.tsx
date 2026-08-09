import { BadgeCheck, MapPin, Trophy, Heart, Share2, Sparkles, Calendar, DollarSign } from "lucide-react";
import { SPORT_CONFIG } from "@/lib/sport-config";

const MOCK_SPORT = SPORT_CONFIG.BB;
const MOCK_POSITION = MOCK_SPORT.positions[0];
const MOCK_SCHOOL = "Stanford";
const MOCK_STATS = [
  { label: MOCK_SPORT.statsSchema[0].label, value: "18.4" },
  { label: MOCK_SPORT.statsSchema[1].label, value: "8.2" },
  { label: MOCK_SPORT.statsSchema[2].label, value: "5.1" },
];

export function AthleteCard() {
  return (
    <div
      className="relative w-full max-w-[380px]"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Floating ambient glow */}
      <div className="absolute -inset-12 -z-10 bg-grid-fade blur-2xl" aria-hidden />
      <div
        className="absolute -inset-px -z-10 rounded-[34px] bg-gradient-to-b from-accent/30 via-white/5 to-transparent blur-md"
        style={{ transform: "translateZ(-1px)" }}
        aria-hidden
      />

      {/* Phone frame */}
      <div
        className="relative rounded-[34px] bg-bg-card glow-card overflow-hidden isolate"
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 text-[10px] font-medium text-ink-muted">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-muted/60" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink-muted/60" />
            <span className="h-1.5 w-1.5 rounded-full bg-ink-muted/60" />
          </div>
        </div>

        {/* Cover */}
        <div className="relative h-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-accent/5 to-transparent" />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 50%, rgba(198,255,61,0.4), transparent 40%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.08), transparent 50%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%)",
              backgroundSize: "10px 10px",
            }}
          />
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-bg/60 px-2 py-1 backdrop-blur-md">
            <BadgeCheck className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-semibold">Verified</span>
          </div>
        </div>

        {/* Profile */}
        <div className="relative px-5 pb-5 -mt-10">
          <div className="flex items-end gap-3">
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-accent/40 to-accent/10 ring-4 ring-bg-card overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-bg">
                MR
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center justify-end gap-2">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"
                  aria-label="Share profile"
                >
                  <Share2 className="h-3.5 w-3.5 text-ink-muted" />
                </button>
                <button className="rounded-full bg-accent px-4 py-1.5 text-[11px] font-bold text-bg">
                  Follow
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[17px] font-bold leading-tight">Maya Reyes</h3>
              <BadgeCheck className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-1 text-[12px] text-ink-muted">
              {MOCK_POSITION} · {MOCK_SCHOOL} Women&apos;s {MOCK_SPORT.label}
            </p>
            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-dim">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Palo Alto, CA
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" /> Pac-12 All-Freshman
              </span>
            </div>
          </div>

          {/* Stats — derived from sport config */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            {MOCK_STATS.map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} />
            ))}
          </div>

          {/* Action grid */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ActionTile
              icon={<Heart className="h-3.5 w-3.5" />}
              title="Tip Maya"
              sub="$3+"
            />
            <ActionTile
              icon={<Calendar className="h-3.5 w-3.5" />}
              title="Book me"
              sub="Cameo · DM"
            />
            <ActionTile
              icon={<DollarSign className="h-3.5 w-3.5" />}
              title="Sponsor"
              sub="Brand deals"
              accent
            />
            <ActionTile
              icon={<Sparkles className="h-3.5 w-3.5" />}
              title="Merch"
              sub="MR23 drop"
            />
          </div>

          {/* Latest highlight */}
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-accent/30 to-white/5">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-accent" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold">vs. Oregon — 28pt night</p>
              <p className="text-[10px] text-ink-dim">14.2K plays · 2d ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating receipt: brand deal */}
      <div
        className="absolute -left-12 top-1/3 hidden w-52 lg:block"
        style={{ transform: "translateZ(60px)" }}
      >
        <div className="animate-float-y rotate-[-6deg] rounded-2xl border border-white/[0.08] bg-bg-elev p-3 glow-card">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-bg">
              <DollarSign className="h-3.5 w-3.5" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider text-ink-dim">New deal</p>
              <p className="text-[11px] font-semibold">Gymshark · $2,400</p>
            </div>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-3/4 rounded-full bg-accent" />
          </div>
        </div>
      </div>

      {/* Floating receipt: AI */}
      <div
        className="absolute -right-10 top-20 hidden w-56 lg:block"
        style={{ transform: "translateZ(80px)" }}
      >
        <div
          className="animate-float-y rotate-[5deg] rounded-2xl border border-white/[0.08] bg-bg-elev p-3 glow-card"
          style={{ animationDelay: "1.2s" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              AI bio · drafted
            </p>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-ink">
            &ldquo;D1 guard. Stanford. Game-changer on and off the court.&rdquo;
          </p>
          <div className="mt-2 flex items-center justify-between text-[9px] text-ink-dim">
            <span>3 of 5 free generations</span>
            <span className="text-accent">Use</span>
          </div>
        </div>
      </div>

      {/* Floating notif */}
      <div
        className="absolute -right-6 bottom-16 hidden w-44 lg:block"
        style={{ transform: "translateZ(45px)" }}
      >
        <div
          className="animate-float-y rotate-[4deg] rounded-2xl border border-white/[0.08] bg-bg-elev p-3 glow-card"
          style={{ animationDelay: "2.4s" }}
        >
          <div className="flex items-center gap-2">
            <Heart className="h-3.5 w-3.5 fill-accent text-accent" />
            <div>
              <p className="text-[11px] font-semibold">+$45 tipped</p>
              <p className="text-[9px] text-ink-dim">@jordan_h · just now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-[15px] font-bold ${highlight ? "text-accent" : ""}`}>{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-ink-dim">{label}</p>
    </div>
  );
}

function ActionTile({
  icon,
  title,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border p-2.5 transition-colors ${
        accent
          ? "border-accent/40 bg-accent/[0.06]"
          : "border-white/[0.06] bg-white/[0.02]"
      }`}
    >
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
          accent ? "bg-accent text-bg" : "bg-white/5 text-ink"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold leading-tight">{title}</p>
        <p className="text-[9px] text-ink-dim">{sub}</p>
      </div>
    </div>
  );
}
