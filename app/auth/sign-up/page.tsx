"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { signUp, signInWithGoogle } from "@/lib/actions/auth";
import Link from "next/link";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";
import { Logo } from "@/components/logo";
import { ReferralInviteBanner } from "@/components/auth/referral-invite-banner";
import { ProcessingOverlay } from "@/components/auth/processing-overlay";
import { PasswordField } from "@/components/auth/password-field";
import { securedNote } from "@/lib/auth-copy";
import { Shield, Zap, Users } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {pending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {pending ? "Processing…" : "Create free account"}
    </button>
  );
}

const TRUST_ITEMS = [
  { icon: Shield, text: "Free forever plan" },
  { icon: Zap, text: "Live in 2 minutes" },
  { icon: Users, text: "Join the waitlist" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [state, formAction] = useFormState(signUp, {
    ok: false,
    message: "",
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    trackFunnel("sign_up_start");
  }, []);

  useEffect(() => {
    if (state.ok) {
      trackFunnel("sign_up_complete");
      const email = state.email || "";
      router.push(`/auth/account-created?email=${encodeURIComponent(email)}`);
    } else if (state.message) {
      // Error path: release the full-screen overlay so the user can retry.
      setProcessing(false);
    }
  }, [state.ok, state.email, state.message, router]);

  const handleSubmit = (formData: FormData) => {
    setProcessing(true);
    formAction(formData);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <ProcessingOverlay show={processing} />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6" aria-label="AthleteOS home">
            <Logo />
            <span className="text-lg font-semibold tracking-tight">AthleteOS</span>
          </Link>
          <ReferralInviteBanner />
          <h1 className="text-2xl font-bold text-white">Create your free account</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Build your athlete card in under 2 minutes.
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
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
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />
          </div>

          {state?.message && !state.ok && (
            <p className="text-sm text-red-400">{state.message}</p>
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

        {/* Trust signals */}
        <div className="mt-6 flex items-center justify-center gap-4">
          {TRUST_ITEMS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-[10px] text-ink-dim">
              <Icon className="h-3 w-3" />
              {text}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-ink-dim">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-ink-muted hover:text-white">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
