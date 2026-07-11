"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { updatePassword } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ ok: false, message: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
      setStatus({ ok: false, message: "Password must be at least 6 characters." });
      return;
    }
    setLoading(true);
    const result = await updatePassword(password);
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
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Choose a strong password for your account.
          </p>
        </div>

        {status?.ok ? (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 text-center">
            <p className="text-sm text-accent font-medium">{status.message}</p>
            <Link href="/auth/sign-in" className="mt-4 inline-block text-xs text-ink-dim hover:text-ink-muted">
              Sign in with new password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-muted">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-ink-muted">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                placeholder="Repeat your password"
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
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-ink-dim">
          <Link href="/auth/sign-in" className="text-ink-muted hover:text-white">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
