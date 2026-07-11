"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2 } from "lucide-react";
import { createBrandAccount } from "@/lib/actions/brand";

export default function BrandSetupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;
    setSaving(true);
    setError(null);
    const result = await createBrandAccount(
      companyName.trim(),
      industry.trim() || undefined,
      website.trim() || undefined,
      description.trim() || undefined
    );
    setSaving(false);
    if (result.ok) {
      router.push("/brands/dashboard");
    } else {
      setError(result.error || "Failed to create brand account");
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="container-tight py-20">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-display-md font-bold text-white">Set up your brand</h1>
            <p className="mt-2 text-sm text-ink-muted">Tell us about your company to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-muted">Company name *</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Sports" maxLength={100} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-muted">Industry</label>
              <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Sports, Fitness, Fashion..." maxLength={100} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-muted">Website</label>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." maxLength={500} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-muted">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does your brand do?" rows={3} maxLength={500} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none resize-none" />
            </div>
            <button type="submit" disabled={saving || !companyName.trim()} className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Create Brand Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
