"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { createTeam } from "@/lib/actions/teams";

export default function TeamSetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [sport, setSport] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const result = await createTeam(name.trim(), school.trim() || undefined, sport.trim() || undefined);
    setSaving(false);
    if (result.ok) {
      router.push(`/teams/${(result.data as Record<string, unknown>)?.id}`);
    } else {
      setError(result.error || "Failed to create team");
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="container-tight py-20">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Users className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-display-md font-bold text-white">Create your team</h1>
            <p className="mt-2 text-sm text-ink-muted">Set up your team for bulk athlete onboarding</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-muted">Team name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Stanford Basketball" maxLength={100} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-muted">School</label>
              <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Stanford University" maxLength={100} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-muted">Sport</label>
              <input type="text" value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Basketball" maxLength={50} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none" />
            </div>
            <button type="submit" disabled={saving || !name.trim()} className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Create Team"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
