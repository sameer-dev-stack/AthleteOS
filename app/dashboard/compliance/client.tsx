"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Plus,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  DollarSign
} from "lucide-react";
import { discloseDeal, type NILDeal } from "@/lib/actions/compliance";

type Props = {
  initialDeals: NILDeal[];
  accentColor: string;
};

export function ComplianceClient({ initialDeals, accentColor }: Props) {
  const router = useRouter();
  const [deals, setDeals] = useState<NILDeal[]>(initialDeals);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "cleared" | "rejected">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [compensationType, setCompensationType] = useState("cash");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [description, setDescription] = useState("");

  const filteredDeals = deals.filter((deal) => {
    if (activeTab === "all") return true;
    return deal.status === activeTab;
  });

  // Calculate metrics
  const totalValueInCents = deals
    .filter((d) => d.status === "cleared")
    .reduce((sum, d) => sum + d.deal_value, 0);
  const totalValue = totalValueInCents / 100;
  
  const pendingCount = deals.filter((d) => d.status === "pending").length;
  const clearedCount = deals.filter((d) => d.status === "cleared").length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const val = parseFloat(dealValue);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid deal value greater than zero");
      setSubmitting(false);
      return;
    }

    const payload = {
      companyName,
      dealValue: val,
      compensationType,
      startDate,
      endDate: endDate || null,
      documentUrl: documentUrl || null,
      description,
    };

    const result = await discloseDeal(payload);

    if (result.ok && result.data) {
      setDeals((prev) => [result.data!, ...prev]);
      setIsModalOpen(false);
      resetForm();
      router.refresh();
    } else {
      setError(result.error || "Failed to submit deal disclosure");
    }
    setSubmitting(false);
  }

  function resetForm() {
    setCompanyName("");
    setDealValue("");
    setCompensationType("cash");
    setStartDate("");
    setEndDate("");
    setDocumentUrl("");
    setDescription("");
    setError(null);
  }

  function handleExportCSV() {
    if (deals.length === 0) return;

    const headers = [
      "Deal ID",
      "Company Name",
      "Value ($)",
      "Compensation Type",
      "Start Date",
      "End Date",
      "Status",
      "Description",
      "Document Link",
    ];

    const rows = deals.map((deal) => [
      deal.id,
      deal.company_name,
      (deal.deal_value / 100).toFixed(2),
      deal.compensation_type,
      deal.start_date,
      deal.end_date || "Ongoing",
      deal.status,
      deal.description || "",
      deal.document_url || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join(
        "\n"
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nilcard-nil-disclosures_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-accent" style={{ color: accentColor }} />
            NIL Compliance OS
          </h1>
          <p className="mt-1.5 text-sm text-white/40">
            Disclose contracts, monitor clearance status, and download audit logs for compliance officers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={deals.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#0D0D11] hover:bg-[#16161C] text-xs font-semibold px-4 py-2.5 text-white/80 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl text-xs font-bold px-4 py-2.5 text-bg hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] transition-all"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="h-3.5 w-3.5" />
            Disclose New Deal
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#0D0D11] p-5 border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-white/40">Cleared Value</span>
            <DollarSign className="h-4 w-4 text-accent" style={{ color: accentColor }} />
          </div>
          <p className="mt-3 text-2xl font-black text-white">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="rounded-2xl bg-[#0D0D11] p-5 border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-white/40">Pending Clearance</span>
            <Clock className="h-4 w-4 text-yellow-400" />
          </div>
          <p className="mt-3 text-2xl font-black text-white">{pendingCount}</p>
        </div>

        <div className="rounded-2xl bg-[#0D0D11] p-5 border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-white/40">Cleared Deals</span>
            <CheckCircle2 className="h-4 w-4 text-accent" style={{ color: accentColor }} />
          </div>
          <p className="mt-3 text-2xl font-black text-white">{clearedCount}</p>
        </div>
      </div>

      {/* Tabs and filters */}
      <div className="space-y-4">
        <div className="flex border-b border-white/[0.06] overflow-x-auto scrollbar-none">
          {(["all", "pending", "cleared", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all -mb-px whitespace-nowrap ${
                activeTab === tab
                  ? "border-accent text-accent"
                  : "border-transparent text-white/40 hover:text-white"
              }`}
              style={{
                borderColor: activeTab === tab ? accentColor : "transparent",
                color: activeTab === tab ? accentColor : undefined,
              }}
            >
              {tab} Disclosures
            </button>
          ))}
        </div>

        {/* Content list */}
        {filteredDeals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#0D0D0F] p-12 text-center max-w-xl mx-auto">
            <ShieldCheck className="mx-auto h-10 w-10 text-white/20" />
            <h3 className="mt-4 text-sm font-bold text-white">No deal disclosures found</h3>
            <p className="mt-2 text-xs text-white/40 leading-relaxed">
              Disclosed deals are listed here so they can be logged, audited, and cleared for compliance by your school athletic department.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDeals.map((deal) => (
              <div
                key={deal.id}
                className="rounded-2xl border border-white/[0.06] bg-[#0D0D11] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-white/[0.12]"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-white">{deal.company_name}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        deal.status === "cleared"
                          ? "bg-accent/15 text-accent"
                          : deal.status === "pending"
                          ? "bg-yellow-400/10 text-yellow-400"
                          : "bg-red-400/10 text-red-400"
                      }`}
                      style={{
                        backgroundColor: deal.status === "cleared" ? `${accentColor}15` : undefined,
                        color: deal.status === "cleared" ? accentColor : undefined,
                      }}
                    >
                      {deal.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/45">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {(deal.deal_value / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="capitalize">{deal.compensation_type}</span>
                    <span className="text-white/20">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {deal.start_date} {deal.end_date ? `to ${deal.end_date}` : "(Ongoing)"}
                    </span>
                  </div>
                  {deal.description && (
                    <p className="text-xs text-white/30 max-w-2xl mt-1 leading-relaxed">{deal.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                  {deal.document_url && (deal.document_url as string).startsWith("http") && (
                    <a
                      href={deal.document_url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-[11px] font-semibold px-3 py-1.5 text-white/70 hover:text-white transition-colors"
                    >
                      View Agreement
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclose Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0D0D11] p-6 shadow-2xl z-10 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Disclose NIL Deal</h3>
            <p className="text-xs text-white/40 mb-5">
              Submit your deal contract details. All entries are recorded in the system audit logs.
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#16161A] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none transition-colors"
                  placeholder="e.g. Nike, Local Cafe"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
                    Deal Value (USD $) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    max={100000000}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#16161A] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none transition-colors"
                    placeholder="e.g. 1500.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
                    Compensation Type *
                  </label>
                  <select
                    value={compensationType}
                    onChange={(e) => setCompensationType(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#16161A] px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none transition-colors"
                  >
                    <option value="cash">Cash</option>
                    <option value="product">Product / Gear</option>
                    <option value="equity">Equity</option>
                    <option value="licensing">Royalties / Licensing</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#16161A] px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#16161A] px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
                  Document / Contract Link (Optional)
                </label>
                <input
                  type="url"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  maxLength={500}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#16161A] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none transition-colors"
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
                  Description / Deliverables (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#16161A] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-accent focus:outline-none transition-colors resize-none"
                  placeholder="e.g. 2 Instagram posts and 1 clinic appearance"
                />
                <p className="mt-1 text-right text-[10px] text-white/30">{description.length}/500</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-xs font-bold px-4 py-2.5 text-white/70 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl text-xs font-bold px-4 py-2.5 text-bg hover:opacity-90 disabled:opacity-40 transition-colors flex items-center gap-2"
                  style={{ backgroundColor: accentColor }}
                >
                  {submitting ? "Submitting..." : "Submit Disclosure"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
