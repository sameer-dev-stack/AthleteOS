"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function WelcomeContent() {
  const searchParams = useSearchParams();
  const message =
    searchParams.get("message") || "Welcome to AthleteOS!";

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#111113] p-8 text-center">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <svg
            className="h-6 w-6 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold text-white">You&apos;re Confirmed</h1>
        <p className="mb-6 text-sm text-ink-muted">{message}</p>
        <Link
          href="/auth/sign-in"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:bg-accent-soft transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function AuthWelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <div className="text-sm text-ink-muted">Loading...</div>
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
