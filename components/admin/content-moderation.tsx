"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, CheckCircle, Flag, AlertTriangle } from "lucide-react";
import { getProfilesForReview, moderateProfile } from "@/lib/actions/admin";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  sport: string | null;
  bio: string | null;
  moderation_status: string;
};

export function ContentModeration() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles(1);
  }, []);

  async function loadProfiles(p: number) {
    setLoading(true);
    setPage(p);
    const result = await getProfilesForReview(p, 20);
    if (result.ok && result.data) {
      setProfiles(result.data.profiles as Profile[]);
      setTotal(result.data.total);
    }
    setLoading(false);
  }

  async function handleModerate(userId: string, action: "approve" | "flag") {
    setActionFeedback(null);
    const result = await moderateProfile(userId, action);
    if (result.ok) {
      setProfiles((prev) => prev.filter((p) => p.id !== userId));
      setTotal((prev) => prev - 1);
      setActionFeedback(action === "approve" ? "Profile approved" : "Profile flagged");
      setTimeout(() => setActionFeedback(null), 2000);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-white/[0.06] bg-[#0D0D0F] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actionFeedback && (
        <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
          {actionFeedback}
        </div>
      )}

      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-sm font-medium text-white">Profiles for Review ({total})</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-start gap-4 px-6 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
                {p.avatar_url ? (
                  <Image src={p.avatar_url} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  (p.full_name || p.email)[0].toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{p.full_name || p.email}</p>
                  {p.username && <span className="text-xs text-ink-dim">/@{p.username}</span>}
                  {p.sport && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-ink-muted">{p.sport}</span>}
                </div>
                {p.bio && (
                  <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{p.bio}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    p.moderation_status === "flagged" ? "bg-red-500/15 text-red-400" :
                    p.moderation_status === "pending" ? "bg-yellow-500/15 text-yellow-400" :
                    "bg-white/[0.06] text-ink-muted"
                  }`}>
                    {p.moderation_status || "unreviewed"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleModerate(p.id, "approve")}
                  className="flex items-center gap-1 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20"
                >
                  <CheckCircle className="h-3 w-3" />
                  Approve
                </button>
                <button
                  onClick={() => handleModerate(p.id, "flag")}
                  className="flex items-center gap-1 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-400 transition-colors hover:bg-yellow-500/20"
                >
                  <Flag className="h-3 w-3" />
                  Flag
                </button>
              </div>
            </div>
          ))}
          {profiles.length === 0 && (
            <div className="px-6 py-12 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-ink-dim" />
              <p className="mt-2 text-sm text-ink-muted">All profiles look good</p>
              <p className="text-xs text-ink-dim">No profiles pending review</p>
            </div>
          )}
        </div>
        {total > 20 && (
          <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3">
            <button onClick={() => loadProfiles(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg px-3 py-1.5 text-xs text-ink-muted hover:text-white disabled:opacity-30">Previous</button>
            <span className="text-xs text-ink-dim">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => loadProfiles(page + 1)} disabled={page * 20 >= total} className="rounded-lg px-3 py-1.5 text-xs text-ink-muted hover:text-white disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
