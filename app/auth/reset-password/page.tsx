"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordField } from "@/components/auth/password-field";
import { ProcessingOverlay } from "@/components/auth/processing-overlay";
import { updatePassword } from "@/lib/actions/auth";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

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
    <AuthLayout
      title="Create new password"
      subtitle="Choose a strong password to secure your AthleteOS account"
    >
      <ProcessingOverlay show={loading} message="Updating password..." />

      {status?.ok ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-white font-semibold text-lg">Password updated</h3>
          <p className="text-xs text-ink-muted max-w-xs mx-auto">
            Your password has been successfully reset. You can now sign in with
            your new credentials.
          </p>
          <div className="pt-4">
            <Link
              href="/auth/sign-in"
              className="w-full py-3.5 px-4 bg-accent hover:bg-accent-soft text-bg font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all inline-flex"
            >
              <span>Sign In Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {status && !status.ok && (
            <p className="text-sm text-red-400">{status.message}</p>
          )}

          <PasswordField
            id="new-password"
            name="password"
            autoComplete="new-password"
            label="New Password"
          />

          <PasswordField
            id="confirm-new-password"
            name="confirmPassword"
            autoComplete="new-password"
            label="Confirm New Password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 px-4 bg-accent hover:bg-accent-soft text-bg font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(198,255,61,0.2)] transition-all disabled:opacity-50"
          >
            <span>Update Password</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
