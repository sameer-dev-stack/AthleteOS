"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Logo } from "@/components/logo";
import {
  ChevronUp,
  Lightbulb,
  MessageSquare,
  Send,
  Sparkles,
  Zap,
  Users,
  BarChart3,
  Shield,
  Globe,
  Smartphone,
} from "lucide-react";
import { motion } from "framer-motion";

type Feature = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  votes: number;
  status: "planned" | "in-progress" | "shipped";
};

const INITIAL_FEATURES: Omit<Feature, "votes">[] = [
  {
    id: "mobile-app",
    title: "Native Mobile App",
    description: "iOS and Android app with push notifications for tips, inquiries, and fan activity.",
    category: "Platform",
    icon: Smartphone,
    status: "planned",
  },
  {
    id: "team-analytics",
    title: "Team Analytics Dashboard",
    description: "Schools and collectives can view aggregated performance across all roster athletes.",
    category: "Analytics",
    icon: BarChart3,
    status: "planned",
  },
  {
    id: "ai-chatbot",
    title: "AI Chat Assistant",
    description: "Ask questions about your NIL strategy, get real-time advice on brand partnerships.",
    category: "AI",
    icon: Sparkles,
    status: "in-progress",
  },
  {
    id: "brand-matching",
    title: "Brand Matchmaking",
    description: "AI-powered matching algorithm connects athletes with compatible brand partners.",
    category: "Growth",
    icon: Users,
    status: "planned",
  },
  {
    id: "compliance-checker",
    title: "NCAA Compliance Checker",
    description: "Automated NIL compliance checks against NCAA rules and state regulations.",
    category: "Compliance",
    icon: Shield,
    status: "shipped",
  },
  {
    id: "multi-language",
    title: "Multi-Language Support",
    description: "Spanish, Portuguese, and French support for international athletes.",
    category: "Platform",
    icon: Globe,
    status: "planned",
  },
  {
    id: "custom-domain",
    title: "Custom Domain Support",
    description: "Use your own domain like maya.com instead of www.nilcard.app/maya.",
    category: "Platform",
    icon: Globe,
    status: "planned",
  },
  {
    id: "api-access",
    title: "Developer API",
    description: "Public API for agencies, collectives, and third-party integrations.",
    category: "Platform",
    icon: Zap,
    status: "planned",
  },
];

const VOTES_KEY = "nilcard_feature_votes";

export default function FeedbackPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(VOTES_KEY);
    const voted = new Set<string>(stored ? JSON.parse(stored) : []);
    const savedCounts = localStorage.getItem("nilcard_feature_counts");
    const counts: Record<string, number> = savedCounts ? JSON.parse(savedCounts) : {};

    queueMicrotask(() => {
      setVotedIds(voted);
      setFeatures(
        INITIAL_FEATURES.map((f) => ({
          ...f,
          votes: counts[f.id] ?? Math.floor(Math.random() * 40) + 5,
        })).sort((a, b) => b.votes - a.votes)
      );
    });
  }, []);

  function handleVote(id: string) {
    const newVoted = new Set(votedIds);
    const newFeatures = features.map((f) => {
      if (f.id !== id) return f;
      const wasVoted = newVoted.has(id);
      if (wasVoted) {
        newVoted.delete(id);
        return { ...f, votes: f.votes - 1 };
      } else {
        newVoted.add(id);
        return { ...f, votes: f.votes + 1 };
      }
    });

    setVotedIds(newVoted);
    setFeatures(newFeatures.sort((a, b) => b.votes - a.votes));
    localStorage.setItem(VOTES_KEY, JSON.stringify([...newVoted]));

    const counts: Record<string, number> = {};
    newFeatures.forEach((f) => { counts[f.id] = f.votes; });
    localStorage.setItem("nilcard_feature_counts", JSON.stringify(counts));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitted(true);
    setNewTitle("");
    setNewDesc("");
  }

  const categories = ["all", ...new Set(features.map((f) => f.category))];
  const filtered = filter === "all" ? features : features.filter((f) => f.category === filter);

  const statusColors = {
    planned: "bg-white/10 text-white/50",
    "in-progress": "bg-accent/15 text-accent",
    shipped: "bg-emerald-500/15 text-emerald-400",
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg pt-24 pb-20">
        <div className="container-tight">
          <span className="eyebrow">Community</span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Feature Requests
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            Vote on what we build next. Your voice shapes the product.
          </p>

          {/* Filters */}
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === cat
                    ? "bg-accent text-bg"
                    : "bg-white/[0.06] text-ink-muted hover:bg-white/[0.1]"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>

          {/* Feature list */}
          <div className="mt-8 space-y-3">
            {filtered.map((feature, i) => {
              const Icon = feature.icon;
              const isVoted = votedIds.has(feature.id);
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="group rounded-2xl border border-white/[0.06] bg-[#111113] p-5 transition-all hover:border-white/[0.1]"
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleVote(feature.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all ${
                        isVoted
                          ? "bg-accent/15 border border-accent/30 text-accent"
                          : "bg-white/[0.04] border border-white/[0.08] text-ink-dim hover:text-accent hover:border-accent/30"
                      }`}
                    >
                      <ChevronUp className="h-4 w-4" />
                      <span className="text-xs font-bold">{feature.votes}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon className="h-4 w-4 text-accent/60" />
                        <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusColors[feature.status]}`}>
                          {feature.status}
                        </span>
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-ink-dim uppercase tracking-wider">
                          {feature.category}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Submit new idea */}
          <div className="mt-12 rounded-2xl border border-white/[0.06] bg-[#111113] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold text-white">Have an idea?</h2>
            </div>

            {submitted ? (
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-center">
                <p className="text-sm font-medium text-accent">Thanks for your idea!</p>
                <p className="mt-1 text-xs text-ink-dim">We review every submission weekly.</p>
              </div>
            ) : showForm ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Feature name"
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                />
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe your idea (optional)"
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-bg transition-all hover:shadow-[0_0_16px_-4px_rgba(198,255,61,0.5)]"
                  >
                    <Send className="h-3 w-3" />
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-ink-muted transition-all hover:border-accent/30 hover:text-accent"
              >
                <Lightbulb className="h-3 w-3" />
                Submit a feature idea
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
