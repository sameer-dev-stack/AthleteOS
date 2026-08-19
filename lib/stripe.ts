import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripeSecretKey(): string {
  const mode = (process.env.STRIPE_MODE || "").toLowerCase();
  if (mode === "live") {
    return process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "";
  }
  if (mode === "test") {
    return process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "";
  }
  return process.env.STRIPE_SECRET_KEY || "";
}

function initStripe(): Stripe {
  if (!_stripe) {
    const key = getStripeSecretKey();
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

export function getStripe(): Stripe {
  return initStripe();
}

export function getStripeMode(): "test" | "live" | "unknown" {
  const mode = (process.env.STRIPE_MODE || "").toLowerCase();
  if (mode === "live") return "live";
  if (mode === "test") return "test";
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "unknown";
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (initStripe() as unknown as Record<string, unknown>)[prop as string];
  },
});
