"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ProcessingOverlay } from "@/components/auth/processing-overlay";
import { resetPassword } from "@/lib/actions/auth";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

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
    <AuthLayout
      title="Reset password"
      subtitle="We'll send you secure recovery instructions"
    >
      <ProcessingOverlay
        show={loading}
        message="Sending password reset email..."
      />

      {status?.ok ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-white font-semibold text-lg">Check your inbox</h3>
          <p className="text-xs text-ink-muted max-w-xs mx-auto">
            {status.message}
          </p>
          <div className="pt-4">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center gap-2 text-xs font-medium text-accent hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-ink-muted tracking-wide uppercase"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-dim">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="w-full pl-10 pr-4 py-3 bg-elev border border-white/[0.08] rounded-xl text-white placeholder:text-ink-dim text-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
              />
            </div>
          </div>

          {status && !status.ok && (
            <p className="text-sm text-red-400">{status.message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-accent hover:bg-accent-soft text-bg font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(198,255,61,0.2)] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg border-t-transparent" />
                <span>Sending Instructions...</span>
              </>
            ) : (
              <>
                <span>Send Reset Instructions</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center gap-1.5 text-xs text-ink-dim hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
