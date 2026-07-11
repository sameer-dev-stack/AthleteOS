"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Users, Loader2 } from "lucide-react";
import { createTier, getTiers, deleteTier } from "@/lib/actions/memberships";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

type Tier = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_active: boolean;
  created_at: string;
};

type Props = { athleteId: string };

export function MembershipTiers({ athleteId }: Props) {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTiers(athleteId).then((result) => {
      if (cancelled) return;
      if (result.ok && result.data) setTiers(result.data as Tier[]);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [athleteId]);

  async function reloadTiers() {
    const result = await getTiers(athleteId);
    if (result.ok && result.data) setTiers(result.data as Tier[]);
  }

  async function handleCreate() {
    if (!name.trim() || !price) return;
    const parsed = parseFloat(price);
    if (isNaN(parsed) || parsed <= 0) return;
    setSaving(true);
    setError(null);
    const priceCents = Math.round(parsed * 100);
    const result = await createTier(athleteId, name.trim(), description.trim() || undefined, priceCents);
    setSaving(false);
    if (result.ok) {
      setName("");
      setDescription("");
      setPrice("");
      setShowForm(false);
      reloadTiers();
    } else {
      setError(result.error || "Failed to create tier");
    }
  }

  async function handleDelete(tierId: string) {
    const result = await deleteTier(tierId);
    if (result.ok) reloadTiers();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-[#0D0D0F] p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-14 rounded" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tiers.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#0D0D0F] p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-ink-dim" />
          <p className="mt-2 text-sm text-ink-muted">No membership tiers yet</p>
          <p className="mt-1 text-xs text-ink-dim">Create tiers to let fans support you monthly</p>
          <button onClick={() => setShowForm(true)} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
            Create your first tier
          </button>
        </div>
      )}

      {tiers.map((tier) => (
        <div key={tier.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0D0D0F] p-4">
          <div>
            <p className="text-sm font-medium text-white">{tier.name}</p>
            {tier.description && <p className="mt-0.5 text-xs text-ink-dim">{tier.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-accent">${(tier.price_cents / 100).toFixed(0)}/mo</span>
            <button onClick={() => handleDelete(tier.id)} className="rounded-lg border border-white/[0.06] p-2 text-ink-dim hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {showForm && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0D0D0F] p-4 space-y-3">
          {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tier name (e.g., Gold)" maxLength={50} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What supporters get" maxLength={500} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-muted">$</span>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="9.99" min="1" step="0.01" className="w-32 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" />
            <span className="text-xs text-ink-dim">/month</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving || !name.trim() || !price} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40 transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-ink-muted hover:text-white hover:bg-white/[0.04] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">Cancel</button>
          </div>
        </div>
      )}

      {!showForm && tiers.length > 0 && (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
          <Plus className="h-3.5 w-3.5" /> Add tier
        </button>
      )}
    </div>
  );
}
