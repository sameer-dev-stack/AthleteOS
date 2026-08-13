"use client";

import React, { useState, useEffect } from "react";
import { supabaseApi } from "./god-mode/supabase";
import UserManagement from "./god-mode/UserManagement";
import FinancialsMonitor from "./god-mode/FinancialsMonitor";
import ComplianceQueue from "./god-mode/ComplianceQueue";
import UsageMonitor from "./god-mode/UsageMonitor";
import AnalyticsOverview from "./god-mode/AnalyticsOverview";
import AbuseDashboard from "./god-mode/AbuseDashboard";
import AuditLogViewer from "./god-mode/AuditLogViewer";
import PlatformSettings from "./god-mode/PlatformSettings";
import RealtimeDashboard from "./god-mode/RealtimeDashboard";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "@/lib/actions/auth";

import {
  Users,
  DollarSign,
  ShieldCheck,
  LineChart,
  ShieldAlert,
  ScrollText,
  Settings,
  Database,
  Lock,
  Cpu,
  Menu,
  X,
  AlertTriangle,
  LogOut,
} from "lucide-react";

type AdminShellProps = {
  user: { email: string; id: string };
  stats: {
    totalUsers: number;
    waitlistCount: number;
    newsletterCount: number;
    activeUsers: number;
  };
};

export function AdminShell({ user }: AdminShellProps) {
  const [activeTab, setActiveTab] = useState<
    "users" | "financials" | "usage" | "analytics" | "security" | "audit" | "settings" | "realtime"
  >("users");

  const [platformHealth, setPlatformHealth] = useState<{
    supabaseStatus: "connected" | "error";
    stripeWebhookHealth: "healthy" | "error";
  } | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [apiError, setApiError] = useState<boolean>(false);

  // Fetch platform health status to show in top bar
  useEffect(() => {
    supabaseApi
      .getPlatformHealth()
      .then((res) => {
        setPlatformHealth(res);
        setApiError(false);
      })
      .catch((err) => {
        console.error("Error fetching platform status:", err);
        setApiError(true);
      });
  }, []);

  const navItems = [
    { id: "users", label: "Users & Profiles", icon: Users, description: "Manage athlete profiles, public cards, verification badges, and plan tiers" },
    { id: "financials", label: "Monetization & Tips", icon: DollarSign, description: "Track fan tips, platform fee revenue, and Stripe onboarding status" },
    { id: "usage", label: "AI Toolkit Monitor", icon: Cpu, description: "Monitor AI tool generations and plan quota consumption" },
    { id: "analytics", label: "Platform Analytics", icon: LineChart, description: "Track card page views, unique visitors, and link clicks" },
    { id: "settings", label: "System & Audit Logs", icon: Settings, description: "Inspect system health, feature flags, and administrative audit trails" },
  ] as const;

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "users":
        return <UserManagement />;
      case "financials":
        return <FinancialsMonitor />;
      case "usage":
        return <UsageMonitor />;
      case "analytics":
        return <AnalyticsOverview />;
      case "settings":
        return (
          <div className="space-y-8">
            <PlatformSettings />
            <AuditLogViewer />
          </div>
        );
      default:
        return <UserManagement />;
    }
  };

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "AD";

  return (
    <div className="flex min-h-screen bg-[#07070A] text-ink font-sans select-none relative">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[350px] bg-[#C6FF3D]/[0.025] blur-[140px] rounded-full pointer-events-none" />

      {/* 1. DESKTOP SIDEBAR NAVIGATION */}
      <aside className="hidden lg:flex w-64 border-r border-white/[0.07] flex-col bg-[#0A0A0B] justify-between shrink-0 h-screen fixed top-0 left-0 z-30">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/[0.07] space-y-4 shrink-0">
          <div className="flex flex-col">
            <div className="text-accent font-black text-xl tracking-tighter leading-none flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></span>
              ATHLETEOS
            </div>
            <div className="text-[10px] font-mono text-ink-dim tracking-[0.2em] mt-1.5 uppercase">
              ADMIN CONTROL CENTER v4.2
            </div>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-md rounded-xl p-3 border border-white/[0.06] flex items-center justify-between text-[10px]">
            <span className="text-ink-muted font-semibold uppercase tracking-wider">
              System Status
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              ONLINE
            </span>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? "bg-accent/10 text-accent border border-accent/20 shadow-[0_0_20px_rgba(198,255,61,0.1)] font-bold"
                    : "text-ink-muted hover:text-white hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-accent" : "text-ink-dim"}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Admin profile indicator) */}
        <div className="p-5 border-t border-white/[0.07] bg-[#0A0A0B] space-y-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-bg font-black text-xs font-mono shadow-md">
              {initials}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user.email}</div>
              <div className="text-[10px] text-accent font-mono uppercase tracking-wider">
                Root Admin
              </div>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-ink-muted hover:text-white text-xs font-semibold transition-all border border-white/[0.06] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* MOBILE DRAWER NAVIGATION */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 lg:hidden"
            />

            {/* Sliding Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#0A0A0B] border-r border-white/[0.07] flex flex-col justify-between z-50 lg:hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/[0.07] flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-accent font-black text-xl tracking-tighter leading-none flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                    ATHLETEOS
                  </div>
                  <div className="text-[10px] font-mono text-ink-dim tracking-[0.2em] mt-1">
                    ADMIN CONTROL CENTER v4.2
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-ink-dim hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-thin">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-accent/10 text-accent border border-accent/20 font-bold"
                          : "text-ink-muted hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-accent" : "text-ink-dim"}`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-white/[0.07] bg-[#07070A] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-bg font-black text-xs font-mono">
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate">{user.email}</div>
                    <div className="text-[10px] text-accent font-mono uppercase tracking-wider">
                      Root Admin
                    </div>
                  </div>
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold transition-all border border-white/[0.06] cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#07070A] z-10 lg:pl-64 w-full">
        {/* Connection Warning Banner */}
        {apiError && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 text-amber-400 text-xs font-medium flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono shrink-0">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5 animate-pulse" />
              <span>
                <strong className="text-amber-500 uppercase tracking-wider mr-1">
                  [System Warning]
                </strong>
                Database connection is offline. Admin services are operating on local fallback.
              </span>
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/[0.07] px-6 md:px-8 flex items-center justify-between bg-[#0A0A0B]/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-ink-dim hover:text-accent rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink-dim font-bold uppercase tracking-widest font-mono hidden md:inline">
                Admin Console
              </span>
              <span className="text-ink-dim font-mono hidden md:inline">/</span>
              <h2 className="text-xs font-bold text-accent uppercase tracking-widest font-mono">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h2>
            </div>
          </div>

          {/* System Indicators */}
          <div className="flex items-center gap-3">
            <div className="bg-white/[0.03] border border-white/[0.07] px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-mono">
              <Database className="w-3.5 h-3.5 text-ink-dim hidden sm:inline" />
              <span className="text-ink-dim font-semibold uppercase hidden sm:inline">
                Database:
              </span>
              <span
                className={`font-bold ${
                  platformHealth?.supabaseStatus === "connected"
                    ? "text-accent"
                    : "text-ink-muted"
                }`}
              >
                {platformHealth?.supabaseStatus === "connected"
                  ? "SUPABASE_LIVE"
                  : "LOCAL_SANDBOX"}
              </span>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.07] px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-mono">
              <Lock className="w-3.5 h-3.5 text-ink-dim hidden sm:inline" />
              <span className="text-ink-dim font-semibold uppercase hidden sm:inline">
                Role:
              </span>
              <span className="text-white font-bold">SUPER_ADMIN</span>
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <section className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full space-y-6 pb-24 animate-in fade-in duration-200">
            {renderActiveComponent()}
          </div>
        </section>
      </main>
    </div>
  );
}
