"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Trophy,
  ExternalLink,
  Star,
  Sparkles,
} from "lucide-react";
import { searchPublicAthletes, type DiscoveryAthlete } from "@/lib/actions/discovery";
import { Logo } from "@/components/logo";
import { Tilt } from "@/components/motion/tilt";
import { Spotlight } from "@/components/motion/spotlight";
import { getFallbackGradient } from "@/lib/sport-config";
import { BorderGlow } from "@/components/border-glow";

type Props = {
  initialAthletes: DiscoveryAthlete[];
  initialProAthletes: DiscoveryAthlete[];
  initialRegularAthletes: DiscoveryAthlete[];
  initialTotal: number;
  sports: string[];
};

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/* ── Pro badge (glass style, matches profile-card.tsx) ── */
const PRO_ACCENT = "#C6FF3D";

function ProBadge() {
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2 py-0.5 h-5 flex-shrink-0"
      style={{
        background: "rgba(0,0,0,0.5)",
        border: `1px solid ${PRO_ACCENT}30`,
        backdropFilter: "blur(12px)",
        boxShadow: "0 0 8px 0 rgba(198,255,61,0.18)",
      }}
    >
      <Star className="h-2.5 w-2.5" style={{ color: PRO_ACCENT }} fill={PRO_ACCENT} />
      <span className="text-[8px] font-black tracking-wider" style={{ color: PRO_ACCENT }}>
        PRO
      </span>
    </div>
  );
}

/* ── Verified badge (animated GIF) ── */
function VerifiedBadge() {
  return (
    <Image
      src="/verified.gif"
      alt="Verified"
      width={16}
      height={16}
      unoptimized
      className="flex-shrink-0"
    />
  );
}

/* ── Pro Spotlight Card (horizontal strip) ── */
function ProSpotlightCard({ athlete, index }: { athlete: DiscoveryAthlete; index: number }) {
  const gradient = getFallbackGradient(athlete.sport);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="snap-start min-w-[280px] sm:min-w-[320px]"
    >
      <Tilt max={8} scale={1.015} className="rounded-2xl overflow-hidden">
        <Spotlight size={280} color="rgba(198,255,61,0.12)" className="rounded-2xl overflow-hidden">
          <BorderGlow
            edgeSensitivity={30}
            glowColor="78 100 62"
            backgroundColor="#101012"
            borderRadius={16}
            glowRadius={40}
            glowIntensity={1.0}
            coneSpread={28}
            animated={true}
            colors={['#C6FF3D', '#a5d933', '#85b029']}
            fillOpacity={0.35}
            className="w-full"
          >
            <Link
              href={`/${athlete.username}`}
              className="relative block rounded-2xl bg-bg-card overflow-hidden"
            >
              {/* Continuous background gradient overlay */}
              <div
                className="absolute inset-x-0 top-0 h-44 pointer-events-none"
                style={{ background: gradient }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#101012]/40 to-[#101012]" />
              </div>

              {/* Card Body Content */}
              <div className="relative z-10 px-4 pt-4">
                {/* Avatar */}
                <div
                  className="h-12 w-12 rounded-full border-2 border-[#101012] overflow-hidden bg-[#101012]"
                  style={{ boxShadow: "0 0 0 1px rgba(198,255,61,0.25)" }}
                >
                  {athlete.avatar_url ? (
                    <Image
                      src={athlete.avatar_url}
                      alt={athlete.full_name ?? athlete.username ?? "Athlete"}
                      width={48}
                      height={48}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-accent/10 text-lg font-bold text-accent">
                      {(athlete.full_name || athlete.username || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="pt-2.5 pb-3">
                  {/* Name + badges */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">
                      {athlete.full_name || "Unnamed Athlete"}
                    </h3>
                    {athlete.is_verified && <VerifiedBadge />}
                    <ProBadge />
                  </div>

                  {/* Sport + school chips */}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {athlete.sport && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-ink-muted">
                        <Trophy className="h-3 w-3" />
                        {athlete.sport}
                      </span>
                    )}
                    {athlete.school && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-ink-muted">
                        <MapPin className="h-3 w-3" />
                        {athlete.school}
                      </span>
                    )}
                  </div>

                  {/* Followers footer */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Users className="h-3.5 w-3.5" />
                      {athlete.total_followers > 0 ? (
                        <span>
                          <span className="font-medium text-white">{formatFollowers(athlete.total_followers)}</span>{" "}
                          followers
                        </span>
                      ) : (
                        <span className="text-ink-dim">No socials linked</span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                      View
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </BorderGlow>
        </Spotlight>
      </Tilt>
    </motion.div>
  );
}

/* ── Regular athlete grid card ── */
function AthleteCard({ athlete, index }: { athlete: DiscoveryAthlete; index: number }) {
  const isPro = athlete.plan === "pro";
  const gradient = getFallbackGradient(athlete.sport);

  const cardContent = (
    <Link
      href={`/${athlete.username}`}
      className="group relative block rounded-2xl bg-bg-card overflow-hidden transition-all duration-300"
      style={!isPro ? { border: "1px solid rgba(255,255,255,0.06)" } : undefined}
    >
      {/* Continuous background gradient overlay */}
      <div
        className="absolute inset-x-0 top-0 h-44 pointer-events-none"
        style={{ background: gradient }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-card/40 to-bg-card" />
      </div>

      {/* Avatar & Content */}
      <div className="relative z-10 px-4 pt-4">
        <div className="h-12 w-12 rounded-full border-2 border-bg-card overflow-hidden bg-bg-card">
          {athlete.avatar_url ? (
            <Image
              src={athlete.avatar_url}
              alt={athlete.full_name ?? athlete.username ?? "Athlete"}
              width={48}
              height={48}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-accent/10 text-sm font-bold text-accent">
              {(athlete.full_name || athlete.username || "?")[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pt-2 pb-2.5">
          {/* Name row */}
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">
              {athlete.full_name || "Unnamed Athlete"}
            </h3>
            {athlete.is_verified && <VerifiedBadge />}
            {isPro && <ProBadge />}
          </div>
          {athlete.username && (
            <p className="mt-0.5 text-xs text-ink-dim">/{athlete.username}</p>
          )}

          {/* Chips */}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {athlete.sport && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-ink-muted">
                <Trophy className="h-3 w-3" />
                {athlete.sport}
              </span>
            )}
            {athlete.school && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-ink-muted">
                <MapPin className="h-3 w-3" />
                {athlete.school}
              </span>
            )}
            {athlete.position && (
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-ink-muted">
                {athlete.position}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        <div>
          {athlete.bio ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-ink-dim">{athlete.bio}</p>
          ) : (
            <p className="text-xs italic text-ink-dim/50">No bio yet</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-2 flex items-center justify-between pb-2.5">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Users className="h-3.5 w-3.5" />
            {athlete.total_followers > 0 ? (
              <span>
                <span className="font-medium text-white">{formatFollowers(athlete.total_followers)}</span>{" "}
                followers
              </span>
            ) : (
              <span className="text-ink-dim">No socials linked</span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
            View
            <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );

  const wrapped = isPro ? (
    <Tilt max={6} scale={1.01} className="rounded-2xl overflow-hidden">
      <Spotlight size={240} color="rgba(198,255,61,0.08)" className="rounded-2xl overflow-hidden">
        <BorderGlow
          edgeSensitivity={30}
          glowColor="78 100 62"
          backgroundColor="#101012"
          borderRadius={16}
          glowRadius={40}
          glowIntensity={1.0}
          coneSpread={28}
          colors={['#C6FF3D', '#a5d933', '#85b029']}
          fillOpacity={0.3}
          className="w-full h-full"
        >
          {cardContent}
        </BorderGlow>
      </Spotlight>
    </Tilt>
  ) : (
    cardContent
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      {wrapped}
    </motion.div>
  );
}

/* ── Loading skeleton card ── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-bg-card overflow-hidden">
      <div className="relative h-20 bg-white/[0.04] animate-pulse" />
      <div className="relative px-4">
        <div className="absolute -top-6 left-4 h-12 w-12 rounded-full bg-white/[0.06] animate-pulse border-2 border-bg-card" />
        <div className="pt-8 pb-3 space-y-2">
          <div className="h-3.5 w-32 rounded bg-white/[0.04] animate-pulse" />
          <div className="h-2.5 w-20 rounded bg-white/[0.04] animate-pulse" />
          <div className="flex gap-1.5 mt-2.5">
            <div className="h-5 w-16 rounded-full bg-white/[0.04] animate-pulse" />
            <div className="h-5 w-20 rounded-full bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="h-2.5 w-full rounded bg-white/[0.04] animate-pulse" />
        <div className="h-2.5 w-3/4 rounded bg-white/[0.04] animate-pulse mt-1.5" />
      </div>
      <div className="px-4 py-2.5">
        <div className="h-2.5 w-20 rounded bg-white/[0.04] animate-pulse" />
      </div>
    </div>
  );
}

/* ── Main client component ── */
export function DiscoverClient({
  initialAthletes,
  initialProAthletes,
  initialRegularAthletes,
  initialTotal,
  sports,
}: Props) {
  const [athletes, setAthletes] = useState<DiscoveryAthlete[]>(initialAthletes);
  const [proAthletes, setProAthletes] = useState<DiscoveryAthlete[]>(initialProAthletes);
  const [regularAthletes, setRegularAthletes] = useState<DiscoveryAthlete[]>(initialRegularAthletes);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [sport, setSport] = useState("");
  const [school, setSchool] = useState("");
  const [position, setPosition] = useState("");
  const [minFollowers, setMinFollowers] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageSize = 24;

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const doSearch = useCallback(
    async (p = 1, overrides?: Partial<{ query: string; sport: string; school: string; position: string; minFollowers: number }>) => {
      setLoading(true);
      setPage(p);
      const filters = {
        query: overrides?.query ?? query,
        sport: overrides?.sport ?? sport,
        school: overrides?.school ?? school,
        position: overrides?.position ?? position,
        minFollowers: overrides?.minFollowers ?? (minFollowers || undefined),
        page: p,
        pageSize,
      };
      try {
        const result = await searchPublicAthletes(filters);
        if (result.ok) {
          setAthletes(result.data ?? []);
          setProAthletes(result.proAthletes ?? []);
          setRegularAthletes(result.regularAthletes ?? []);
          setTotal(result.total ?? 0);
        }
      } catch {
        // Network error — keep existing results
      } finally {
        setLoading(false);
      }
    },
    [query, sport, school, position, minFollowers]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(1, { query: value }), 350);
  };

  const handleSportChange = (value: string) => {
    setSport(value);
    doSearch(1, { sport: value });
  };

  const handleSchoolChange = (value: string) => {
    setSchool(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(1, { school: value }), 350);
  };

  const handlePositionChange = (value: string) => {
    setPosition(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(1, { position: value }), 350);
  };

  const handleFollowersChange = (value: number) => {
    setMinFollowers(value);
    doSearch(1, { minFollowers: value || undefined });
  };

  const clearFilters = () => {
    setQuery("");
    setSport("");
    setSchool("");
    setPosition("");
    setMinFollowers(0);
    doSearch(1, { query: "", sport: "", school: "", position: "", minFollowers: undefined });
  };

  const hasActiveFilters = query || sport || school || position || minFollowers > 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  };

  // When search is active show all results (pro+regular interleaved); otherwise show only regular in grid
  const gridAthletes = hasActiveFilters ? athletes : regularAthletes;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-bg/80 backdrop-blur-xl">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="AthleteOS home">
            <Logo />
            <span className="text-[15px] font-semibold tracking-tight">AthleteOS</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/auth/sign-in"
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              Sign in
            </Link>
            <Link href="/auth/sign-up" className="btn-primary !py-2 !px-4 text-[13px]">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(198,255,61,0.08),transparent_60%)]"
          aria-hidden
        />
        <div className="container-tight py-12 sm:py-16 text-center">
          <span className="eyebrow">Athlete Discovery</span>
          <h1 className="mt-4 text-display-lg font-bold text-white">
            Find your next{" "}
            <span className="bg-gradient-to-b from-accent to-accent-deep bg-clip-text text-transparent">
              brand athlete
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-muted">
            Browse verified student-athletes across every sport. Filter by sport, school, position,
            and audience size to find the perfect partnership.
          </p>
        </div>
      </section>

      {/* Pro Spotlight strip */}
      {proAthletes.length > 0 && (
        <section className="border-b border-white/[0.06] bg-gradient-to-b from-accent/[0.04] to-transparent">
          <div className="container-tight py-8">
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Pro Athletes
              </span>
              <span className="ml-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                {proAthletes.length}
              </span>
            </div>
            <div
              className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none" }}
            >
              {proAthletes.map((athlete, i) => (
                <ProSpotlightCard key={athlete.id} athlete={athlete} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search + Filters */}
      <section className="border-b border-white/[0.06] bg-bg-elev/50">
        <div className="container-tight py-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search by name, sport, school, or username..."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white placeholder:text-ink-dim transition-colors focus:border-accent/40 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => handleQueryChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
                filtersOpen || hasActiveFilters
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-white/[0.08] bg-white/[0.03] text-ink-muted hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-bg">
                  {[query, sport, school, position, minFollowers > 0 ? "f" : ""].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-dim">Sport</label>
                    <select
                      value={sport}
                      onChange={(e) => handleSportChange(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white transition-colors focus:border-accent/40 focus:outline-none"
                    >
                      <option value="">All sports</option>
                      {sports.map((s) => (
                        <option key={s} value={s} className="bg-bg">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-dim">School</label>
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => handleSchoolChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g. Stanford"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-ink-dim transition-colors focus:border-accent/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-dim">Position</label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => handlePositionChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g. Guard"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-ink-dim transition-colors focus:border-accent/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-dim">
                      Min followers: {minFollowers > 0 ? formatFollowers(minFollowers) : "Any"}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100000}
                      step={1000}
                      value={minFollowers}
                      onChange={(e) => handleFollowersChange(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                    <div className="flex justify-between text-[10px] text-ink-dim">
                      <span>Any</span>
                      <span>100K+</span>
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="text-xs text-ink-dim transition-colors hover:text-accent"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Results */}
      <section className="container-tight py-8 sm:py-12">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            {loading ? (
              "Searching..."
            ) : (
              <>
                <span className="font-medium text-white">{total}</span> athlete{total !== 1 ? "s" : ""} found
              </>
            )}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : athletes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-[#0D0D0F] py-20 text-center">
            <Users className="mb-4 h-10 w-10 text-ink-dim" />
            <p className="text-base font-medium text-white">No athletes found</p>
            <p className="mt-1 text-sm text-ink-muted">Try adjusting your filters or search terms</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 rounded-full bg-accent/10 px-4 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gridAthletes.map((athlete, i) => (
              <AthleteCard key={athlete.id} athlete={athlete} index={i} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => doSearch(page - 1)}
              disabled={page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-ink-muted transition-colors hover:border-white/[0.16] hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => doSearch(pageNum)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors ${
                    pageNum === page
                      ? "bg-accent font-semibold text-bg"
                      : "border border-white/[0.08] text-ink-muted hover:border-white/[0.16] hover:text-white"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 7 && <span className="text-ink-dim">...</span>}
            <button
              onClick={() => doSearch(page + 1)}
              disabled={page >= totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-ink-muted transition-colors hover:border-white/[0.16] hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {/* Footer CTA */}
      <section className="border-t border-white/[0.06] bg-bg-elev/30">
        <div className="container-tight py-12 text-center">
          <h2 className="text-display-md font-bold text-white">Are you an athlete?</h2>
          <p className="mx-auto mt-3 max-w-md text-ink-muted">
            Claim your card and get discovered by brands and sponsors.
          </p>
          <Link href="/auth/sign-up" className="btn-primary mt-6 inline-flex">
            Claim your athlete card
          </Link>
        </div>
      </section>
    </div>
  );
}
