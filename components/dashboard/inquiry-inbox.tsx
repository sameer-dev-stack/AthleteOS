"use client";

import { useEffect, useState } from "react";
import { Mail, Check, ChevronDown, ChevronUp, DollarSign, TrendingUp, Heart, Briefcase, Award } from "lucide-react";
import { getAthleteInquiries, updateInquiryStatus } from "@/lib/actions/inquiries";
import { getTipEarnings, type TipEarnings } from "@/lib/actions/tips";
import { BusinessProfilePanel } from "@/components/dashboard/business-profile-panel";
import { Skeleton } from "@/components/ui/skeleton";

export type PipelineStatus = "new" | "replied" | "negotiating" | "won" | "lost";

const PIPELINE_STATUSES: { key: PipelineStatus; label: string; color: string }[] = [
  { key: "new", label: "New", color: "bg-accent/15 text-accent border-accent/30" },
  { key: "replied", label: "Replied", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { key: "negotiating", label: "Negotiating", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { key: "won", label: "Won", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { key: "lost", label: "Lost", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
];

type Inquiry = {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_company: string | null;
  inquiry_type: string;
  message: string;
  status: PipelineStatus;
  deal_value: number | null;
  created_at: string;
};

type ItemType = "inquiry" | "tip";

type CombinedItem = {
  id: string;
  type: ItemType;
  title: string;
  subtitle: string | null;
  amount: number | null; // dollars
  status: PipelineStatus | "succeeded";
  rawInquiry?: Inquiry;
  createdAt: string;
};

export function InquiryInbox() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [tips, setTips] = useState<TipEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [dealValueInput, setDealValueInput] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAthleteInquiries(1, 50),
      getTipEarnings().catch(() => null),
    ]).then(([inquiriesRes, tipsRes]) => {
      if (cancelled) return;
      if (inquiriesRes.ok && inquiriesRes.data) {
        setInquiries(inquiriesRes.data as Inquiry[]);
      }
      if (tipsRes && tipsRes.ok && tipsRes.data) {
        setTips(tipsRes.data);
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  async function handleStatusChange(id: string, newStatus: PipelineStatus, value?: number | null) {
    const valToSave = value !== undefined ? value : (inquiries.find(i => i.id === id)?.deal_value ?? null);
    const result = await updateInquiryStatus(id, newStatus, valToSave);
    if (result.ok) {
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: newStatus, deal_value: valToSave } : i));
    }
  }

  async function handleSaveDealValue(id: string) {
    const num = parseFloat(dealValueInput);
    const val = isNaN(num) || num < 0 ? null : num;
    const item = inquiries.find(i => i.id === id);
    if (!item) return;

    const result = await updateInquiryStatus(id, item.status, val);
    if (result.ok) {
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, deal_value: val } : i));
      setEditingValueId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 space-y-4">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-[#0A0A0D] p-4 flex items-center justify-between">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculations for Earnings Ledger
  const totalTipsDollars = tips ? tips.totalEarned / 100 : 0;
  const totalWonDealsDollars = inquiries
    .filter(i => i.status === "won" && i.deal_value && i.deal_value > 0)
    .reduce((sum, i) => sum + (i.deal_value || 0), 0);
  const grandTotalLedger = totalTipsDollars + totalWonDealsDollars;

  const newInquiriesCount = inquiries.filter(i => i.status === "new").length;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] transition-colors hover:border-white/[0.1] overflow-hidden">
      {/* Header & Earnings Ledger Readout */}
      <div className="border-b border-white/[0.06] px-6 py-5 bg-[#0D0D11]/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
              <Briefcase className="h-4 w-4 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Deal Room & Business Inbox</h3>
                {newInquiriesCount > 0 && (
                  <span className="rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-bold text-accent">
                    {newInquiriesCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40 mt-0.5">Manage brand inquiries, deal stages, and fan tips in one place</p>
            </div>
          </div>

          {/* Ledger Readout */}
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Total Business Revenue</p>
              <p className="text-base font-black text-accent tracking-tight">${grandTotalLedger.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="h-6 w-px bg-white/[0.08]" />
            <div className="text-[10px] text-white/50 space-y-0.5">
              <p>Deals Won: <span className="font-semibold text-white">${totalWonDealsDollars.toLocaleString()}</span></p>
              <p>Tips: <span className="font-semibold text-white">${totalTipsDollars.toFixed(2)}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Profile Panel & Main Stream */}
      <div className="p-6">
        <BusinessProfilePanel />

        {inquiries.length === 0 ? (
          <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
            <Mail className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm font-bold text-white">Your Deal Room is Empty</p>
          <p className="mt-1 text-xs text-white/40 max-w-sm mx-auto">
            Share your athlete card link to start receiving sponsorship inquiries, booking requests, and direct fan tips.
          </p>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Check out my athlete card", url: window.location.origin });
              } else {
                navigator.clipboard.writeText(window.location.origin);
              }
            }}
            className="mt-5 rounded-xl bg-accent/15 border border-accent/30 px-5 py-2.5 text-xs font-semibold text-accent transition-all hover:bg-accent/25"
          >
            Share Athlete Card
          </button>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {inquiries.map((inquiry) => {
            const isExpanded = expandedId === inquiry.id;
            const currentStatusObj = PIPELINE_STATUSES.find(s => s.key === inquiry.status) || PIPELINE_STATUSES[0];

            return (
              <div key={inquiry.id} className="p-5 transition-colors hover:bg-white/[0.01]">
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {inquiry.status === "new" ? (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_8px_rgba(198,255,61,0.6)]" />
                    ) : (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-white/20" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-white truncate">{inquiry.sender_name}</p>
                        {inquiry.sender_company && (
                          <span className="text-xs font-semibold text-white/40">({inquiry.sender_company})</span>
                        )}
                        <span className="rounded-md bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-white/60 uppercase tracking-wider">
                          {inquiry.inquiry_type}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 truncate mt-1">{inquiry.message}</p>
                    </div>
                  </div>

                  {/* Status Dropdown / Controls */}
                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {inquiry.deal_value !== null && inquiry.deal_value !== undefined && inquiry.deal_value > 0 && (
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                        ${inquiry.deal_value.toLocaleString()}
                      </span>
                    )}

                    <select
                      value={inquiry.status}
                      onChange={(e) => handleStatusChange(inquiry.id, e.target.value as PipelineStatus)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer transition-colors ${currentStatusObj.color}`}
                      style={{ backgroundColor: "#111115" }}
                    >
                      {PIPELINE_STATUSES.map((s) => (
                        <option key={s.key} value={s.key} className="bg-[#111115] text-white">
                          {s.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                      className="p-1 text-white/30 hover:text-white transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 border-t border-white/[0.06] pt-4 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Sender Contact</p>
                      <p className="text-xs text-accent mt-0.5">{inquiry.sender_email}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Full Inquiry Message</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/80 whitespace-pre-wrap bg-[#0A0A0D] border border-white/[0.05] p-3.5 rounded-xl">
                        {inquiry.message}
                      </p>
                    </div>

                    {/* Deal Value Editor */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        {editingValueId === inquiry.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/50">$</span>
                            <input
                              type="number"
                              value={dealValueInput}
                              onChange={(e) => setDealValueInput(e.target.value)}
                              placeholder="e.g. 500"
                              className="w-24 rounded-lg bg-[#0A0A0D] border border-white/10 px-2.5 py-1 text-xs text-white outline-none focus:border-accent"
                            />
                            <button
                              onClick={() => handleSaveDealValue(inquiry.id)}
                              className="rounded-lg bg-accent px-3 py-1 text-xs font-bold text-bg hover:brightness-110"
                            >
                              Save Value
                            </button>
                            <button
                              onClick={() => setEditingValueId(null)}
                              className="text-xs text-white/40 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingValueId(inquiry.id);
                              setDealValueInput(inquiry.deal_value ? String(inquiry.deal_value) : "");
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-accent transition-colors"
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            {inquiry.deal_value ? `Deal Value: $${inquiry.deal_value.toLocaleString()} (edit)` : "Add Deal Value ($)"}
                          </button>
                        )}
                      </div>

                      <a
                        href={`mailto:${inquiry.sender_email}?subject=Re: ${encodeURIComponent(inquiry.inquiry_type)} inquiry&body=Hi ${encodeURIComponent(inquiry.sender_name)},%0A%0A`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-accent/15 border border-accent/30 px-4 py-2 text-xs font-bold text-accent transition-colors hover:bg-accent/25"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        Reply via Email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
