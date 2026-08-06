"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Check,
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

type Props = {
  initialAthletes: DiscoveryAthlete[];
  initialTotal: number;
  sports: string[];
};

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function DiscoverClient({ initialAthletes, initialTotal, sports }: Props) {
  const [athletes, setAthletes] = useState<DiscoveryAthlete[]>(initialAthletes);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state
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
          setTotal(result.total ?? 0);
        }
      } catch {
        // Network error - keep existing results
      } finally {
        setLoading(false);
      }
    },
    [query, sport, school, position, minFollowers]
  );

  // Debounced text search
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

  // Listen for Enter key on school/position inputs
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  };

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

      {/* Athlete Spotlight */}
      {athletes.length > 0 && (
        <section className="border-b border-white/[0.06] bg-gradient-to-b from-accent/[0.03] to-transparent">
          <div className="container-tight py-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Featured Athlete</span>
            </div>
            <Link
              href={`/${athletes[0].username}`}
              className="group flex items-center gap-4 rounded-2xl border border-accent/20 bg-accent/[0.03] p-4 transition-all hover:border-accent/40 hover:bg-accent/[0.06]"
            >
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-accent/20">
                {athletes[0].avatar_url ? (
                  <Image src={athletes[0].avatar_url} alt="" unoptimized width={56} height={56} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-accent/10 text-lg font-bold text-accent">
                    {(athletes[0].full_name || athletes[0].username || "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {athletes[0].full_name || "Unnamed Athlete"}
                  </h3>
                  {athletes[0].is_verified && (
                    <span className="flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: "#FACC15" }}>
                      <Check className="h-2.5 w-2.5 text-[#111115]" strokeWidth={3} />
                    </span>
                  )}
                  {athletes[0].plan !== "free" && (
                    <span className="flex-shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
                      {athletes[0].plan}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-dim mt-0.5">
                  {[athletes[0].sport, athletes[0].school].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                View
                <ExternalLink className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Search + Filters */}
      <section className="border-b border-white/[0.06] bg-bg-elev/50">
        <div className="container-tight py-5">
          {/* Search bar */}
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

          {/* Filter panel */}
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
                  {/* Sport dropdown */}
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

                  {/* School input */}
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

                  {/* Position input */}
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

                  {/* Min followers slider */}
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
        {/* Results header */}
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

        {/* Card grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl border border-white/[0.06] bg-[#0D0D0F] animate-pulse"
              />
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
            {athletes.map((athlete, i) => (
              <AthleteCard key={athlete.id} athlete={athlete} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
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
          <h2 className="text-display-md font-bold text-white">
            Are you an athlete?
          </h2>
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

// ---------------------------------------------------------------------------
// Athlete Card
// ---------------------------------------------------------------------------

function AthleteCard({ athlete, index }: { athlete: DiscoveryAthlete; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/${athlete.username}`}
        className="group block rounded-2xl border border-white/[0.06] bg-[#111113] transition-all duration-300 hover:border-accent/20 hover:shadow-[0_0_40px_-12px_rgba(198,255,61,0.15)]"
      >
        {/* Avatar + badges */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-b from-white/[0.03] to-transparent p-5 pb-3">
          <div className="flex items-start gap-3.5">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.06]">
              {athlete.avatar_url ? (
                <Image
                  src={athlete.avatar_url}
                  alt={athlete.full_name ?? athlete.username ?? "Athlete"}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-accent/60">
                  {(athlete.full_name || athlete.username || "?")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-sm font-semibold text-white">
                  {athlete.full_name || "Unnamed Athlete"}
                </h3>
                {athlete.is_verified && (
                  <span className="flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: "#FACC15" }}>
                    <Check className="h-2.5 w-2.5 text-[#111115]" strokeWidth={3} />
                  </span>
                )}
                {athlete.plan !== "free" && (
                  <span className="flex-shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent">
                    {athlete.plan}
                  </span>
                )}
              </div>
              {athlete.username && (
                <p className="mt-0.5 text-xs text-ink-dim">/{athlete.username}</p>
              )}
            </div>
          </div>

          {/* Sport / School / Position */}
          <div className="mt-3 flex flex-wrap gap-1.5">
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
        <div className="px-5">
          {athlete.bio ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-ink-dim">{athlete.bio}</p>
          ) : (
            <p className="text-xs italic text-ink-dim/50">No bio yet</p>
          )}
        </div>

        {/* Footer: followers + CTA */}
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] px-5 py-3">
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
            View card
            <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
