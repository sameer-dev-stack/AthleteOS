"use client";

import React, { useState, useEffect } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { supabaseApi } from "./god-mode/supabase";
import UserManagement from "./god-mode/UserManagement";
import AdminDashboard from "./god-mode/AdminDashboard";
import FinancialsMonitor from "./god-mode/FinancialsMonitor";
import ComplianceQueue from "./god-mode/ComplianceQueue";
import UsageMonitor from "./god-mode/UsageMonitor";
import AnalyticsOverview from "./god-mode/AnalyticsOverview";
import AbuseDashboard from "./god-mode/AbuseDashboard";
import AuditLogViewer from "./god-mode/AuditLogViewer";
import PlatformSettings from "./god-mode/PlatformSettings";
import RealtimeDashboard from "./god-mode/RealtimeDashboard";
import { signOut } from "@/lib/actions/auth";
import { ToastProvider, ConfirmDialogProvider } from "./ui/overlays";
import AdminKeyboardShortcuts from "./ui/keyboard-shortcuts";

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
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [platformHealth, setPlatformHealth] = useState<{
    supabaseStatus: "connected" | "error";
    stripeWebhookHealth: "healthy" | "error";
  } | null>(null);
  const [apiError, setApiError] = useState<boolean>(false);

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

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <UserManagement />;
      case "financials":
        return <FinancialsMonitor />;
      case "usage":
        return <UsageMonitor />;
      case "analytics":
        return <AnalyticsOverview />;
      case "compliance":
        return <ComplianceQueue />;
      case "security":
        return <AbuseDashboard />;
      case "audit":
        return <AuditLogViewer />;
      case "settings":
        return (
          <div className="space-y-8">
            <PlatformSettings />
            <RealtimeDashboard />
          </div>
        );
      default:
        return <UserManagement />;
    }
  };

  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <div className="relative min-h-screen bg-bg">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} userEmail={user.email} />
          <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="md:pl-[240px] min-h-[calc(100vh-4rem)] flex flex-col transition-[padding] duration-200">
            <div className="flex-1 px-4 py-8 md:px-8 max-w-7xl w-full mx-auto">
              {apiError && (
                <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-medium text-amber-400">
                  Database connection is offline. Admin services are operating on local fallback.
                </div>
              )}
              {renderActiveComponent()}
            </div>
          </main>
        </div>
        <AdminKeyboardShortcuts />
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}
