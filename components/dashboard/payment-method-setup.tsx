"use client";

import { useState } from "react";
import { AlertCircle, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { updateProfile } from "@/lib/actions/profile";

type Props = {
  onSuccess: () => void;
};

export function PaymentMethodSetup({ onSuccess }: Props) {
  const [method, setMethod] = useState<"choice" | "bank" | "paypal">("choice");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bank Form State
  const [bankData, setBankData] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
  });

  // PayPal Form State
  const [paypalData, setPaypalData] = useState({
    email: "",
    confirmEmail: "",
  });

  function handleBankChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBankData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handlePaypalChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPaypalData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSaveBank(e: React.FormEvent) {
    e.preventDefault();
    if (!bankData.accountName.trim() || !bankData.bankName.trim() || !bankData.accountNumber.trim() || !bankData.routingNumber.trim()) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await updateProfile({
      payout_method: "bank_transfer",
      payout_settings: {
        accountName: bankData.accountName.trim(),
        bankName: bankData.bankName.trim(),
        accountNumber: bankData.accountNumber.trim(),
        routingNumber: bankData.routingNumber.trim(),
      },
      stripe_onboarding_complete: true,
    });

    setLoading(false);

    if (result.ok) {
      onSuccess();
    } else {
      setError(result.error || "Failed to save payout method. Please try again.");
    }
  }

  async function handleSavePaypal(e: React.FormEvent) {
    e.preventDefault();
    const email = paypalData.email.trim();
    const confirmEmail = paypalData.confirmEmail.trim();

    if (!email || !confirmEmail) {
      setError("All fields are required.");
      return;
    }

    if (email !== confirmEmail) {
      setError("PayPal emails do not match.");
      return;
    }

    // Simple email regex validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Must be a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await updateProfile({
      payout_method: "paypal",
      payout_settings: {
        email,
      },
      stripe_onboarding_complete: true,
    });

    setLoading(false);

    if (result.ok) {
      onSuccess();
    } else {
      setError(result.error || "Failed to save payout method. Please try again.");
    }
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-[#1a1f14] px-5 py-4 text-white">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/15">
          <AlertCircle className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Set up Payment Method</p>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            Add your Bank Transfer or PayPal details to start receiving tips. Setup takes 2 minutes.
          </p>

          {error && (
            <div className="mt-3 text-xs font-semibold text-red-400 bg-red-950/20 border border-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {method === "choice" && (
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                onClick={() => {
                  setMethod("bank");
                  setError(null);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)]"
              >
                <span>Bank Transfer</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => {
                  setMethod("paypal");
                  setError(null);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/[0.06]"
              >
                <span>PayPal</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {method === "bank" && (
            <form onSubmit={handleSaveBank} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    value={bankData.accountName}
                    onChange={handleBankChange}
                    disabled={loading}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={bankData.bankName}
                    onChange={handleBankChange}
                    disabled={loading}
                    placeholder="Chase, Wells Fargo..."
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={bankData.accountNumber}
                    onChange={handleBankChange}
                    disabled={loading}
                    placeholder="123456789"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    name="routingNumber"
                    value={bankData.routingNumber}
                    onChange={handleBankChange}
                    disabled={loading}
                    placeholder="987654321"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("choice");
                    setError(null);
                  }}
                  disabled={loading}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-white/[0.06]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                  <span>{loading ? "Saving..." : "Save & Continue"}</span>
                </button>
              </div>
            </form>
          )}

          {method === "paypal" && (
            <form onSubmit={handleSavePaypal} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                    PayPal Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={paypalData.email}
                    onChange={handlePaypalChange}
                    disabled={loading}
                    placeholder="paypal@example.com"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                    Confirm PayPal Email
                  </label>
                  <input
                    type="email"
                    name="confirmEmail"
                    value={paypalData.confirmEmail}
                    onChange={handlePaypalChange}
                    disabled={loading}
                    placeholder="paypal@example.com"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white placeholder-white/20 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("choice");
                    setError(null);
                  }}
                  disabled={loading}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-white/[0.06]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                  <span>{loading ? "Saving..." : "Save & Continue"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
