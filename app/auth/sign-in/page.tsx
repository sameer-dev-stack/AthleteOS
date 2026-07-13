"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signInWithGoogle, resendConfirmationEmail } from "@/lib/actions/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordField } from "@/components/auth/password-field";
import { ProcessingOverlay } from "@/components/auth/processing-overlay";
import { securedNote } from "@/lib/auth-copy";
import { Mail, ArrowRight, AlertCircle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3.5 px-4 bg-accent hover:bg-accent-soft text-bg font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(198,255,61,0.2)] hover:shadow-[0_0_30px_rgba(198,255,61,0.35)] transition-all disabled:opacity-50"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg border-t-transparent" />
          <span>Signing In...</span>
        </>
      ) : (
        <>
          <span>Sign In to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [state, formAction] = useActionState(signIn, {
    ok: false,
    message: "",
  });
  const [resendState, setResendState] = useState<{ ok: boolean; message: string } | null>(null);
  const [resending, setResending] = useState(false);
  const [processing, setProcessing] = useState(false);

  const needsConfirmation =
    state?.message?.includes("confirm your email") ||
    state?.message?.includes("confirmation");

  useEffect(() => {
    if (state.ok) {
      let cancelled = false;
      const checkProfile = async () => {
        try {
          const res = await fetch("/api/auth/profile-status");
          const data = await res.json();
          if (cancelled) return;

          if (data.isAdmin) {
            router.push("/admin");
          } else if (!data.onboardingCompleted) {
            router.push("/onboarding");
          } else {
            router.push("/dashboard");
          }
        } catch {
          if (cancelled) return;
          router.push("/dashboard");
        }
      };
      checkProfile();
      return () => {
        cancelled = true;
      };
    } else if (state.message) {
      queueMicrotask(() => setProcessing(false));
    }
  }, [state.ok, state.message, router]);

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your AthleteOS business suite"
    >
      <ProcessingOverlay
        show={processing}
        message="Authenticating session..."
      />

      {state?.message && !state.ok && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.message}</span>
        </div>
      )}

      {needsConfirmation && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <span>{state.message}</span>
            {resendState && (
              <p className={resendState.ok ? "text-accent" : "text-red-400"}>
                {resendState.message}
              </p>
            )}
            <button
              type="button"
              onClick={async () => {
                const emailInput = document.getElementById("email") as HTMLInputElement;
                const email = emailInput?.value;
                if (!email) {
                  setResendState({ ok: false, message: "Enter your email above first." });
                  return;
                }
                setResending(true);
                const result = await resendConfirmationEmail(email);
                setResendState(result);
                setResending(false);
              }}
              disabled={resending}
              className="w-full mt-2 py-2.5 px-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-white text-xs font-medium transition-all disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend confirmation email"}
            </button>
          </div>
        </div>
      )}

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="w-full py-3 px-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-white font-medium text-sm flex items-center justify-center gap-3 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.4 0 10.6 0 13s.6 4.6 1.6 6.6l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
            />
          </svg>
          Continue with Google
        </button>
      </form>

      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.06]" />
        </div>
        <span className="relative px-3 bg-elev text-xs text-ink-dim uppercase tracking-wider">
          Or with email
        </span>
      </div>

      <form
        action={formAction}
        onSubmit={() => setProcessing(true)}
        className="space-y-4"
      >
        {/* Email Field */}
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
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@school.edu"
              className="w-full pl-10 pr-4 py-3 bg-elev border border-white/[0.08] rounded-xl text-white placeholder:text-ink-dim text-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <PasswordField
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="At least 6 characters"
          />
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-ink-dim">{securedNote()}</p>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-accent/80 hover:text-accent hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <SubmitButton />
      </form>

      {/* Switch to Sign Up */}
      <div className="mt-6 text-center text-xs text-ink-dim">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="text-accent font-medium hover:underline ml-1">
          Create free card
        </Link>
      </div>
    </AuthLayout>
  );
}
