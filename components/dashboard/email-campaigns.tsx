"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Plus,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Eye,
  MousePointerClick,
  FileText,
} from "lucide-react";
import {
  getCampaigns,
  sendCampaign,
  getCampaignStats,
  createCampaign,
  type Campaign,
  type CampaignStats,
} from "@/lib/actions/campaigns";
import { EmptyState } from "./empty-state";

type Props = {
  athleteId: string;
};

export function EmailCampaigns({ athleteId }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [campaignResult, statsResult] = await Promise.all([
      getCampaigns(),
      getCampaignStats(),
    ]);
    if (campaignResult.ok && campaignResult.data) setCampaigns(campaignResult.data);
    if (statsResult.ok && statsResult.data) setStats(statsResult.data);
    setLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => loadData());
  }, []);

  const handleSend = async (id: string) => {
    setSending(id);
    const result = await sendCampaign(id);
    if (result.ok) await loadData();
    setSending(null);
  };

  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
    draft: { icon: FileText, color: "text-white/50", label: "Draft" },
    scheduled: { icon: Clock, color: "text-[#C6FF3D]", label: "Scheduled" },
    sent: { icon: CheckCircle2, color: "text-green-400", label: "Sent" },
    failed: { icon: AlertCircle, color: "text-red-400", label: "Failed" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Email Campaigns</h2>
          <p className="text-xs text-white/40 mt-1">Send targeted emails to your fan subscribers.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <Plus className="h-3.5 w-3.5" />
          New Campaign
        </button>
      </div>

      {showForm && (
        <CampaignForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            loadData();
          }}
        />
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Mail}
            label="Total Campaigns"
            value={stats.totalCampaigns}
          />
          <StatCard
            icon={Send}
            label="Emails Sent"
            value={stats.totalSent}
          />
          <StatCard
            icon={Eye}
            label="Avg Open Rate"
            value={`${stats.avgOpenRate}%`}
          />
          <StatCard
            icon={MousePointerClick}
            label="Avg Click Rate"
            value={`${stats.avgClickRate}%`}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-white/[0.03] animate-pulse"
            />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No campaigns yet"
          description="Create your first email campaign to reach your fan subscribers."
        />
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => {
            const cfg = statusConfig[campaign.status] || statusConfig.draft;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusIcon className={`h-4 w-4 flex-shrink-0 ${cfg.color}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {campaign.name}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      {campaign.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="hidden md:flex items-center gap-4 text-xs text-white/40">
                    <span>{campaign.recipient_count} recipients</span>
                    {campaign.status === "sent" && (
                      <>
                        <span>{campaign.sent_count} sent</span>
                        <span>{campaign.open_count} opens</span>
                      </>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {(campaign.status === "draft" || campaign.status === "scheduled") && (
                    <button
                      onClick={() => handleSend(campaign.id)}
                      disabled={sending === campaign.id}
                      className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-all duration-200 hover:bg-accent/20 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                      <Send className="h-3 w-3" />
                      {sending === campaign.id ? "Sending..." : "Send"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-white/40" />
        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}

function CampaignForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createCampaign(name, subject, body, recipientCount);
    if (result.ok) {
      onCreated();
    } else {
      setError(result.error || "Failed to create campaign");
    }
    setSubmitting(false);
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0D0D0F] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">New Campaign</h3>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring Q&A"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/30"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Ask me anything!"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/30"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1">
            Email Body (HTML)
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="<h1 style='color:#FFFFFF;'>Your heading</h1><p style='color:#88888A;'>Your message here.</p>"
            rows={6}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/30 resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1">
              Recipient Count
            </label>
            <input
              type="number"
              value={recipientCount}
              onChange={(e) => setRecipientCount(Number(e.target.value))}
              min={1}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/30"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-accent px-4 py-2 text-xs font-bold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {submitting ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </form>
    </div>
  );
}
