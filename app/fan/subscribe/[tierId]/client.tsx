"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Star } from "lucide-react";
import { createSubscriptionCheckout } from "@/lib/actions/memberships";

type Tier = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  athlete_id: string;
  profiles: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
};

export default function FanSubscribeClient({ tier }: { tier: Tier }) {
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setSubscribing(true);
    setError(null);
    try {
      const result = await createSubscriptionCheckout(tier.id);
      setSubscribing(false);
      if (result.ok && result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error || "Failed to start checkout");
      }
    } catch {
      setSubscribing(false);
      setError("Network error. Please try again.");
    }
  }

  const athlete = tier.profiles;

  return (
    <div className="min-h-screen bg-bg">
      <div className="container-tight py-20">
        <div className="mx-auto max-w-md text-center">
          {athlete?.avatar_url ? (
            <Image src={athlete.avatar_url} alt="" width={64} height={64} className="mx-auto h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-xl font-bold text-accent">
              {(athlete?.full_name || "?")[0].toUpperCase()}
            </div>
          )}
          <h1 className="mt-4 text-xl font-bold text-white">{athlete?.full_name || "Athlete"}</h1>
          <p className="text-sm text-ink-dim">/{athlete?.username}</p>

          <div className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-6">
            <div className="flex items-center justify-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-bold text-white">{tier.name}</h2>
            </div>
            <p className="mt-2 text-2xl font-bold text-accent">${(tier.price_cents / 100).toFixed(2)}<span className="text-sm font-normal text-ink-dim">/mo</span></p>
            {tier.description && <p className="mt-3 text-sm text-ink-muted">{tier.description}</p>}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <button onClick={handleSubscribe} disabled={subscribing} className="mt-8 w-full rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40">
            {subscribing ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Subscribe"}
          </button>

          <p className="mt-4 text-xs text-ink-dim">Powered by Stripe. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
