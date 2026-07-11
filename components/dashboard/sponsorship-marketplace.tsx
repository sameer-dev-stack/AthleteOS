"use client";

import { useState, useMemo, useCallback } from "react";
import type { Profile } from "@/lib/actions/profile";
import {
  Search,
  Filter,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Megaphone,
  Star,
  Target,
  Zap,
  TrendingUp,
  Send,
  Heart,
  Bookmark,
  MessageSquare,
  Handshake,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Briefcase,
  AlertCircle,
  Mail,
  Phone,
  ExternalLink,
  BarChart3,
  Sparkles,
  Eye,
} from "lucide-react";

type SponsorshipType = "brand-deal" | "endorsement" | "ambassador" | "content" | "event";

type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "shortlisted"
  | "accepted"
  | "rejected"
  | "withdrawn";

type NegotiationStatus = "not-started" | "initial-offer" | "counter-offer" | "finalizing" | "agreed";

type Opportunity = {
  id: string;
  brand: string;
  logo: string;
  title: string;
  type: SponsorshipType;
  valueMin: number;
  valueMax: number;
  deadline: string;
  requirements: string[];
  description: string;
  tags: string[];
  urgent: boolean;
};

type Application = {
  opportunityId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  notes: string;
};

type Negotiation = {
  opportunityId: string;
  status: NegotiationStatus;
  brandOffer: number;
  yourCounter: number | null;
  finalValue: number | null;
  messages: { sender: "brand" | "athlete"; text: string; at: string }[];
};

type OutreachRecord = {
  brand: string;
  logo: string;
  contactedAt: string;
  method: "email" | "dm" | "form" | "referral";
  status: "sent" | "responded" | "meeting-booked" | "no-reply";
  notes: string;
};

type ViewTab = "browse" | "applications" | "recommended" | "saved" | "outreach" | "negotiations";

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp_001",
    brand: "Gatorade",
    logo: "G",
    title: "Season-long hydration partnership",
    type: "ambassador",
    valueMin: 5000,
    valueMax: 15000,
    deadline: "2026-07-31",
    requirements: ["5K+ followers", "D1/D2 athlete", "Monthly content"],
    description:
      "Represent Gatorade as a campus ambassador. Create 4 social posts per month featuring product integration during training and game days.",
    tags: ["Beverages", "Sports Nutrition", "Long-term"],
    urgent: false,
  },
  {
    id: "opp_002",
    brand: "Nike",
    logo: "N",
    title: "Back-to-school campaign",
    type: "brand-deal",
    valueMin: 3000,
    valueMax: 8000,
    deadline: "2026-07-20",
    requirements: ["10K+ followers", "Instagram + TikTok", "Original content"],
    description:
      "Feature Nike training gear in a back-to-school content series. 3 Instagram posts + 2 TikToks over 4 weeks.",
    tags: ["Apparel", "Short-term", "Content"],
    urgent: true,
  },
  {
    id: "opp_003",
    brand: "Alumni Association",
    logo: "A",
    title: "Game day experience post",
    type: "content",
    valueMin: 500,
    valueMax: 1500,
    deadline: "2026-08-15",
    requirements: ["Any follower count", "College athlete"],
    description:
      "Share your authentic game day experience in a single Instagram carousel. Highlight campus life and school spirit.",
    tags: ["Campus", "One-off", "Easy"],
    urgent: false,
  },
  {
    id: "opp_004",
    brand: "Beats by Dre",
    logo: "B",
    title: "Pre-game playlist endorsement",
    type: "endorsement",
    valueMin: 2000,
    valueMax: 5000,
    deadline: "2026-08-01",
    requirements: ["3K+ followers", "Story + Reel", "Authentic use"],
    description:
      "Showcase your pre-game music ritual with Beats products. 1 Instagram Story series + 1 Reel featuring the product.",
    tags: ["Audio", "Lifestyle", "Short-term"],
    urgent: false,
  },
  {
    id: "opp_005",
    brand: "Local Car Dealership",
    logo: "L",
    title: "Community appearance deal",
    type: "event",
    valueMin: 1000,
    valueMax: 3000,
    deadline: "2026-07-25",
    requirements: ["Local athlete", "2-hour commitment"],
    description:
      "Make a 2-hour appearance at a local dealership grand reopening. Sign autographs, take photos, and represent your program.",
    tags: ["Local", "In-person", "One-off"],
    urgent: true,
  },
  {
    id: "opp_006",
    brand: "Under Armour",
    logo: "U",
    title: "Training montage series",
    type: "content",
    valueMin: 4000,
    valueMax: 10000,
    deadline: "2026-08-10",
    requirements: ["8K+ followers", "Video content", "Training focus"],
    description:
      "Create a 6-part training montage series for UA's #TrainAnywhere campaign. Weekly video posts across Instagram and TikTok.",
    tags: ["Apparel", "Video", "Long-term"],
    urgent: false,
  },
  {
    id: "opp_007",
    brand: "Campus Protein",
    logo: "C",
    title: "Supplement testimonial",
    type: "endorsement",
    valueMin: 800,
    valueMax: 2500,
    deadline: "2026-08-20",
    requirements: ["Any follower count", "Honest review"],
    description:
      "Try Campus Protein supplements for 30 days and share an honest testimonial post. No follower minimum required.",
    tags: ["Nutrition", "Easy", "Beginner-friendly"],
    urgent: false,
  },
  {
    id: "opp_008",
    brand: "State Farm",
    logo: "S",
    title: "Student-athlete safety campaign",
    type: "ambassador",
    valueMin: 3000,
    valueMax: 7000,
    deadline: "2026-09-01",
    requirements: ["5K+ followers", "Positive image", "6-month commitment"],
    description:
      "Partner with State Farm to promote financial literacy and safety awareness among student-athletes. Quarterly content drops.",
    tags: ["Finance", "Long-term", "Cause-driven"],
    urgent: false,
  },
];

const MOCK_OUTREACH: OutreachRecord[] = [
  {
    brand: "Powerade",
    logo: "P",
    contactedAt: "2026-06-15",
    method: "email",
    status: "responded",
    notes: "Replied asking for media kit",
  },
  {
    brand: "Local Gym Chain",
    logo: "G",
    contactedAt: "2026-06-20",
    method: "dm",
    status: "meeting-booked",
    notes: "Call scheduled for June 25",
  },
  {
    brand: "Protein Bar Co",
    logo: "PB",
    contactedAt: "2026-06-28",
    method: "form",
    status: "sent",
    notes: "Applied via website form",
  },
  {
    brand: "Sports Medicine Clinic",
    logo: "SM",
    contactedAt: "2026-06-10",
    method: "referral",
    status: "no-reply",
    notes: "Referred by teammate, no response yet",
  },
];

const MOCK_NEGOTIATIONS: Negotiation[] = [
  {
    opportunityId: "opp_001",
    status: "counter-offer",
    brandOffer: 5000,
    yourCounter: 8000,
    finalValue: null,
    messages: [
      { sender: "brand", text: "We'd like to offer $5,000 for the season partnership.", at: "2026-07-01T10:00:00Z" },
      { sender: "athlete", text: "Based on my engagement rate and audience, I believe $8,000 is more appropriate.", at: "2026-07-02T14:30:00Z" },
    ],
  },
  {
    opportunityId: "opp_006",
    status: "initial-offer",
    brandOffer: 4000,
    yourCounter: null,
    finalValue: null,
    messages: [
      { sender: "brand", text: "Starting offer for the 6-part series: $4,000.", at: "2026-07-03T09:00:00Z" },
    ],
  },
];

const MOCK_APPLICATIONS: Application[] = [
  {
    opportunityId: "opp_002",
    status: "reviewing",
    appliedAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-03T12:00:00Z",
    notes: "Submitted portfolio link",
  },
  {
    opportunityId: "opp_005",
    status: "accepted",
    appliedAt: "2026-06-28T10:00:00Z",
    updatedAt: "2026-07-02T16:00:00Z",
    notes: "Confirmed appearance, signed contract",
  },
  {
    opportunityId: "opp_003",
    status: "shortlisted",
    appliedAt: "2026-07-02T09:00:00Z",
    updatedAt: "2026-07-04T11:00:00Z",
    notes: "Brand shortlisted 10 candidates",
  },
  {
    opportunityId: "opp_007",
    status: "rejected",
    appliedAt: "2026-06-25T14:00:00Z",
    updatedAt: "2026-06-30T10:00:00Z",
    notes: "Chose another athlete",
  },
];

const TYPE_LABELS: Record<SponsorshipType, string> = {
  "brand-deal": "Brand Deal",
  endorsement: "Endorsement",
  ambassador: "Ambassador",
  content: "Content",
  event: "Event",
};

const TYPE_ICONS: Record<SponsorshipType, typeof Megaphone> = {
  "brand-deal": Megaphone,
  endorsement: Star,
  ambassador: Target,
  content: Zap,
  event: CheckCircle2,
};

const TYPE_COLORS: Record<SponsorshipType, string> = {
  "brand-deal": "#C6FF3D",
  endorsement: "#A78BFA",
  ambassador: "#38BDF8",
  content: "#FB923C",
  event: "#34D399",
};

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#FBBF24", bg: "#FBBF2410" },
  reviewing: { label: "Reviewing", color: "#60A5FA", bg: "#60A5FA10" },
  shortlisted: { label: "Shortlisted", color: "#A78BFA", bg: "#A78BFA10" },
  accepted: { label: "Accepted", color: "#34D399", bg: "#34D39910" },
  rejected: { label: "Rejected", color: "#F87171", bg: "#F8717110" },
  withdrawn: { label: "Withdrawn", color: "#9CA3AF", bg: "#9CA3AF10" },
};

const NEGOTIATION_STATUS_CONFIG: Record<NegotiationStatus, { label: string; color: string }> = {
  "not-started": { label: "Not started", color: "#9CA3AF" },
  "initial-offer": { label: "Initial offer", color: "#FBBF24" },
  "counter-offer": { label: "Counter-offer", color: "#60A5FA" },
  finalizing: { label: "Finalizing", color: "#A78BFA" },
  agreed: { label: "Agreed", color: "#34D399" },
};

const OUTREACH_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  sent: { label: "Sent", color: "#FBBF24" },
  responded: { label: "Responded", color: "#60A5FA" },
  "meeting-booked": { label: "Meeting booked", color: "#34D399" },
  "no-reply": { label: "No reply", color: "#F87171" },
};

function computeRelevance(opp: Opportunity, profile: Profile): number {
  let score = 0;
  const sport = profile.sport?.toLowerCase() || "";
  const tags = opp.tags.map((t) => t.toLowerCase());
  const reqs = opp.requirements.map((r) => r.toLowerCase());

  if (sport && (tags.some((t) => t.includes(sport)) || opp.description.toLowerCase().includes(sport))) score += 30;
  if (reqs.some((r) => r.includes("follower"))) score += 15;
  if (opp.urgent) score += 10;
  if (opp.type === "ambassador" || opp.type === "endorsement") score += 10;
  if (opp.valueMax >= 5000) score += 10;
  if (tags.some((t) => t.includes("beginner"))) score += 5;

  return Math.min(score, 100);
}

type Props = {
  profile: Profile;
};

export function SponsorshipMarketplace({ profile }: Props) {
  const accentColor = profile.theme_accent || "#C6FF3D";

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SponsorshipType | "all">("all");
  const [activeTab, setActiveTab] = useState<ViewTab>("browse");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [negotiations, setNegotiations] = useState<Negotiation[]>(MOCK_NEGOTIATIONS);
  const [outreach] = useState<OutreachRecord[]>(MOCK_OUTREACH);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [negotiationText, setNegotiationText] = useState("");

  const filtered = useMemo(() => {
    return MOCK_OPPORTUNITIES.filter((opp) => {
      if (typeFilter !== "all" && opp.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          opp.brand.toLowerCase().includes(q) ||
          opp.title.toLowerCase().includes(q) ||
          opp.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [search, typeFilter]);

  const recommended = useMemo(() => {
    return [...MOCK_OPPORTUNITIES]
      .map((opp) => ({ opp, score: computeRelevance(opp, profile) }))
      .filter(({ score }) => score > 20)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.opp);
  }, [profile]);

  const savedOpportunities = useMemo(() => {
    return MOCK_OPPORTUNITIES.filter((opp) => savedIds.has(opp.id));
  }, [savedIds]);

  const applicationMap = useMemo(() => {
    const map: Record<string, Application> = {};
    for (const app of applications) map[app.opportunityId] = app;
    return map;
  }, [applications]);

  const toggleSave = useCallback((e: React.MouseEvent, oppId: string) => {
    e.stopPropagation();
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(oppId)) next.delete(oppId);
      else next.add(oppId);
      return next;
    });
  }, []);

  const handleApply = useCallback(
    (oppId: string) => {
      if (applicationMap[oppId]) return;
      setApplyingTo(oppId);
      setTimeout(() => {
        const now = new Date().toISOString();
        setApplications((prev) => [
          ...prev,
          { opportunityId: oppId, status: "pending", appliedAt: now, updatedAt: now, notes: "" },
        ]);
        setApplyingTo(null);
        setSelectedOpp(null);
      }, 600);
    },
    [applicationMap]
  );

  const handleDecline = useCallback(
    (oppId: string) => {
      if (applicationMap[oppId]) return;
      const now = new Date().toISOString();
      setApplications((prev) => [
        ...prev,
        { opportunityId: oppId, status: "withdrawn", appliedAt: now, updatedAt: now, notes: "Passed by athlete" },
      ]);
      setSelectedOpp(null);
    },
    [applicationMap]
  );

  function formatValue(min: number, max: number) {
    const fmt = (n: number) =>
      n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `$${n}`;
    if (min === max) return fmt(min);
    return `${fmt(min)} - ${fmt(max)}`;
  }

  function daysUntil(dateStr: string) {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const TABS: { id: ViewTab; label: string; icon: typeof Target; count?: number }[] = [
    { id: "browse", label: "Browse", icon: Target, count: filtered.length },
    { id: "recommended", label: "For You", icon: Sparkles, count: recommended.length },
    { id: "applications", label: "Applications", icon: Briefcase, count: applications.length },
    { id: "saved", label: "Saved", icon: Bookmark, count: savedIds.size },
    { id: "negotiations", label: "Deals", icon: Handshake, count: negotiations.length },
    { id: "outreach", label: "Outreach", icon: Mail, count: outreach.length },
  ];

  const activeNegotiation = selectedOpp ? negotiations.find((n) => n.opportunityId === selectedOpp.id) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Marketplace</h1>
        <p className="mt-1 text-sm text-white/40">
          Browse sponsorship opportunities from top brands
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-[#0A0A0B]"
                  : "bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.06]"
              }`}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id
                      ? "bg-[#0A0A0B]/10 text-[#0A0A0B]/60"
                      : "bg-white/[0.06] text-white/25"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Applied",
            value: applications.filter((a) => a.status !== "withdrawn").length,
            icon: Send,
          },
          {
            label: "Shortlisted",
            value: applications.filter((a) => a.status === "shortlisted" || a.status === "accepted").length,
            icon: Star,
          },
          {
            label: "In Negotiation",
            value: negotiations.filter((n) => n.status !== "not-started" && n.status !== "agreed").length,
            icon: Handshake,
          },
          {
            label: "Saved",
            value: savedIds.size,
            icon: Bookmark,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.06] bg-[#111113] p-4 transition-colors hover:border-white/[0.1]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-3.5 w-3.5 text-white/30" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-white/30">
                  {stat.label}
                </span>
              </div>
              <p className="text-xl font-black text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Search + Filters — only on browse/recommended */}
      {(activeTab === "browse" || activeTab === "recommended") && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brands, opportunities, tags..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#111113] border border-white/[0.06] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-white/25 mr-1" />
            {(
              ["all", "brand-deal", "endorsement", "ambassador", "content", "event"] as const
            ).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`h-8 px-3 rounded-lg text-[11px] font-bold transition-all ${
                  typeFilter === f
                    ? "bg-accent text-[#0A0A0B]"
                    : "bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.06]"
                }`}
              >
                {f === "all" ? "All" : TYPE_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BROWSE TAB */}
      {activeTab === "browse" && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-12 text-center">
              <Search className="h-8 w-8 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/40">No opportunities match your filters</p>
            </div>
          ) : (
            filtered.map((opp) => {
              const app = applicationMap[opp.id];
              const days = daysUntil(opp.deadline);
              const TypeIcon = TYPE_ICONS[opp.type];
              const typeColor = TYPE_COLORS[opp.type];
              const isApplying = applyingTo === opp.id;
              const isSaved = savedIds.has(opp.id);

              return (
                <div
                  key={opp.id}
                  onClick={() => setSelectedOpp(opp)}
                  className="group rounded-xl border bg-[#111113] p-5 transition-all border-white/[0.06] hover:border-white/[0.12] cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                        style={{
                          backgroundColor: `${typeColor}12`,
                          color: typeColor,
                          border: `1px solid ${typeColor}20`,
                        }}
                      >
                        {opp.logo}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{opp.title}</h3>
                          {opp.urgent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#C6FF3D]/10 text-[#C6FF3D] uppercase tracking-wider">
                              Urgent
                            </span>
                          )}
                          {app && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                              style={{
                                backgroundColor: STATUS_CONFIG[app.status].bg,
                                color: STATUS_CONFIG[app.status].color,
                              }}
                            >
                              {STATUS_CONFIG[app.status].label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/35 mt-0.5">{opp.brand}</p>

                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{
                              backgroundColor: `${typeColor}10`,
                              color: typeColor,
                            }}
                          >
                            <TypeIcon className="h-2.5 w-2.5" />
                            {TYPE_LABELS[opp.type]}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-white/40">
                            <DollarSign className="h-2.5 w-2.5" />
                            {formatValue(opp.valueMin, opp.valueMax)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] ${
                              days <= 7 ? "text-red-400" : "text-white/40"
                            }`}
                          >
                            <Clock className="h-2.5 w-2.5" />
                            {days <= 0 ? "Expired" : `${days}d left`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          {opp.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-white/[0.04] text-white/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => toggleSave(e, opp.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: isSaved ? `${accentColor}15` : "rgba(255,255,255,0.04)",
                          color: isSaved ? accentColor : "rgba(255,255,255,0.3)",
                        }}
                      >
                        <Bookmark className="h-3.5 w-3.5" fill={isSaved ? accentColor : "none"} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOpp(opp);
                        }}
                        disabled={isApplying}
                        className="h-8 px-4 rounded-lg text-[10px] font-bold bg-accent text-[#0A0A0B] hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isApplying ? (
                          <div className="h-3 w-3 rounded-full border-2 border-[#0A0A0B]/30 border-t-[#0A0A0B] animate-spin" />
                        ) : (
                          <>
                            <ArrowUpRight className="h-3 w-3" />
                            View
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* RECOMMENDED TAB */}
      {activeTab === "recommended" && (
        <div className="space-y-3">
          {recommended.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-12 text-center">
              <Sparkles className="h-8 w-8 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/40">Complete your profile for personalized recommendations</p>
            </div>
          ) : (
            recommended.map((opp) => {
              const relevance = computeRelevance(opp, profile);
              const days = daysUntil(opp.deadline);
              const TypeIcon = TYPE_ICONS[opp.type];
              const typeColor = TYPE_COLORS[opp.type];
              const isSaved = savedIds.has(opp.id);
              const app = applicationMap[opp.id];

              return (
                <div
                  key={opp.id}
                  onClick={() => setSelectedOpp(opp)}
                  className="group rounded-xl border bg-[#111113] p-5 transition-all border-white/[0.06] hover:border-white/[0.12] cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black relative"
                        style={{
                          backgroundColor: `${typeColor}12`,
                          color: typeColor,
                          border: `1px solid ${typeColor}20`,
                        }}
                      >
                        {opp.logo}
                        <div
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-black"
                          style={{ backgroundColor: accentColor, color: "#0A0A0B" }}
                        >
                          {relevance}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{opp.title}</h3>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#C6FF3D]/10 text-[#C6FF3D] uppercase tracking-wider">
                            {relevance >= 60 ? "Great match" : "Good match"}
                          </span>
                          {app && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                              style={{
                                backgroundColor: STATUS_CONFIG[app.status].bg,
                                color: STATUS_CONFIG[app.status].color,
                              }}
                            >
                              {STATUS_CONFIG[app.status].label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/35 mt-0.5">{opp.brand}</p>

                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{ backgroundColor: `${typeColor}10`, color: typeColor }}
                          >
                            <TypeIcon className="h-2.5 w-2.5" />
                            {TYPE_LABELS[opp.type]}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-white/40">
                            <DollarSign className="h-2.5 w-2.5" />
                            {formatValue(opp.valueMin, opp.valueMax)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] ${
                              days <= 7 ? "text-red-400" : "text-white/40"
                            }`}
                          >
                            <Clock className="h-2.5 w-2.5" />
                            {days <= 0 ? "Expired" : `${days}d left`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          {opp.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-white/[0.04] text-white/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => toggleSave(e, opp.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: isSaved ? `${accentColor}15` : "rgba(255,255,255,0.04)",
                          color: isSaved ? accentColor : "rgba(255,255,255,0.3)",
                        }}
                      >
                        <Bookmark className="h-3.5 w-3.5" fill={isSaved ? accentColor : "none"} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOpp(opp);
                        }}
                        className="h-8 px-4 rounded-lg text-[10px] font-bold bg-accent text-[#0A0A0B] hover:brightness-110 transition-all flex items-center gap-1.5"
                      >
                        <ArrowUpRight className="h-3 w-3" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-12 text-center">
              <Briefcase className="h-8 w-8 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/40">No applications yet. Browse opportunities to get started.</p>
            </div>
          ) : (
            <>
              {/* Pipeline view */}
              <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
                <h4 className="text-[10px] uppercase tracking-wider font-bold text-white/30 mb-3">
                  Application Pipeline
                </h4>
                <div className="flex items-center gap-2">
                  {(["pending", "reviewing", "shortlisted", "accepted"] as const).map((status, i) => {
                    const count = applications.filter((a) => a.status === status).length;
                    const cfg = STATUS_CONFIG[status];
                    return (
                      <div key={status} className="flex items-center gap-2 flex-1">
                        <div className="flex-1 text-center">
                          <div
                            className="h-1.5 rounded-full mb-1.5 transition-all"
                            style={{
                              backgroundColor: count > 0 ? cfg.color : "rgba(255,255,255,0.06)",
                              opacity: count > 0 ? 1 : 0.3,
                            }}
                          />
                          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                            {cfg.label}
                          </p>
                          <p className="text-sm font-black text-white mt-0.5">{count}</p>
                        </div>
                        {i < 3 && <ArrowRight className="h-3 w-3 text-white/15 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Application cards */}
              {applications.map((app) => {
                const opp = MOCK_OPPORTUNITIES.find((o) => o.id === app.opportunityId);
                if (!opp) return null;
                const cfg = STATUS_CONFIG[app.status];
                const TypeIcon = TYPE_ICONS[opp.type];
                const typeColor = TYPE_COLORS[opp.type];

                return (
                  <div
                    key={app.opportunityId}
                    className="rounded-xl border border-white/[0.06] bg-[#111113] p-5 transition-all hover:border-white/[0.12] cursor-pointer"
                    onClick={() => {
                      setSelectedOpp(opp);
                      setSelectedApp(app);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div
                          className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                          style={{
                            backgroundColor: `${typeColor}12`,
                            color: typeColor,
                            border: `1px solid ${typeColor}20`,
                          }}
                        >
                          {opp.logo}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-white">{opp.title}</h3>
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                              style={{ backgroundColor: cfg.bg, color: cfg.color }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-white/35 mt-0.5">{opp.brand}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                              style={{ backgroundColor: `${typeColor}10`, color: typeColor }}
                            >
                              <TypeIcon className="h-2.5 w-2.5" />
                              {TYPE_LABELS[opp.type]}
                            </span>
                            <span className="text-[10px] text-white/40">
                              Applied {formatDate(app.appliedAt)}
                            </span>
                            <span className="text-[10px] text-white/40">
                              Updated {formatDate(app.updatedAt)}
                            </span>
                          </div>
                          {app.notes && (
                            <p className="text-[10px] text-white/25 mt-1.5 italic">{app.notes}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/20 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* SAVED TAB */}
      {activeTab === "saved" && (
        <div className="space-y-3">
          {savedOpportunities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-12 text-center">
              <Bookmark className="h-8 w-8 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/40">No saved opportunities yet</p>
            </div>
          ) : (
            savedOpportunities.map((opp) => {
              const days = daysUntil(opp.deadline);
              const TypeIcon = TYPE_ICONS[opp.type];
              const typeColor = TYPE_COLORS[opp.type];
              const app = applicationMap[opp.id];

              return (
                <div
                  key={opp.id}
                  onClick={() => setSelectedOpp(opp)}
                  className="group rounded-xl border bg-[#111113] p-5 transition-all border-white/[0.06] hover:border-white/[0.12] cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                        style={{
                          backgroundColor: `${typeColor}12`,
                          color: typeColor,
                          border: `1px solid ${typeColor}20`,
                        }}
                      >
                        {opp.logo}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{opp.title}</h3>
                          {app && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                              style={{
                                backgroundColor: STATUS_CONFIG[app.status].bg,
                                color: STATUS_CONFIG[app.status].color,
                              }}
                            >
                              {STATUS_CONFIG[app.status].label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/35 mt-0.5">{opp.brand}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold"
                            style={{ backgroundColor: `${typeColor}10`, color: typeColor }}
                          >
                            <TypeIcon className="h-2.5 w-2.5" />
                            {TYPE_LABELS[opp.type]}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-white/40">
                            <DollarSign className="h-2.5 w-2.5" />
                            {formatValue(opp.valueMin, opp.valueMax)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] ${
                              days <= 7 ? "text-red-400" : "text-white/40"
                            }`}
                          >
                            <Clock className="h-2.5 w-2.5" />
                            {days <= 0 ? "Expired" : `${days}d left`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => toggleSave(e, opp.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                      >
                        <Bookmark className="h-3.5 w-3.5" fill={accentColor} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* NEGOTIATIONS TAB */}
      {activeTab === "negotiations" && (
        <div className="space-y-4">
          {negotiations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-12 text-center">
              <Handshake className="h-8 w-8 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/40">No active negotiations</p>
            </div>
          ) : (
            negotiations.map((neg) => {
              const opp = MOCK_OPPORTUNITIES.find((o) => o.id === neg.opportunityId);
              if (!opp) return null;
              const negCfg = NEGOTIATION_STATUS_CONFIG[neg.status];
              const typeColor = TYPE_COLORS[opp.type];

              return (
                <div
                  key={neg.opportunityId}
                  className="rounded-xl border border-white/[0.06] bg-[#111113] p-5 space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                        style={{
                          backgroundColor: `${typeColor}12`,
                          color: typeColor,
                          border: `1px solid ${typeColor}20`,
                        }}
                      >
                        {opp.logo}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white">{opp.title}</h3>
                        <p className="text-xs text-white/35 mt-0.5">{opp.brand}</p>
                      </div>
                    </div>
                    <span
                      className="px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{ backgroundColor: `${negCfg.color}15`, color: negCfg.color }}
                    >
                      {negCfg.label}
                    </span>
                  </div>

                  {/* Value breakdown */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                      <DollarSign className="h-4 w-4 text-white/30 mx-auto mb-1" />
                      <p className="text-sm font-bold text-white">${neg.brandOffer.toLocaleString()}</p>
                      <p className="text-[9px] text-white/25 uppercase tracking-wider mt-0.5">Brand offer</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                      <TrendingUp className="h-4 w-4 text-white/30 mx-auto mb-1" />
                      <p className="text-sm font-bold text-white">
                        {neg.yourCounter ? `$${neg.yourCounter.toLocaleString()}` : "--"}
                      </p>
                      <p className="text-[9px] text-white/25 uppercase tracking-wider mt-0.5">Your ask</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                      <CheckCircle2 className="h-4 w-4 text-white/30 mx-auto mb-1" />
                      <p className="text-sm font-bold text-white">
                        {neg.finalValue ? `$${neg.finalValue.toLocaleString()}` : "--"}
                      </p>
                      <p className="text-[9px] text-white/25 uppercase tracking-wider mt-0.5">Final</p>
                    </div>
                  </div>

                  {/* Messages */}
                  {neg.messages.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase tracking-wider font-bold text-white/30">
                        Message history
                      </h4>
                      {neg.messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.sender === "athlete" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                              msg.sender === "athlete"
                                ? "bg-accent/10 text-accent"
                                : "bg-white/[0.04] text-white/50"
                            }`}
                          >
                            <p>{msg.text}</p>
                            <p className="text-[9px] opacity-40 mt-1">{formatDate(msg.at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input (for active negotiations) */}
                  {neg.status !== "agreed" && neg.status !== "not-started" && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={negotiationText}
                        onChange={(e) => setNegotiationText(e.target.value)}
                        placeholder="Type a reply..."
                        className="flex-1 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/[0.15] transition-colors"
                      />
                      <button
                        className="h-9 px-3 rounded-lg bg-accent text-[#0A0A0B] text-[10px] font-bold hover:brightness-110 transition-all flex items-center gap-1"
                        onClick={() => {
                          if (!negotiationText.trim()) return;
                          setNegotiations((prev) =>
                            prev.map((n) =>
                              n.opportunityId === neg.opportunityId
                                ? {
                                    ...n,
                                    messages: [
                                      ...n.messages,
                                      { sender: "athlete" as const, text: negotiationText, at: new Date().toISOString() },
                                    ],
                                  }
                                : n
                            )
                          );
                          setNegotiationText("");
                        }}
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* OUTREACH TAB */}
      {activeTab === "outreach" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-white/30 mb-3">
              Outreach Funnel
            </h4>
            <div className="flex items-center gap-2">
              {(["sent", "responded", "meeting-booked"] as const).map((status, i) => {
                const count = outreach.filter((o) => o.status === status).length;
                const cfg = OUTREACH_STATUS_CONFIG[status];
                return (
                  <div key={status} className="flex items-center gap-2 flex-1">
                    <div className="flex-1 text-center">
                      <div
                        className="h-1.5 rounded-full mb-1.5"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                        {cfg.label}
                      </p>
                      <p className="text-sm font-black text-white mt-0.5">{count}</p>
                    </div>
                    {i < 2 && <ArrowRight className="h-3 w-3 text-white/15 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {outreach.map((record, i) => {
            const cfg = OUTREACH_STATUS_CONFIG[record.status];
            return (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-[#111113] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black bg-white/[0.04] text-white/30">
                      {record.logo}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{record.brand}</h3>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] text-white/40">
                          <Mail className="h-2.5 w-2.5" />
                          {record.method.charAt(0).toUpperCase() + record.method.slice(1)}
                        </span>
                        <span className="text-[10px] text-white/40">{formatDate(record.contactedAt)}</span>
                      </div>
                      {record.notes && (
                        <p className="text-[10px] text-white/30 mt-1.5 italic">{record.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setSelectedOpp(null);
              setSelectedApp(null);
            }}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#111113] border border-white/[0.08] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => {
                setSelectedOpp(null);
                setSelectedApp(null);
              }}
              className="absolute top-4 right-4 h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <XCircle className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4">
              <div
                className="h-14 w-14 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
                style={{
                  backgroundColor: `${TYPE_COLORS[selectedOpp.type]}12`,
                  color: TYPE_COLORS[selectedOpp.type],
                  border: `1px solid ${TYPE_COLORS[selectedOpp.type]}20`,
                }}
              >
                {selectedOpp.logo}
              </div>
              <div>
                <h2 className="text-lg font-black text-white">{selectedOpp.brand}</h2>
                <p className="text-xs text-white/40">{selectedOpp.title}</p>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                <DollarSign className="h-4 w-4 text-white/30 mx-auto mb-1" />
                <p className="text-sm font-bold text-white">
                  {formatValue(selectedOpp.valueMin, selectedOpp.valueMax)}
                </p>
                <p className="text-[9px] text-white/25 uppercase tracking-wider mt-0.5">Value</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                <Clock className="h-4 w-4 text-white/30 mx-auto mb-1" />
                <p className="text-sm font-bold text-white">
                  {daysUntil(selectedOpp.deadline)}d
                </p>
                <p className="text-[9px] text-white/25 uppercase tracking-wider mt-0.5">Deadline</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                <TrendingUp className="h-4 w-4 text-white/30 mx-auto mb-1" />
                <p className="text-sm font-bold text-white">{TYPE_LABELS[selectedOpp.type]}</p>
                <p className="text-[9px] text-white/25 uppercase tracking-wider mt-0.5">Type</p>
              </div>
            </div>

            {/* Relevance score (for recommended items) */}
            {activeTab === "recommended" && (
              <div
                className="flex items-center gap-3 rounded-lg p-3"
                style={{ backgroundColor: `${accentColor}08`, border: `1px solid ${accentColor}15` }}
              >
                <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: accentColor }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: accentColor }}>
                    Match score: {computeRelevance(selectedOpp, profile)}%
                  </p>
                  <p className="text-[10px] text-white/30">
                    Based on your sport, audience size, and profile completeness
                  </p>
                </div>
              </div>
            )}

            {/* Application status (if applied) */}
            {selectedApp && (
              <div className="rounded-lg border border-white/[0.05] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-white/30">
                    Application Status
                  </h4>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: STATUS_CONFIG[selectedApp.status].bg,
                      color: STATUS_CONFIG[selectedApp.status].color,
                    }}
                  >
                    {STATUS_CONFIG[selectedApp.status].label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] text-white/25 uppercase tracking-wider">Applied</p>
                    <p className="text-xs text-white/50">{formatDate(selectedApp.appliedAt)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/25 uppercase tracking-wider">Last update</p>
                    <p className="text-xs text-white/50">{formatDate(selectedApp.updatedAt)}</p>
                  </div>
                </div>
                {selectedApp.notes && (
                  <div>
                    <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-xs text-white/40 italic">{selectedApp.notes}</p>
                  </div>
                )}

                {/* Status timeline */}
                <div className="pt-2">
                  <div className="flex items-center gap-1">
                    {(["pending", "reviewing", "shortlisted", "accepted"] as const).map((s, i) => {
                      const cfg = STATUS_CONFIG[s];
                      const isActive = selectedApp.status === s;
                      const isPast =
                        (["pending", "reviewing", "shortlisted", "accepted"] as const).indexOf(selectedApp.status as "pending" | "reviewing" | "shortlisted" | "accepted") > i;
                      return (
                        <div key={s} className="flex items-center gap-1 flex-1">
                          <div
                            className="h-1.5 flex-1 rounded-full"
                            style={{
                              backgroundColor: isActive || isPast ? cfg.color : "rgba(255,255,255,0.06)",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Negotiation section */}
            {activeNegotiation && activeNegotiation.status !== "not-started" && (
              <div className="rounded-lg border border-white/[0.05] p-4 space-y-3">
                <h4 className="text-[10px] uppercase tracking-wider font-bold text-white/30">
                  Deal Negotiation
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-black text-white">${activeNegotiation.brandOffer.toLocaleString()}</p>
                    <p className="text-[9px] text-white/25">Offered</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">
                      {activeNegotiation.yourCounter ? `$${activeNegotiation.yourCounter.toLocaleString()}` : "--"}
                    </p>
                    <p className="text-[9px] text-white/25">Your ask</p>
                  </div>
                  <div>
                    <p className="text-lg font-black" style={{ color: accentColor }}>
                      {activeNegotiation.finalValue ? `$${activeNegotiation.finalValue.toLocaleString()}` : "--"}
                    </p>
                    <p className="text-[9px] text-white/25">Final</p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider font-bold text-white/30 mb-2">
                About this opportunity
              </h4>
              <p className="text-sm text-white/60 leading-relaxed">{selectedOpp.description}</p>
            </div>

            {/* Requirements */}
            <div>
              <h4 className="text-[10px] uppercase tracking-wider font-bold text-white/30 mb-2">
                Requirements
              </h4>
              <div className="space-y-1.5">
                {selectedOpp.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-accent/60 flex-shrink-0" />
                    <span className="text-xs text-white/50">{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {(() => {
              const app = applicationMap[selectedOpp.id];
              if (app) {
                return (
                  <div className="space-y-3">
                    <div
                      className="flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-bold"
                      style={{
                        backgroundColor:
                          app.status === "accepted"
                            ? "#34D39910"
                            : app.status === "rejected" || app.status === "withdrawn"
                            ? "rgba(255,255,255,0.04)"
                            : `${accentColor}10`,
                        color:
                          app.status === "accepted"
                            ? "#34D399"
                            : app.status === "rejected" || app.status === "withdrawn"
                            ? "rgba(255,255,255,0.4)"
                            : accentColor,
                      }}
                    >
                      {app.status === "accepted" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Application accepted
                        </>
                      ) : app.status === "rejected" ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          Application not selected
                        </>
                      ) : app.status === "withdrawn" ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          You passed on this opportunity
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Application {STATUS_CONFIG[app.status].label.toLowerCase()}
                        </>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDecline(selectedOpp.id)}
                    className="flex-1 h-11 rounded-xl text-xs font-bold bg-white/[0.04] text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Pass
                  </button>
                  <button
                    onClick={() => handleApply(selectedOpp.id)}
                    disabled={applyingTo === selectedOpp.id}
                    className="flex-1 h-11 rounded-xl text-xs font-bold bg-accent text-[#0A0A0B] hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {applyingTo === selectedOpp.id ? (
                      <div className="h-4 w-4 rounded-full border-2 border-[#0A0A0B]/30 border-t-[#0A0A0B] animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Express Interest
                      </>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
