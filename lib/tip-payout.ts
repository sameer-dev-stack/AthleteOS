import {
  PLATFORM_FEE_PERCENT_FREE,
  PLATFORM_FEE_PERCENT_PRO,
  STRIPE_FEE_RATE,
  STRIPE_FEE_FLAT_CENTS,
  STRIPE_FEE_INTERNATIONAL_RATE,
  STRIPE_FEE_CURRENCY_CONVERSION_RATE,
  MINIMUM_TIP_CENTS,
} from "./constants";

export type TipPlan = "free" | "pro";

export type TipPayoutOptions = {
  isInternationalCard?: boolean;
  needsCurrencyConversion?: boolean;
};

export type TipPayout = {
  grossCents: number;
  stripeFeeCents: number;
  platformFeeCents: number;
  netPayoutCents: number;
};

// Round to the nearest cent (Stripe ledger granularity) BEFORE subtracting,
// so the stored breakdown always sums exactly to grossCents.
function roundCents(value: number): number {
  return Math.round(value);
}

/**
 * Compute the athlete's net payout for a fan tip.
 *
 * Both fees are calculated as a percentage of the ORIGINAL gross tip_amount
 * (confirmed against business logic), never sequentially off a shrinking
 * balance:
 *
 *   FREE plan:
 *     stripe_fee    = (tip * 0.029) + 0.30
 *     platform_fee  = tip * 0.20
 *     net           = tip - stripe_fee - platform_fee
 *
 *   PRO plan:
 *     stripe_fee    = (tip * 0.029) + 0.30
 *     platform_fee  = 0
 *     net           = tip - stripe_fee
 *
 * Optional surcharges, applied to stripe_fee only (both still off gross):
 *   - isInternationalCard      → +1.5%
 *   - needsCurrencyConversion  → +1%
 *
 * Fees are rounded to whole cents BEFORE subtracting so the returned
 * gross/stripe/platform/net always reconcile to exactly zero with no
 * off-by-a-cent drift vs Stripe's own ledger.
 *
 * Net is clamped at 0: below the minimum tip floor the flat $0.30 Stripe
 * fee can approach the tip itself, and a payout can never go negative.
 */
export function calculateTipPayout(
  tipAmountCents: number,
  plan: TipPlan,
  options?: TipPayoutOptions
): TipPayout {
  const { isInternationalCard = false, needsCurrencyConversion = false } = options || {};

  const grossCents = Math.max(0, Math.round(tipAmountCents));

  const baseRate = STRIPE_FEE_RATE;
  const surchargeRate =
    (isInternationalCard ? STRIPE_FEE_INTERNATIONAL_RATE : 0) +
    (needsCurrencyConversion ? STRIPE_FEE_CURRENCY_CONVERSION_RATE : 0);

  const stripeFeeCents = roundCents(grossCents * (baseRate + surchargeRate) + STRIPE_FEE_FLAT_CENTS);

  const platformPercent = plan === "pro" ? PLATFORM_FEE_PERCENT_PRO : PLATFORM_FEE_PERCENT_FREE;
  const platformFeeCents = roundCents((grossCents * platformPercent) / 100);

  const netPayoutCents = Math.max(0, grossCents - stripeFeeCents - platformFeeCents);

  return { grossCents, stripeFeeCents, platformFeeCents, netPayoutCents };
}

/** True when a tip is below the minimum floor and its payout would be eaten by fees. */
export function isBelowMinimumTip(tipAmountCents: number): boolean {
  return tipAmountCents < MINIMUM_TIP_CENTS;
}
