"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resendConfirmationEmail } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";
import { Mail } from "lucide-react";

function AccountCreatedContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resendState, setResendState] = useState<{ ok: boolean; message: string } | null>(null);
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      const result = await resendConfirmationEmail(email);
      setResendState(result);
    } catch {
      setResendState({ ok: false, message: "Failed to resend. Try again." });
    }
    setResending(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center shadow-[0_0_40px_-12px_rgba(198,255,61,0.15)]">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20">
            <Mail className="h-8 w-8 text-accent" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-white">Your account has been created</h1>

          {email ? (
            <>
              <p className="mb-1 text-sm text-ink-muted">
                We sent a confirmation email to
              </p>
              <p className="mb-2 break-words text-sm font-semibold text-accent">
                {email}
              </p>
              <p className="mb-6 text-xs text-ink-dim">
                Please verify your account by clicking the link in the email.
              </p>
            </>
          ) : (
            <p className="mb-6 text-xs text-ink-dim">
              Please check your email to verify your account.
            </p>
          )}

          {email && (
            <>
              {resendState && (
                <p className={`mb-4 text-sm ${resendState.ok ? "text-accent" : "text-red-400"}`}>
                  {resendState.message}
                </p>
              )}

              <button
                onClick={handleResend}
                disabled={resending}
                className="mb-4 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-ink transition-all hover:bg-white/[0.06] disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend confirmation email"}
              </button>
            </>
          )}

          <Link
            href="/auth/sign-in"
            className="block w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)]"
          >
            Go to Sign In
          </Link>

          <p className="mt-4 text-xs text-ink-dim">
            Already confirmed?{" "}
            <Link href="/auth/sign-in" className="text-ink-muted hover:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AccountCreatedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg px-4">
          <div className="w-full max-w-sm">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20 animate-pulse" />
              <div className="h-6 w-48 rounded bg-white/[0.06] mx-auto mb-4 animate-pulse" />
              <div className="h-4 w-64 rounded bg-white/[0.04] mx-auto mb-2 animate-pulse" />
              <div className="h-3 w-40 rounded bg-white/[0.03] mx-auto mb-6 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-white/[0.04] animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <AccountCreatedContent />
    </Suspense>
  );
}
