"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { dashboardNavItems, dashboardNavSections } from "@/config/dashboard-nav";
import { Logo } from "@/components/logo";
import { signOut } from "@/lib/actions/auth";
import type { SystemNotification } from "@/lib/actions/notifications";
import {
  Menu,
  X,
  LogOut,
  Bell,
  ChevronRight,
  Settings,
  User,
  CreditCard,
  Lock,
  MessageCircle,
  DollarSign,
  UserPlus,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import type { Profile } from "@/lib/actions/profile";

type HeaderProps = {
  profile: Profile;
  email: string;
};

const READ_NOTIFS_STORAGE_KEY = "athleteos_read_notifications";

function getNotificationIcon(type: SystemNotification["type"]) {
  switch (type) {
    case "inquiry":
      return <MessageCircle className="h-3.5 w-3.5 text-[#C6FF3D]" />;
    case "tip":
      return <DollarSign className="h-3.5 w-3.5 text-emerald-400" />;
    case "referral":
      return <UserPlus className="h-3.5 w-3.5 text-cyan-400" />;
    case "milestone":
      return <Zap className="h-3.5 w-3.5 text-amber-400" />;
    case "published":
      return <CheckCircle2 className="h-3.5 w-3.5 text-[#C6FF3D]" />;
    default:
      return <Bell className="h-3.5 w-3.5 text-white/50" />;
  }
}

function formatTimeAgo(isoString: string): string {
  try {
    const now = new Date();
    const date = new Date(isoString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export function Header({ profile, email }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User avatar dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all");
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);

  const accentColor = profile.theme_accent || "#C6FF3D";
  const initials = (profile.full_name || profile.username || "A")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Load read notification IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(READ_NOTIFS_STORAGE_KEY);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Fetch real notifications on mount & periodic polling
  const fetchNotifs = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/notifications").then((r) => r.json());
      if (res?.ok && res?.data) {
        setNotifications(res.data);
      }
    } catch {
      // Ignore fetch errors
    }
    setLoadingNotifs(false);
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(() => {
      fetchNotifs();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Save read notification IDs to localStorage
  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Ignore localStorage write errors
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(new Set(allIds));
    try {
      localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(allIds));
    } catch {
      // Ignore localStorage write errors
    }
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  // Build breadcrumb segments from pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/");
    const matchingItem = dashboardNavItems.find((item) => item.href === href);
    const matchingSection = dashboardNavSections.find((s) =>
      s.items.some((item) => item.href === href)
    );
    const label = matchingItem?.title || segment.charAt(0).toUpperCase() + segment.slice(1);
    const sectionLabel = matchingSection?.label;
    return { href, label, sectionLabel, isLast: index === pathSegments.length - 1 };
  });

  // Close dropdowns on outside click or ESC
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setNotifsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setNotifsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const visibleNotifications = notifications.filter((n) => {
    if (notifFilter === "unread") return !readIds.has(n.id);
    return true;
  });

  return (
    <>
      <header className="sticky top-0 z-30 h-14 w-full border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-md md:pl-[240px]">
        <div className="flex h-full items-center w-full max-w-7xl mx-auto px-4 md:px-8">
          {/* Left: Breadcrumb */}
          <nav className="flex items-center gap-1.5 min-w-0 flex-1">

            {/* Breadcrumbs — hidden on very small screens */}
            <ol className="hidden sm:flex items-center gap-1.5 text-xs min-w-0">
              {breadcrumbs.map((crumb) => (
                <li key={crumb.href} className="flex items-center gap-1.5 min-w-0">
                  {crumb.isLast ? (
                    <span className="font-semibold text-white truncate">{crumb.label}</span>
                  ) : (
                    <>
                      <Link
                        href={crumb.href}
                        className="font-medium text-white/40 hover:text-white/70 transition-colors truncate max-w-[120px]"
                      >
                        {crumb.label}
                      </Link>
                      <span className="text-white/20 select-none flex-shrink-0" aria-hidden="true">
                        /
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ol>

            {/* Mobile: just current page title */}
            <span className="sm:hidden text-xs font-semibold text-white truncate">
              {breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard"}
            </span>
          </nav>

          {/* Right: Notifications + User Avatar */}
          <div className="flex items-center gap-2 ml-4">
            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifsRef}>
              <button
                onClick={() => {
                  setNotifsOpen(!notifsOpen);
                  setDropdownOpen(false);
                  fetchNotifs();
                }}
                className={`relative h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${
                  notifsOpen
                    ? "bg-white/[0.08] border-white/[0.15] text-white"
                    : "bg-white/[0.03] border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.06]"
                }`}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center text-bg ring-2 ring-[#0A0A0F]"
                    style={{ backgroundColor: accentColor }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover Menu */}
              {notifsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-white/[0.14] bg-[#121216] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] py-2 animate-in fade-in slide-in-from-top-2 duration-150 z-50 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-white/[0.08] bg-[#16161B] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-wide uppercase">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                        >
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-white/50 hover:text-[#C6FF3D] transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                      <Link
                        href="/dashboard/notifications"
                        onClick={() => setNotifsOpen(false)}
                        className="p-1 rounded-md text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
                        title="Notification Settings"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="px-4 py-2 border-b border-white/[0.06] bg-[#121216] flex items-center gap-2">
                    <button
                      onClick={() => setNotifFilter("all")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        notifFilter === "all"
                          ? "bg-white/[0.12] text-white"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      onClick={() => setNotifFilter("unread")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        notifFilter === "unread"
                          ? "bg-white/[0.12] text-white"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>

                  {/* List items */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06] bg-[#121216]">
                    {loadingNotifs && notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-white/40">
                        Loading notifications...
                      </div>
                    ) : visibleNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center space-y-1.5 bg-[#121216]">
                        <Check className="h-5 w-5 text-white/30 mx-auto" />
                        <p className="text-xs font-bold text-white/60">You&apos;re all caught up!</p>
                        <p className="text-[10px] text-white/35">
                          {notifFilter === "unread"
                            ? "No unread notifications"
                            : "New inquiries and tips will show up here"}
                        </p>
                      </div>
                    ) : (
                      visibleNotifications.map((notif) => {
                        const isRead = readIds.has(notif.id);
                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.link) {
                                setNotifsOpen(false);
                                window.location.href = notif.link;
                              }
                            }}
                            className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
                              isRead
                                ? "bg-[#121216] opacity-75 hover:opacity-100 hover:bg-[#18181F]"
                                : "bg-[#181820] hover:bg-[#1E1E28]"
                            }`}
                          >
                            <div className="h-7 w-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-white truncate">
                                  {notif.title}
                                </p>
                                <span className="text-[9px] text-white/40 flex-shrink-0">
                                  {formatTimeAgo(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-white/70 mt-0.5 leading-snug line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                            {!isRead && (
                              <span
                                className="h-2 w-2 rounded-full flex-shrink-0 mt-1.5 shadow-[0_0_8px_rgba(198,255,61,0.6)]"
                                style={{ backgroundColor: accentColor }}
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-white/[0.06] text-center bg-white/[0.01]">
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setNotifsOpen(false)}
                      className="text-[11px] font-bold text-[#C6FF3D] hover:underline"
                    >
                      Manage Email & System Preferences →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setNotifsOpen(false);
                }}
                className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
              >
                <div
                  className="relative h-6 w-6 rounded-full overflow-hidden border border-white/[0.1] flex-shrink-0"
                  style={{ backgroundColor: "#16161A" }}
                >
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name || profile.username || ""}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[8px] font-black"
                      style={{ color: accentColor }}
                    >
                      {initials}
                    </span>
                  )}
                </div>
                <span className="hidden lg:block text-xs font-medium text-white/70 max-w-[100px] truncate">
                  {profile.full_name || profile.username || "Athlete"}
                </span>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/[0.14] bg-[#121216] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] py-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-50 overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-semibold text-white truncate">
                      {profile.full_name || profile.username || "Athlete"}
                    </p>
                    <p className="text-xs text-white/30 truncate mt-0.5">{email}</p>
                  </div>

                  {/* Quick actions */}
                  <div className="py-1.5">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <User className="h-3.5 w-3.5" />
                      Edit Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Billing
                    </Link>
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Notifications Preferences
                    </Link>
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-white/[0.06] pt-1.5">
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-white/60 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-[280px] bg-[#0A0A0B] border-r border-white/[0.06] flex flex-col h-full z-10 animate-drawer-in">
            <div className="flex h-14 items-center justify-between px-6 mt-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Logo
                  className="h-5 w-5 rounded-[4px]"
                  style={{ backgroundColor: accentColor }}
                />
                <span
                  className="font-black tracking-[0.15em] uppercase text-sm"
                  style={{ color: accentColor }}
                >
                  AthleteOS
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/[0.04]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto relative">
              {dashboardNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                if (item.comingSoon) {
                  return (
                    <div
                      key={item.href}
                      className="flex items-center gap-2.5 w-full rounded-lg px-4 py-2.5 text-xs font-bold cursor-not-allowed select-none text-white/30"
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-white/20">
                        <Lock className="h-2.5 w-2.5" />
                        Coming soon
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={item.href} className="relative flex items-center">
                    {isActive && (
                      <div
                        className="absolute left-0 w-1 h-5 rounded-r-full z-10"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 w-full rounded-lg px-4 py-2.5 text-xs font-bold transition-all duration-150 group ${
                        isActive
                          ? "text-[#0A0A0B]"
                          : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                      }`}
                      style={{
                        backgroundColor: isActive ? accentColor : "transparent",
                      }}
                    >
                      <Icon
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: isActive ? "#0A0A0B" : undefined }}
                      />
                      <span>{item.title}</span>
                    </Link>
                  </div>
                );
              })}
            </nav>

            <div className="p-3 border-t border-white/[0.06] bg-[#0A0A0B] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="relative h-8 w-8 rounded-full overflow-hidden border border-white/[0.08] flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: "#16161A" }}
                >
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name || profile.username || ""}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span
                      className="text-[10px] font-black"
                      style={{ color: accentColor }}
                    >
                      {initials}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {profile.full_name || profile.username || "Athlete"}
                  </p>
                  <p className="text-[10px] text-white/30 truncate mt-0.5 leading-none">
                    {email}
                  </p>
                </div>
              </div>
              <form action={signOut} className="flex-shrink-0">
                <button
                  type="submit"
                  className="h-7 w-7 rounded-lg flex items-center justify-center border border-white/[0.05] bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
