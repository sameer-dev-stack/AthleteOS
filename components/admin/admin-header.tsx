"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import { adminNavSections } from "./admin-sidebar";

type AdminHeaderProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const tabLabels: Record<string, string> = {
  users: "Users & Profiles",
  financials: "Monetization & Tips",
  usage: "AI Toolkit Monitor",
  analytics: "Platform Analytics",
  compliance: "Compliance & Deals",
  security: "Security & Abuse",
  audit: "Audit Logs",
  settings: "System & Settings",
};

export function AdminHeader({ activeTab, onTabChange }: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const breadcrumbs = [
    { label: "Admin Console", href: "/admin" },
    { label: tabLabels[activeTab] || activeTab, isLast: true },
  ];

  const flatNavItems = adminNavSections.flatMap((section) =>
    section.items.map((item) => ({ ...item, section: section.label }))
  );

  return (
    <>
      <header className="sticky top-0 z-30 h-14 w-full border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-md md:pl-[240px]">
        <div className="flex h-full items-center w-full max-w-7xl mx-auto px-4 md:px-8">
          <nav className="flex items-center gap-1.5 min-w-0 flex-1">
            <ol className="hidden sm:flex items-center gap-1.5 text-xs min-w-0">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-1.5 min-w-0">
                  {crumb.isLast ? (
                    <span className="font-semibold text-white truncate">{crumb.label}</span>
                  ) : (
                    <>
                      <span className="font-medium text-white/40 truncate max-w-[120px]">
                        {crumb.label}
                      </span>
                      <span className="text-white/20 select-none flex-shrink-0" aria-hidden="true">
                        /
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ol>
            <span className="sm:hidden text-xs font-semibold text-white truncate">
              {breadcrumbs[breadcrumbs.length - 1]?.label || "Admin"}
            </span>
          </nav>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -mr-2 text-white/50 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-[280px] bg-[#0A0A0B] border-r border-white/[0.06] flex flex-col h-full z-10 animate-drawer-in">
            <div className="flex h-14 items-center justify-between px-6 mt-4">
              <span className="font-black tracking-[0.15em] uppercase text-sm text-accent">ADMIN</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/[0.04]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto relative">
              {flatNavItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <div key={item.id} className="relative flex items-center">
                    {isActive && (
                      <div
                        className="absolute left-0 w-1 h-5 rounded-r-full z-10 bg-accent"
                      />
                    )}
                    <button
                      onClick={() => {
                        onTabChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2.5 w-full rounded-lg px-4 py-2.5 text-xs font-bold transition-all duration-150 ${
                        isActive
                          ? "text-[#0A0A0B]"
                          : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                      }`}
                      style={{
                        backgroundColor: isActive ? "#C6FF3D" : "transparent",
                      }}
                    >
                      <Icon
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: isActive ? "#0A0A0B" : undefined }}
                      />
                      <span>{item.label}</span>
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
