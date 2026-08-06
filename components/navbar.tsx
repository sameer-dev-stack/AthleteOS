"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAbTest } from "@/lib/hooks/use-ab-test";
import { useHaptic } from "@/components/mobile/use-haptic";
import { BottomSheet } from "@/components/mobile/bottom-sheet";

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#ai", label: "AI" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "/discover", label: "Discover" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { navText } = useAbTest();
  const haptic = useHaptic();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    createClient()?.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user);
    }).catch(() => {});

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-white/[0.06] bg-bg/70 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="container-wide flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="AthleteOS home">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">AthleteOS</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm text-ink-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loggedIn ? (
            <Link href="/dashboard" className="btn-primary !py-2 !px-4 text-[13px]">
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="text-sm text-ink-muted transition-colors hover:text-ink"
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="btn-primary !py-2 !px-4 text-[13px]"
              >
                {navText}
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => { haptic.lightTap(); setOpen(!open); }}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <div className="md:hidden">
        <BottomSheet open={open} onClose={close} title="Menu">
          <div className="flex flex-col gap-1 -mx-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => { haptic.lightTap(); close(); }}
                className="rounded-xl px-5 py-3 text-sm text-ink-muted hover:bg-white/[0.04] hover:text-ink active:bg-white/[0.06] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-3 h-px bg-white/[0.06]" />
            {loggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => { haptic.lightTap(); close(); }}
                className="btn-primary mx-5 mt-1 w-auto"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  onClick={() => { haptic.lightTap(); close(); }}
                  className="rounded-xl mx-5 border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-ink transition-colors hover:bg-white/[0.06]"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/sign-up"
                  onClick={() => { haptic.lightTap(); close(); }}
                  className="btn-primary mx-5 mt-2 w-auto"
                >
                  {navText}
                </Link>
              </>
            )}
          </div>
        </BottomSheet>
      </div>
    </header>
  );
}
