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
  Activity,
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
    "users" | "financials" | "compliance" | "usage" | "analytics" | "security" | "audit" | "settings" | "realtime"
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
    { id: "users", label: "User Management", icon: Users },
    { id: "financials", label: "Financials & Payouts", icon: DollarSign },
    { id: "compliance", label: "Compliance Queue", icon: ShieldCheck },
    { id: "usage", label: "Usage & AI Monitor", icon: Cpu },
    { id: "analytics", label: "Analytics Overview", icon: LineChart },
    { id: "security", label: "Security & Abuse", icon: ShieldAlert },
    { id: "audit", label: "Audit Log Viewer", icon: ScrollText },
    { id: "realtime", label: "Real-time Dashboard", icon: Activity },
    { id: "settings", label: "Platform & Settings", icon: Settings },
  ] as const;

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "users":
        return <UserManagement />;
      case "financials":
        return <FinancialsMonitor />;
      case "compliance":
        return <ComplianceQueue />;
      case "usage":
        return <UsageMonitor />;
      case "analytics":
        return <AnalyticsOverview />;
      case "security":
        return <AbuseDashboard />;
      case "audit":
        return <AuditLogViewer />;
      case "realtime":
        return <RealtimeDashboard />;
      case "settings":
        return <PlatformSettings />;
      default:
        return <UserManagement />;
    }
  };

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "AD";

  return (
    <div className="flex h-screen bg-[#050505] text-neutral-300 overflow-hidden font-sans select-none relative">
      {/* 1. DESKTOP SIDEBAR NAVIGATION */}
      <aside className="hidden lg:flex w-64 border-r border-neutral-800 flex-col bg-[#0a0a0a] justify-between shrink-0">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-neutral-800 space-y-4">
          <div className="flex flex-col">
            <div className="text-[#C6FF3D] font-black text-xl tracking-tighter leading-none">
              ATHLETEOS
            </div>
            <div className="text-[10px] font-mono text-neutral-500 tracking-[0.2em] mt-1">
              GOD_MODE_v4.2
            </div>
          </div>

          <div className="bg-neutral-900/60 rounded p-3 border border-neutral-800 flex items-center justify-between text-[10px]">
            <span className="text-neutral-400 font-bold uppercase tracking-wider">
              Session Status
            </span>
            <span className="inline-flex items-center gap-1 font-mono font-bold text-[#C6FF3D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF3D] animate-pulse"></span>
              ONLINE
            </span>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  isActive
                    ? "bg-neutral-900 text-[#C6FF3D] border border-[#C6FF3D]/20"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-[#C6FF3D]" : "text-neutral-500"}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Admin profile indicator) */}
        <div className="p-6 border-t border-neutral-800 bg-[#050505] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#C6FF3D] flex items-center justify-center text-black font-black text-xs font-mono">
              {initials}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user.email}</div>
              <div className="text-[10px] text-[#C6FF3D] font-mono uppercase tracking-wider">
                ● Root Admin
              </div>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 p-2 rounded bg-neutral-900 hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider transition-colors border border-neutral-850 cursor-pointer"
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
            />

            {/* Sliding Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#0a0a0a] border-r border-neutral-800 flex flex-col justify-between z-50 lg:hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-[#C6FF3D] font-black text-xl tracking-tighter leading-none">
                    ATHLETEOS
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 tracking-[0.2em] mt-1">
                    GOD_MODE_v4.2
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Session Indicator */}
              <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950">
                <div className="bg-neutral-900/60 rounded p-3 border border-neutral-800 flex items-center justify-between text-[10px]">
                  <span className="text-neutral-400 font-bold uppercase tracking-wider">
                    Session Status
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-[#C6FF3D]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C6FF3D] animate-pulse"></span>
                    ONLINE
                  </span>
                </div>
              </div>

              {/* Drawer Links */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
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
                      className={`w-full flex items-center gap-3 p-3 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        isActive
                          ? "bg-neutral-900 text-[#C6FF3D] border border-[#C6FF3D]/20"
                          : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${isActive ? "text-[#C6FF3D]" : "text-neutral-500"}`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-neutral-800 bg-[#050505] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#C6FF3D] flex items-center justify-center text-black font-black text-xs font-mono">
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate">{user.email}</div>
                    <div className="text-[10px] text-[#C6FF3D] font-mono uppercase tracking-wider">
                      ● Root Admin
                    </div>
                  </div>
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 p-2 rounded bg-neutral-900 hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider transition-colors border border-neutral-850 cursor-pointer"
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
      <main className="flex-1 flex flex-col overflow-hidden bg-[#050505]">
        {/* Connection Warning Banner */}
        {apiError && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 md:px-8 py-3 text-amber-400 text-xs font-medium flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono shrink-0">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5 animate-pulse" />
              <span>
                <strong className="text-amber-500 uppercase tracking-wider mr-1">
                  [System Warning]
                </strong>
                The platform settings or database connection is offline. Some admin services may be using sandbox seeded mock data.
              </span>
            </div>
          </div>
        )}

        {/* Top Global Bar */}
        <header className="h-16 border-b border-neutral-800 px-4 md:px-8 flex items-center justify-between bg-[#0a0a0a] shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-neutral-400 hover:text-[#C6FF3D] rounded hover:bg-neutral-900 transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest font-mono hidden md:inline">
                Module Directory
              </span>
              <span className="text-neutral-600 font-mono hidden md:inline">/</span>
              <h2 className="text-xs font-black text-[#C6FF3D] uppercase tracking-widest font-mono">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h2>
            </div>
          </div>

          {/* Database System Connectivity indicators */}
          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded flex items-center gap-2 text-[10px] font-mono">
              <Database className="w-3.5 h-3.5 text-neutral-500 hidden sm:inline" />
              <span className="text-neutral-500 font-bold uppercase hidden sm:inline">
                Database:
              </span>
              <span
                className={`font-bold ${
                  platformHealth?.supabaseStatus === "connected"
                    ? "text-[#C6FF3D]"
                    : "text-neutral-400"
                }`}
              >
                {platformHealth?.supabaseStatus === "connected"
                  ? "SUPABASE_LIVE"
                  : "LOCAL_SANDBOX"}
              </span>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded flex items-center gap-2 text-[10px] font-mono">
              <Lock className="w-3.5 h-3.5 text-neutral-500 hidden sm:inline" />
              <span className="text-neutral-500 font-bold uppercase hidden sm:inline">
                ADMIN:
              </span>
              <span className="text-neutral-300 font-bold">SAMEER_ROOT</span>
            </div>
          </div>
        </header>

        {/* Interactive Module Pane */}
        <section className="flex-1 p-4 md:p-8 overflow-y-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-200">
            {renderActiveComponent()}
          </div>
        </section>
      </main>
    </div>
  );
}
