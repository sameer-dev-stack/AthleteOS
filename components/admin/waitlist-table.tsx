"use client";

import { useState, useEffect } from "react";
import { getWaitlistEntries, exportWaitlistCsv } from "@/lib/actions/admin";
import type { WaitlistEntry } from "@/lib/actions/admin";

export function WaitlistTable() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const result = await getWaitlistEntries();
      if (result.ok && result.data) {
        setEntries(result.data);
      } else {
        setError(result.error || "Failed to load entries");
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = entries.filter((e) =>
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = async () => {
    const result = await exportWaitlistCsv();
    if (result.ok && result.data) {
      const blob = new Blob([result.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `athleteos-waitlist-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-ink-muted">Loading waitlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-[#1A1A1C] px-4 py-2.5 text-sm text-white placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#1A1A1C] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#222224] transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/[0.06]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] bg-[#1A1A1C]">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                Confirmed
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-ink-muted"
                >
                  {search
                    ? "No entries match your search"
                    : "No waitlist entries yet"}
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#1A1A1C]/50">
                  <td className="px-4 py-3 text-sm text-white">{entry.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-ink-muted">
                      {entry.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.confirmed ? (
                      <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                        Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-ink-muted">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {new Date(entry.joined_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-ink-muted">
        Showing {filtered.length} of {entries.length} entries
      </div>
    </div>
  );
}
