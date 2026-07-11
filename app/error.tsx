"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { ErrorIllustration } from "@/components/error-illustration";
import { Home, Mail, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-10 inline-flex items-center gap-2.5">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">AthleteOS</span>
        </div>

        <ErrorIllustration code="!" />

        <h1 className="text-display-md font-bold text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed max-w-xs mx-auto mb-10">
          An unexpected error occurred. Try refreshing the page, or head back
          to the homepage.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link href="/" className="btn-ghost">
            <Home className="h-4 w-4" />
            Back to home
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
