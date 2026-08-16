"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { resendConfirmationEmail } from "@/lib/actions/auth";
import { accountCreatedCopy } from "@/lib/auth-copy";
import { Mail, RefreshCw, ArrowRight } from "lucide-react";

function AccountCreatedContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const copy = accountCreatedCopy(email);
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
    <AuthLayout
      title={copy.heading}
      subtitle="Verify your account to activate your NIL CARD"
    >
      <div className="py-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto border border-accent/20">
          <Mail className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-ink-muted leading-relaxed">
            {copy.body}
            {email && (
              <>
                {" "}
                A verification email has been sent to{" "}
                <strong className="text-white font-medium">{email}</strong>.
              </>
            )}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-ink-dim text-left space-y-2">
          <p className="font-medium text-ink-muted">
            Didn&apos;t receive the email?
          </p>
          <ul className="list-disc list-inside space-y-1 text-ink-dim">
            <li>Check your spam or junk folder</li>
            <li>Ensure your email address was typed correctly</li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          {email && (
            <>
              {resendState && (
                <p
                  className={`text-sm ${resendState.ok ? "text-accent" : "text-red-400"}`}
                >
                  {resendState.message}
                </p>
              )}
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3 px-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-white font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{resending ? "Sending..." : "Resend confirmation email"}</span>
              </button>
            </>
          )}

          <Link
            href="/auth/sign-in"
            className="w-full py-3.5 px-4 bg-accent hover:bg-accent-soft text-bg font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all inline-flex"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="text-xs text-ink-dim pt-2">
          Already confirmed?{" "}
          <Link href="/auth/sign-in" className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function AccountCreatedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg px-4">
          <div className="w-full max-w-sm">
            <div className="rounded-2xl border border-white/[0.08] bg-elev p-8 text-center">
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 ring-1 ring-accent/20 animate-pulse motion-reduce:animate-none" />
              <div className="h-6 w-48 rounded bg-white/[0.06] mx-auto mb-4 animate-pulse motion-reduce:animate-none" />
              <div className="h-4 w-64 rounded bg-white/[0.04] mx-auto mb-2 animate-pulse motion-reduce:animate-none" />
              <div className="h-3 w-40 rounded bg-white/[0.03] mx-auto mb-6 animate-pulse motion-reduce:animate-none" />
              <div className="h-10 w-full rounded-xl bg-white/[0.04] animate-pulse motion-reduce:animate-none" />
            </div>
          </div>
        </div>
      }
    >
      <AccountCreatedContent />
    </Suspense>
  );
}
