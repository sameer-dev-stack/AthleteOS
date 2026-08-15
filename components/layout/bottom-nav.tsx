"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  User,
  MoreHorizontal,
  Lock,
} from "lucide-react";
import { BottomSheet } from "@/components/mobile/bottom-sheet";
import { dashboardNavSections } from "@/config/dashboard-nav";

const tabs = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "AI", href: "/dashboard/ai", icon: Sparkles, comingSoon: true },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "More", href: "/dashboard/more", icon: MoreHorizontal, isMore: true },
];

function haptic() {
  try {
    navigator?.vibrate?.(8);
  } catch {}
}

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleTap = useCallback(() => {
    haptic();
  }, []);

  const tabHrefs = new Set(tabs.map((t) => t.href));
  const moreItems = dashboardNavSections
    .flatMap((section) =>
      section.items.map((item) => ({ ...item, section: section.label }))
    )
    .filter((item) => !tabHrefs.has(item.href));

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-white/[0.06]"
        role="navigation"
        aria-label="Main navigation"
        style={{
          backgroundColor: "rgba(10, 10, 11, 0.88)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-center justify-around h-[60px] px-2">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
            const Icon = tab.icon;

            if (tab.comingSoon) {
              return (
                <div
                  key={tab.href}
                  aria-label={`${tab.label} — coming soon`}
                  className="relative flex flex-col items-center justify-center gap-1 w-14 h-[52px] rounded-xl cursor-not-allowed select-none"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <span className="relative flex items-center justify-center">
                    <Icon
                      className="h-[22px] w-[22px] text-white/25"
                      strokeWidth={1.8}
                    />
                  </span>
                  <span className="text-[9px] font-medium leading-none text-white/20">
                    Soon
                  </span>
                </div>
              );
            }

            if (tab.isMore) {
              return (
                <button
                  key={tab.href}
                  onClick={() => {
                    haptic();
                    setMoreOpen(true);
                  }}
                  aria-label={tab.label}
                  aria-expanded={moreOpen}
                  className="relative flex flex-col items-center justify-center gap-1.5 w-14 h-[52px] rounded-xl focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <span className="relative flex items-center justify-center">
                    <Icon
                      className={`h-[22px] w-[22px] transition-all duration-300 ease-out ${
                        moreOpen ? "text-accent" : "text-white/30"
                      }`}
                      strokeWidth={moreOpen ? 2.2 : 1.8}
                    />
                    {moreOpen && (
                      <span className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent shadow-[0_0_6px_2px_rgba(198,255,61,0.5)]" />
                    )}
                  </span>
                  <span
                    className={`text-[10px] font-semibold leading-none transition-all duration-300 ease-out ${
                      moreOpen ? "text-accent" : "text-white/30"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                onClick={handleTap}
                className="relative flex flex-col items-center justify-center gap-1.5 w-14 h-[52px] rounded-xl focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span className="relative flex items-center justify-center">
                  <Icon
                    className={`h-[22px] w-[22px] transition-all duration-300 ease-out ${
                      isActive
                        ? "text-accent"
                        : "text-white/30"
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {isActive && (
                    <span className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent shadow-[0_0_6px_2px_rgba(198,255,61,0.5)]" />
                  )}
                </span>
                <span
                  className={`text-[10px] font-semibold leading-none transition-all duration-300 ease-out ${
                    isActive ? "text-accent" : "text-white/30"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="flex flex-col gap-1 -mx-5">
          {moreItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            if (item.comingSoon) {
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-3 rounded-xl px-5 py-3 cursor-not-allowed select-none"
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0 text-white/25" />
                  <span className="flex-1 text-sm text-white/30">{item.title}</span>
                  <span className="flex items-center gap-1 text-[10px] text-white/20">
                    <Lock className="h-2.5 w-2.5" />
                    Coming soon
                  </span>
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  haptic();
                  setMoreOpen(false);
                }}
                className={`flex items-center gap-3 rounded-xl px-5 py-3 text-sm transition-colors ${
                  isActive
                    ? "text-accent"
                    : "text-ink-muted hover:bg-white/[0.04] hover:text-ink"
                }`}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                <span className="flex-1">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}