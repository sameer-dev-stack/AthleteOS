import Stripe from "stripe";

let _stripe: Stripe | null = null;

function initStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

export function getStripe(): Stripe {
  return initStripe();
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (initStripe() as unknown as Record<string, unknown>)[prop as string];
  },
});
