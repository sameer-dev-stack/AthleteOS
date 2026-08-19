"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ClipboardCheck, DollarSign, LineChart, Cpu, ShieldAlert, ScrollText, Settings, ChevronLeft, ChevronRight, LayoutDashboard, type LucideIcon } from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

type AdminSidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail: string;
};

export const adminNavSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: require("lucide-react").LayoutDashboard },
    ],
  },
  {
    label: "Management",
    items: [
      { id: "users", label: "Users & Profiles", icon: Users },
      { id: "compliance", label: "Compliance & Deals", icon: ClipboardCheck },
    ],
  },
  {
    label: "Revenue",
    items: [
      { id: "financials", label: "Monetization & Tips", icon: DollarSign },
    ],
  },
  {
    label: "Insights",
    items: [
      { id: "analytics", label: "Platform Analytics", icon: LineChart },
      { id: "usage", label: "AI Toolkit Monitor", icon: Cpu },
    ],
  },
  {
    label: "System",
    items: [
      { id: "security", label: "Security & Abuse", icon: ShieldAlert },
      { id: "audit", label: "Audit Logs", icon: ScrollText },
      { id: "settings", label: "System & Settings", icon: Settings },
    ],
  },
];

export function AdminSidebar({ activeTab, onTabChange, userEmail }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "AD";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 ${
          collapsed ? "w-[68px]" : "w-[240px]"
        } bg-[#0C0C0E] border-r border-white/[0.06] transition-[width] duration-200 ease-out`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-5 flex-shrink-0 border-b border-white/[0.06]">
          <button
            onClick={() => onTabChange("users")}
            className="flex items-center gap-3"
            title="Admin Home"
          >
            <div className="h-8 w-8 rounded-[8px] bg-accent flex items-center justify-center flex-shrink-0">
              <span className="text-bg font-black text-[10px] tracking-widest select-none">
                AO
              </span>
            </div>
            {!collapsed && (
              <span className="font-black tracking-[0.15em] uppercase text-sm text-accent whitespace-nowrap">
                ADMIN
              </span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {adminNavSections.map((section, sectionIdx) => (
            <div key={section.label} className={sectionIdx > 0 ? "mt-6" : ""}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/25">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`group flex items-center gap-3 rounded-lg transition-all duration-150 w-full ${
                        collapsed ? "justify-center h-10 px-0" : "h-10 px-3"
                      } ${
                        isActive
                          ? "bg-accent/10 text-accent"
                          : "text-white/45 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150 ${
                          isActive ? "text-accent" : "text-white/45 group-hover:text-white"
                        }`}
                      />
                      {!collapsed && (
                        <span className="text-[13px] font-semibold whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                      {isActive && !collapsed && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center justify-center w-full h-8 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.04] transition-all duration-150"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* User section */}
        <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
          <div
            className={`flex items-center gap-3 rounded-lg p-2 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-bg font-black text-[10px] font-mono">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate leading-tight">
                  Root Admin
                </p>
                <p className="text-[11px] text-white/30 truncate mt-0.5 leading-none">
                  {userEmail}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
