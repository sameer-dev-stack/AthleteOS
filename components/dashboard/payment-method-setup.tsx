"use client";

import { useState } from "react";
import { AlertCircle, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { updateProfile } from "@/lib/actions/profile";

type Props = {
  onSuccess: () => void;
  initialEmail?: string;
};

export function PaymentMethodSetup({ onSuccess, initialEmail = "" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PayPal Form State
  const [paypalData, setPaypalData] = useState({
    email: initialEmail,
    confirmEmail: initialEmail,
  });

  function handlePaypalChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPaypalData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSavePaypal(e: React.FormEvent) {
    e.preventDefault();
    const email = paypalData.email.trim();
    const confirmEmail = paypalData.confirmEmail.trim();

    if (!email || !confirmEmail) {
      setError("All fields are required.");
      return;
    }

    if (email.toLowerCase() !== confirmEmail.toLowerCase()) {
      setError("PayPal email addresses do not match.");
      return;
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid PayPal email address.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await updateProfile({
      payout_method: "paypal",
      payout_settings: {
        email: email.toLowerCase(),
      },
      stripe_onboarding_complete: true,
    });

    setLoading(false);

    if (result.ok) {
      onSuccess();
    } else {
      setError(result.error || "Failed to save PayPal account. Please try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-accent/20 bg-[#161B12] p-5 text-white shadow-lg">
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/20">
          <AlertCircle className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Connect PayPal Payout Account</h3>
            <span className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
              Exclusive Method
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            AthleteOS processes all tip payouts exclusively through PayPal. Enter your PayPal email below to receive fan tips directly to your account.
          </p>

          {error && (
            <div className="mt-3 text-xs font-semibold text-red-400 bg-red-950/40 border border-red-500/20 px-3 py-2 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSavePaypal} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                  PayPal Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={paypalData.email}
                  onChange={handlePaypalChange}
                  disabled={loading}
                  placeholder="your-name@paypal.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                  Confirm PayPal Email Address
                </label>
                <input
                  type="email"
                  name="confirmEmail"
                  value={paypalData.confirmEmail}
                  onChange={handlePaypalChange}
                  disabled={loading}
                  placeholder="your-name@paypal.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-white/40 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                Verified for instant payouts
              </span>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                <span>{loading ? "Connecting PayPal..." : "Connect PayPal Account"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
