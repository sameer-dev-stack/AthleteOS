"use client";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-bg text-ink flex flex-col justify-between relative overflow-x-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2" aria-label="AthleteOS home">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">AthleteOS</span>
        </Link>
        <div className="text-xs text-ink-dim">
          Need help?{" "}
          <Link href="/support" className="text-accent hover:underline font-medium">
            Contact support
          </Link>
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="w-full max-w-[420px] mx-auto px-3 sm:px-6 py-2 z-10 flex flex-col justify-center my-auto">
        <div className="mb-4 text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted">{subtitle}</p>
        </div>

        <div className="bg-elev border border-white/[0.08] rounded-2xl p-4 sm:p-6 shadow-2xl relative w-full">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2.5 text-center text-[11px] text-ink-dim z-10 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-line shrink-0">
        <div>&copy; {new Date().getFullYear()} AthleteOS, Inc. All rights reserved.</div>
        <div className="flex items-center gap-4 text-[11px]">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/ncaa" className="hover:text-white transition-colors">
            NCAA Compliance
          </Link>
        </div>
      </footer>
    </div>
  );
}
