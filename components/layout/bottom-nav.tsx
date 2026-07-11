"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  User,
  MoreHorizontal,
} from "lucide-react";

const tabs = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "AI", href: "/dashboard/ai", icon: Sparkles },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "More", href: "/dashboard/more", icon: MoreHorizontal },
];

function haptic() {
  try {
    navigator?.vibrate?.(8);
  } catch {}
}

export function BottomNav() {
  const pathname = usePathname();

  const handleTap = useCallback(() => {
    haptic();
  }, []);

  return (
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
  );
}
