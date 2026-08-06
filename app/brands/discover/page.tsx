"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, Bookmark, BookmarkCheck } from "lucide-react";
import { searchAthletes, saveAthlete, getSavedAthletes, removeSavedAthlete } from "@/lib/actions/brand";

type Athlete = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  sport: string | null;
  school: string | null;
  bio: string | null;
  is_verified: boolean;
};

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      try {
        await Promise.all([loadAthletes(), loadSaved()]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, []);

  async function loadAthletes(p = 1, q?: string) {
    setLoading(true);
    setPage(p);
    try {
      const result = await searchAthletes(q || undefined, undefined, undefined, p, 20);
      if (result.ok && result.data) {
        setAthletes(result.data as Athlete[]);
        setTotal(result.total ?? 0);
      }
    } catch { /* keep existing results */ }
    setLoading(false);
  }

  async function loadSaved() {
    try {
      const result = await getSavedAthletes(1, 100);
      if (result.ok && result.data) {
        const ids = new Set(result.data.map((s: Record<string, unknown>) => (s.athlete_id as string) || ((s.profiles as Record<string, unknown>)?.id as string)));
        setSavedIds(ids);
      }
    } catch { /* keep existing results */ }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadAthletes(1, query.trim() || undefined);
  }

  async function handleSave(athleteId: string) {
    const wasSaved = savedIds.has(athleteId);
    try {
      if (wasSaved) {
        await removeSavedAthlete(athleteId);
        setSavedIds((prev) => { const next = new Set(prev); next.delete(athleteId); return next; });
      } else {
        await saveAthlete(athleteId);
        setSavedIds((prev) => new Set(prev).add(athleteId));
      }
    } catch {
      if (wasSaved) {
        setSavedIds((prev) => new Set(prev).add(athleteId));
      } else {
        setSavedIds((prev) => { const next = new Set(prev); next.delete(athleteId); return next; });
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="container-tight py-12">
        <h1 className="text-display-md font-bold text-white">Discover Athletes</h1>
        <p className="mt-2 text-ink-muted">Find athletes for your campaigns and partnerships</p>

        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, sport, or school..." className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none" />
          </div>
          <button type="submit" className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-bg">Search</button>
        </form>

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-xl border border-white/[0.06] bg-[#0D0D0F] animate-pulse" />)}
            </div>
          ) : athletes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#0D0D0F] p-12 text-center">
              <p className="text-sm text-ink-muted">No athletes found</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {athletes.map((a) => (
                <div key={a.id} className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                        {a.avatar_url ? <Image src={a.avatar_url} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" /> : (a.full_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{a.full_name || "Unnamed"}</p>
                        {a.username && <p className="text-xs text-ink-dim">/{a.username}</p>}
                      </div>
                    </div>
                    <button onClick={() => handleSave(a.id)} className={`rounded-lg p-2 transition-colors ${savedIds.has(a.id) ? "text-accent" : "text-ink-dim hover:text-white"}`}>
                      {savedIds.has(a.id) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {a.sport && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-ink-muted">{a.sport}</span>}
                    {a.school && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-ink-muted">{a.school}</span>}
                    {a.is_verified && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#111115]" style={{ backgroundColor: "#FACC15" }}>Verified</span>}
                  </div>
                  {a.bio && <p className="mt-2 line-clamp-2 text-xs text-ink-dim">{a.bio}</p>}
                  {a.username && (
                    <a href={`/${a.username}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-accent hover:underline">
                      View profile
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {total > 20 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button onClick={() => loadAthletes(Math.max(1, page - 1), query.trim() || undefined)} disabled={page === 1} className="rounded-lg px-4 py-2 text-sm text-ink-muted hover:text-white disabled:opacity-30">Previous</button>
            <span className="text-sm text-ink-dim">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => loadAthletes(page + 1, query.trim() || undefined)} disabled={page * 20 >= total} className="rounded-lg px-4 py-2 text-sm text-ink-muted hover:text-white disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
