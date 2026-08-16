import Link from "next/link";
import { Home, Search, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-lg text-center">
        <div className="relative mb-10">
          <span className="block text-[120px] sm:text-[160px] font-black leading-none tracking-tighter text-white/[0.04] select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl sm:text-7xl font-black text-accent/30 tracking-tighter select-none">
              404
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Lost on the field
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto mb-10">
          This page doesn&rsquo;t exist. The link might be outdated, or
          it may have been moved to a different playbook.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <Link href="/discover" className="btn-ghost">
            <Search className="h-4 w-4" />
            Browse athletes
          </Link>
          <Link href="/onboarding" className="btn-ghost">
            Claim your card
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <a
            href="mailto:support@nilcard.com"
            className="text-xs text-ink-dim hover:text-ink-muted transition-colors"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
