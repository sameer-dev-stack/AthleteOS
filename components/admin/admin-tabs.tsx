"use client";

import { useState } from "react";
import { Users, ScrollText, Mail, LayoutDashboard, Settings } from "lucide-react";
import { UserTable } from "./user-table";
import { WaitlistTable } from "./waitlist-table";
import { AuditLog } from "./audit-log";
import { AdminSettings } from "./admin-settings";

type Tab = "dashboard" | "users" | "waitlist" | "audit" | "settings";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "waitlist", label: "Waitlist", icon: Mail },
  { id: "audit", label: "Audit Log", icon: ScrollText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AdminTabs({ initialTab = "users" }: { initialTab?: Tab }) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
      <div className="border-b border-white/[0.06] px-6 py-3">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-accent/15 text-accent"
                  : "text-ink-muted hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "dashboard" && <div className="text-sm text-ink-muted">Use the top stats cards to navigate. No additional dashboard content here.</div>}
        {activeTab === "users" && <UserTable />}
        {activeTab === "waitlist" && <WaitlistTable />}
        {activeTab === "audit" && <AuditLog />}
        {activeTab === "settings" && <AdminSettings />}
      </div>
    </div>
  );
}
