import Link from "next/link";
import { Logo } from "@/components/logo";
import { ErrorIllustration } from "@/components/error-illustration";
import { Home, Search, ArrowRight, Mail } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-10 inline-flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">AthleteOS</span>
        </div>

        <ErrorIllustration code="404" />

        <h1 className="text-display-md font-bold text-white mb-3">
          Page not found
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed max-w-xs mx-auto mb-10">
          This page doesn&rsquo;t exist. It may have been moved, or the link
          might be outdated.
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
            href="mailto:support@athleteos.com"
            className="inline-flex items-center gap-2 text-xs text-ink-dim hover:text-ink-muted transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
