"use client";

import { useEffect, useState } from "react";
import { Bookmark, Megaphone, Building2 } from "lucide-react";
import { getSavedAthletes, getCampaignBriefs, getBrandAccount } from "@/lib/actions/brand";
import Link from "next/link";

export default function BrandDashboardPage() {
  const [brand, setBrand] = useState<Record<string, unknown> | null>(null);
  const [saved, setSaved] = useState<Record<string, unknown>[]>([]);
  const [briefs, setBriefs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"saved" | "campaigns" | "profile">("saved");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [brandResult, savedResult, briefsResult] = await Promise.all([
          getBrandAccount(),
          getSavedAthletes(1, 50),
          getCampaignBriefs(1, 50),
        ]);
        if (cancelled) return;
        if (brandResult.ok && brandResult.data) setBrand(brandResult.data);
        if (savedResult.ok && savedResult.data) setSaved(savedResult.data);
        if (briefsResult.ok && briefsResult.data) setBriefs(briefsResult.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-bg"><div className="container-tight py-12"><div className="h-96 rounded-xl border border-white/[0.06] bg-[#0D0D0F] animate-pulse" /></div></div>;
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="container-tight py-20 text-center">
          <Building2 className="mx-auto h-12 w-12 text-ink-dim" />
          <h1 className="mt-4 text-xl font-bold text-white">No brand account</h1>
          <p className="mt-2 text-sm text-ink-muted">Create a brand account to get started</p>
          <Link href="/brands/setup" className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-bg">Create Brand Account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="container-tight py-12">
        <h1 className="text-2xl font-bold text-white">{brand.company_name as string}</h1>
        <p className="text-sm text-ink-muted">{brand.industry as string || "Brand"}</p>

        <div className="mt-6 flex gap-4">
          <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-4 text-center">
            <Bookmark className="mx-auto h-5 w-5 text-accent" />
            <p className="mt-1 text-2xl font-bold text-white">{saved.length}</p>
            <p className="text-xs text-ink-dim">Saved Athletes</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-4 text-center">
            <Megaphone className="mx-auto h-5 w-5 text-accent" />
            <p className="mt-1 text-2xl font-bold text-white">{briefs.length}</p>
            <p className="text-xs text-ink-dim">Campaigns</p>
          </div>
        </div>

        <div className="mt-8 flex gap-1 border-b border-white/[0.06]">
          {(["saved", "campaigns", "profile"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t ? "border-b-2 border-accent text-accent" : "text-ink-muted hover:text-white"}`}>
              {t === "saved" ? "Saved Athletes" : t === "campaigns" ? "Campaigns" : "Brand Profile"}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "saved" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((s) => {
                const p = s.profiles as Record<string, unknown> | null;
                return (
                  <div key={s.id as string} className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
                    <p className="text-sm font-medium text-white">{(p?.full_name as string) || "Unnamed"}</p>
                    {p?.username ? <p className="text-xs text-ink-dim">/{p.username as string}</p> : null}
                    {p?.sport ? <span className="mt-2 inline-block rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-ink-muted">{p.sport as string}</span> : null}
                  </div>
                );
              })}
              {saved.length === 0 && <p className="text-sm text-ink-dim">No saved athletes yet</p>}
            </div>
          )}

          {tab === "campaigns" && (
            <div className="space-y-3">
              {briefs.map((b) => (
                <div key={b.id as string} className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{b.title as string}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${(b.status as string) === "open" ? "bg-green-500/15 text-green-400" : "bg-white/[0.06] text-ink-muted"}`}>
                      {b.status as string}
                    </span>
                  </div>
                  {b.description ? <p className="mt-1 line-clamp-2 text-xs text-ink-dim">{b.description as string}</p> : null}
                </div>
              ))}
              {briefs.length === 0 && <p className="text-sm text-ink-dim">No campaigns yet</p>}
            </div>
          )}

          {tab === "profile" && (
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6">
              <p className="text-sm text-ink-muted">Company: <span className="text-white">{brand.company_name as string}</span></p>
              {brand.industry ? <p className="mt-2 text-sm text-ink-muted">Industry: <span className="text-white">{brand.industry as string}</span></p> : null}
              {brand.website ? <p className="mt-2 text-sm text-ink-muted">Website: <a href={(brand.website as string).startsWith("http") ? (brand.website as string) : `https://${brand.website}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{brand.website as string}</a></p> : null}
              {brand.description ? <p className="mt-2 text-sm text-ink-muted">{brand.description as string}</p> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
