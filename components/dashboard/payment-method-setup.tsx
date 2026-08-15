"use client";

import { useState } from "react";
import { AlertCircle, Loader2, ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import { updateProfile } from "@/lib/actions/profile";

type Props = {
  onSuccess: () => void;
  initialEmail?: string;
};

export function PaymentMethodSetup({ onSuccess, initialEmail = "" }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

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
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
            <AlertCircle className="h-4 w-4 text-white/60" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Payout Account</h3>
            <p className="text-xs text-white/40">Connect PayPal to receive tips</p>
          </div>
        </div>
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-bg transition-all hover:shadow-[0_0_20px_-4px_rgba(198,255,61,0.4)]"
          >
            Connect PayPal
          </button>
        )}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Collapse"
          >
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        )}
      </div>

      {expanded && (
        <form onSubmit={handleSavePaypal} className="mt-5 space-y-4">
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
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-white/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
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
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-white/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-xs font-semibold text-red-400 bg-red-950/40 border border-red-500/20 px-3 py-2 rounded-xl">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-white/40 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              Secure PayPal payouts
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
              <span>{loading ? "Connecting..." : "Connect PayPal"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
