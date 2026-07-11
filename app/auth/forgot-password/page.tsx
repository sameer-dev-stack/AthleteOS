"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { resetPassword } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const result = await resetPassword(email);
    setStatus(result);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6" aria-label="AthleteOS home">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">AthleteOS</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {status?.ok ? (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 text-center">
            <p className="text-sm text-accent font-medium">{status.message}</p>
            <Link href="/auth/sign-in" className="mt-4 inline-block text-xs text-ink-dim hover:text-ink-muted">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                placeholder="you@school.edu"
              />
            </div>

            {status && !status.ok && (
              <p className="text-sm text-red-400">{status.message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-ink-dim">
          Remember your password?{" "}
          <Link href="/auth/sign-in" className="text-ink-muted hover:text-white">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
