"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, AlertTriangle, CheckCircle, ArrowUpRight } from "lucide-react";
import { checkDeal } from "@/lib/actions/nil-engine";

type Props = {
  plan: string;
  themeAccent: string;
};

export function NilDealChecker({ plan, themeAccent }: Props) {
  const isFree = plan === "free";
  
  const [brand, setBrand] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    verdict: "Too Low" | "Fair" | "Above Typical";
    explanation: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !deliverables.trim() || !amount) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Please enter a valid amount greater than 0");
        setLoading(false);
        return;
      }

      const res = await checkDeal(brand.trim(), deliverables.trim(), parsedAmount);
      if (res.ok && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || "Failed to check deal");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getVerdictStyles = (verdict: "Too Low" | "Fair" | "Above Typical") => {
    switch (verdict) {
      case "Too Low":
        return {
          bg: "bg-red-500/10 border-red-500/20 text-red-400",
          icon: AlertTriangle,
        };
      case "Above Typical":
        return {
          bg: "bg-green-500/10 border-green-500/20 text-green-400",
          icon: CheckCircle,
        };
      default:
        return {
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
          icon: ShieldCheck,
        };
    }
  };

  const VerdictIcon = result ? getVerdictStyles(result.verdict).icon : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111113] p-6 h-full flex flex-col justify-between min-h-[350px]">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="h-4.5 w-4.5" style={{ color: themeAccent }} />
          <h3 className="text-sm font-bold text-white/90">NIL Deal Checker</h3>
        </div>

        {isFree ? (
          <div className="flex flex-col items-center justify-center py-8 text-center h-full">
            <div className="h-12 w-12 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center mb-4">
              <Lock className="h-5 w-5 text-white/30" />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">Deal Checker is Locked</h4>
            <p className="text-[10px] text-white/40 max-w-[200px] mb-4">
              Unlock the AI Deal Checker to instantly evaluate offer parameters, contract terms, and deliverables against your market rates.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl px-4 py-2 bg-white text-black hover:bg-white/90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Upgrade to Pro
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  placeholder="Nike, Celsius, etc."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  disabled={loading}
                  required
                  maxLength={100}
                  className="w-full text-xs bg-[#16161A] border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-white/25 focus-visible:ring-2 focus-visible:ring-accent/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                  Offer Amount ($)
                </label>
                <input
                  type="number"
                  placeholder="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  required
                  min="1"
                  className="w-full text-xs bg-[#16161A] border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-white/25 focus-visible:ring-2 focus-visible:ring-accent/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                Deliverables & Scope
              </label>
              <textarea
                placeholder="e.g. 1 Instagram feed post and 2 stories including brand tag"
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
                disabled={loading}
                required
                rows={2}
                maxLength={500}
                className="w-full text-xs bg-[#16161A] border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-white/25 resize-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !brand || !deliverables || !amount}
              className="w-full flex items-center justify-center text-xs font-black uppercase tracking-wider rounded-xl py-2 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              {loading ? "Checking Offer..." : "Evaluate Deal Offer"}
            </button>
          </form>
        )}
      </div>

      {!isFree && (result || error) && (
        <div className="mt-4 pt-4 border-t border-white/[0.04]">
          {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}
          {result && VerdictIcon && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  Verdict:
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${getVerdictStyles(result.verdict).bg}`}>
                  <VerdictIcon className="h-3 w-3" />
                  {result.verdict}
                </span>
              </div>
              <p className="text-[11px] text-white/60 leading-normal bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl whitespace-pre-line">
                {result.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
