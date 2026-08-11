"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

type HistoryRow = { computed_at: string; nil_score: number; label: string };

type Props = {
  profileId: string;
  themeAccent: string;
};

export function NilScoreHistory({ themeAccent }: Props) {
  const [rows, setRows] = useState<HistoryRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("@/lib/actions/nil-engine")
      .then((m) => m.getNilScoreHistory())
      .then((res) => {
        if (!cancelled && res.ok) setRows(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0A0A0C] p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4" style={{ color: themeAccent }} />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          NIL Score Trend
        </h3>
      </div>
      {rows === null ? (
        <p className="text-[11px] text-white/40">Loading score history…</p>
      ) : rows.length < 2 ? (
        <p className="text-[11px] text-white/40 leading-relaxed">
          Your NIL assessment trend will appear here after your score has been calculated more than once.
        </p>
      ) : (
        <div className="space-y-2">
          {[...rows].reverse().map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-[11px]"
            >
              <span className="text-white/40">
                {new Date(r.computed_at).toLocaleDateString()}
              </span>
              <span className="text-white/80 font-bold">{r.nil_score}</span>
              <span className="text-white/40">{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
