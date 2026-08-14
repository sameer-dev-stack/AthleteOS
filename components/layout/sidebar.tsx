"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { dashboardNavSections } from "@/config/dashboard-nav";
import { signOut } from "@/lib/actions/auth";
import { LogOut, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import type { Profile } from "@/lib/actions/profile";

type SidebarProps = {
  profile: Profile;
  email: string;
};

export function Sidebar({ profile, email }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const initials = (profile.full_name || profile.username || "A")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebarWidth = collapsed ? "w-[68px]" : "w-[240px]";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-40 ${sidebarWidth} bg-[#0C0C0E] border-r border-white/[0.06] transition-[width] duration-200 ease-out`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-5 flex-shrink-0 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-[8px] bg-accent flex items-center justify-center flex-shrink-0">
              <span className="text-bg font-black text-[10px] tracking-widest select-none">
                AOS
              </span>
            </div>
            {!collapsed && (
              <span className="font-black tracking-[0.15em] uppercase text-sm text-accent whitespace-nowrap">
                ATHLETEOS
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {dashboardNavSections.map((section, sectionIdx) => (
            <div key={section.label} className={sectionIdx > 0 ? "mt-6" : ""}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/25">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  if (item.comingSoon) {
                    return (
                      <div
                        key={item.href}
                        title={collapsed ? `${item.title} — coming soon` : undefined}
                        className={`group flex items-center gap-3 rounded-lg transition-all duration-150 cursor-not-allowed select-none ${
                          collapsed ? "justify-center h-10 px-0" : "h-10 px-3"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px] flex-shrink-0 text-white/30" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-[13px] font-semibold whitespace-nowrap text-white/30">
                              {item.title}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-white/20">
                              <Lock className="h-2.5 w-2.5" />
                              Coming soon
                            </span>
                          </>
                        )}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-lg transition-all duration-150 ${
                        collapsed ? "justify-center h-10 px-0" : "h-10 px-3"
                      } ${
                        isActive
                          ? "bg-accent/10 text-accent"
                          : "text-white/45 hover:text-white hover:bg-white/[0.04]"
                      }`}
                      title={collapsed ? item.title : undefined}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150 ${
                          isActive ? "text-accent" : "text-white/45 group-hover:text-white"
                        }`}
                      />
                      {!collapsed && (
                        <span className="text-[13px] font-semibold whitespace-nowrap">
                          {item.title}
                        </span>
                      )}
                      {isActive && !collapsed && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                    </Link>
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
            <div className="h-8 w-8 rounded-full overflow-hidden border border-white/[0.08] bg-[#16161A] flex items-center justify-center flex-shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name || profile.username || ""}
                  width={32}
                  height={32}
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-[10px] font-black text-accent">
                  {initials}
                </span>
              )}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate leading-tight">
                    {profile.full_name || profile.username || "Athlete"}
                  </p>
                  <p className="text-[11px] text-white/30 truncate mt-0.5 leading-none">
                    {email}
                  </p>
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all duration-150"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
