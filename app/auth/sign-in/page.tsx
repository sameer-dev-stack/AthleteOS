"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { signIn, signInWithGoogle, resendConfirmationEmail } from "@/lib/actions/auth";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { PasswordField } from "@/components/auth/password-field";
import { securedNote } from "@/lib/auth-copy";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50"
    >
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const [state, formAction] = useFormState(signIn, {
    ok: false,
    message: "",
  });
  const [resendState, setResendState] = useState<{ ok: boolean; message: string } | null>(null);
  const [resending, setResending] = useState(false);

  const needsConfirmation =
    state?.message?.includes("confirm your email") ||
    state?.message?.includes("confirmation");

  useEffect(() => {
    if (state.ok) {
      let cancelled = false;
      const checkProfile = async () => {
        try {
          const res = await fetch('/api/auth/profile-status');
          const data = await res.json();
          if (cancelled) return;
          
          if (data.isAdmin) {
            router.push('/admin');
          } else if (!data.onboardingCompleted) {
            router.push('/onboarding');
          } else {
            router.push('/dashboard');
          }
        } catch (err) {
          if (cancelled) return;
          console.error('Profile check failed:', err);
          router.push('/dashboard');
        }
      };
      checkProfile();
      return () => { cancelled = true; };
    }
  }, [state.ok, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6" aria-label="AthleteOS home">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">AthleteOS</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Sign in to your athlete dashboard.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-ink-muted"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
              placeholder="you@school.edu"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-ink-muted"
            >
              Password
            </label>
            <PasswordField
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="At least 6 characters"
            />
            <div className="mt-2 text-right">
              <Link href="/auth/forgot-password" className="text-xs text-ink-dim hover:text-ink-muted transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          {state?.message && !state.ok && (
            <p className="text-sm text-red-400">{state.message}</p>
          )}

          {needsConfirmation && (
            <div className="space-y-2">
              {resendState && (
                <p className={`text-sm ${resendState.ok ? "text-accent" : "text-red-400"}`}>
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
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-ink transition-all hover:bg-white/[0.06] disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend confirmation email"}
              </button>
            </div>
          )}

          <SubmitButton />
          <p className="mt-3 text-center text-[10px] text-ink-dim">{securedNote()}</p>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-xs text-ink-dim">or</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/[0.06]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-dim">
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="text-ink-muted hover:text-white">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
