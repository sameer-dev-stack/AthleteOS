"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { dashboardNavItems, dashboardNavSections } from "@/config/dashboard-nav";
import { Logo } from "@/components/logo";
import { signOut } from "@/lib/actions/auth";
import {
  Menu,
  X,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  Settings,
  User,
  CreditCard,
} from "lucide-react";
import type { Profile } from "@/lib/actions/profile";

type HeaderProps = {
  profile: Profile;
  email: string;
};

export function Header({ profile, email }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const accentColor = profile.theme_accent || "#C6FF3D";
  const initials = (profile.full_name || profile.username || "A")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setDropdownOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [dropdownOpen]);

  const handleSearchSelect = useCallback((href: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    window.location.href = href;
  }, []);

  const filteredItems = searchQuery
    ? dashboardNavItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.href.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : dashboardNavItems;

  return (
    <>
      <header className="sticky top-0 z-30 h-14 w-full border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur-md md:pl-[240px]">
        <div className="flex h-full items-center w-full max-w-7xl mx-auto px-4 md:px-8">
        {/* Left: Breadcrumb */}
        <nav className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 mr-1 text-white/50 hover:text-white rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

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
                    <span className="text-white/20 select-none flex-shrink-0" aria-hidden="true">/</span>
                  </>
                )}
              </li>
            ))}
          </ol>

          {/* Mobile: just the current page title */}
          <span className="sm:hidden text-xs font-semibold text-white truncate">
            {breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard"}
          </span>
        </nav>

        {/* Right: Search + Notifications + Avatar */}
        <div className="flex items-center gap-1 ml-4">
          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all text-xs"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 ml-1 text-[10px] text-white/25 font-mono">
              <span className="text-[10px]">&#8984;</span>K
            </kbd>
          </button>

          {/* Notification bell */}
          <button
            className="relative h-8 w-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full ring-2 ring-[#0A0A0F]"
              style={{ backgroundColor: accentColor }}
            />
          </button>

          {/* User avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-white/[0.04] transition-colors"
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
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.08] bg-[#111113] shadow-2xl shadow-black/40 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
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

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery("");
            }}
          />
          <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-150">
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 border-b border-white/[0.06]">
              <Search className="h-4 w-4 text-white/30 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages..."
                className="flex-1 h-12 bg-transparent text-sm text-white placeholder-white/30 outline-none"
              />
              <kbd className="flex-shrink-0 text-[10px] text-white/20 font-mono bg-white/[0.04] rounded px-1.5 py-0.5">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {filteredItems.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-white/30">No results found</p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const Icon = item.icon;
                  const section = dashboardNavSections.find((s) =>
                    s.items.some((i) => i.href === item.href)
                  );
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleSearchSelect(item.href)}
                      className="flex items-center gap-3 w-full px-5 py-2.5 text-left hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="h-7 w-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:border-white/[0.12] transition-colors">
                        <Icon className="h-3.5 w-3.5 text-white/40" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-white/25 truncate">
                          {section?.label}
                        </p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-white/15 group-hover:text-white/30 transition-colors flex-shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

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
