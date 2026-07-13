"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, signInWithGoogle } from "@/lib/actions/auth";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ReferralInviteBanner } from "@/components/auth/referral-invite-banner";
import { ProcessingOverlay } from "@/components/auth/processing-overlay";
import { PasswordField } from "@/components/auth/password-field";
import { securedNote } from "@/lib/auth-copy";
import { Mail, User, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

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
          <span>Creating Account...</span>
        </>
      ) : (
        <>
          <span>Create Free Athlete Card</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

const PERKS = [
  { icon: CheckCircle2, text: "Instant public athlete profile & QR code" },
  { icon: CheckCircle2, text: "Stripe-powered tip jar & monetization" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [state, formAction] = useActionState(signUp, {
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
      router.push(
        `/auth/account-created?email=${encodeURIComponent(email)}`
      );
    } else if (state.message) {
      setProcessing(false);
    }
  }, [state.ok, state.email, state.message, router]);

  return (
    <AuthLayout
      title="Claim your athlete card"
      subtitle="Join 1,200+ athletes building their NIL business"
    >
      <ProcessingOverlay
        show={processing}
        message="Creating your AthleteOS account..."
      />

      <div className="mb-6">
        <ReferralInviteBanner />
      </div>

      {state?.message && !state.ok && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.message}</span>
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
          Sign up with Google
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
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="fullName"
            className="block text-xs font-medium text-ink-muted tracking-wide uppercase"
          >
            Full Athlete Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-dim">
              <User className="w-4 h-4" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="Maya Reyes"
              className="w-full pl-10 pr-4 py-3 bg-elev border border-white/[0.08] rounded-xl text-white placeholder:text-ink-dim text-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
            />
          </div>
        </div>

        {/* Email */}
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
              placeholder="maya.reyes@stanford.edu"
              className="w-full pl-10 pr-4 py-3 bg-elev border border-white/[0.08] rounded-xl text-white placeholder:text-ink-dim text-sm focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <PasswordField
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          label="Create Password"
        />

        {/* Confirm Password */}
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          label="Confirm Password"
        />

        {/* Perks Checklist */}
        <div className="pt-2 pb-1 space-y-2 text-xs text-ink-dim">
          {PERKS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-accent" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Submit */}
        <SubmitButton />
        <p className="mt-3 text-center text-[10px] text-ink-dim">
          {securedNote()}
        </p>
      </form>

      {/* Switch to Sign In */}
      <div className="mt-6 text-center text-xs text-ink-dim">
        Already have an account?{" "}
        <Link
          href="/auth/sign-in"
          className="text-accent font-medium hover:underline ml-1"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
