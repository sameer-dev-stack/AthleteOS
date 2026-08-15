import { calculateTipPayout, isBelowMinimumTip } from "../lib/tip-payout";

describe("calculateTipPayout", () => {
  it("$10 tip, free plan, domestic card → exact payout", () => {
    const result = calculateTipPayout(1000, "free");
    expect(result).toEqual({
      grossCents: 1000,
      stripeFeeCents: 59, // (1000 * 0.029) + 30 = 59
      platformFeeCents: 200, // 1000 * 0.20
      netPayoutCents: 741, // 1000 - 59 - 200
    });
  });

  it("$10 tip, pro plan, domestic card → exact payout", () => {
    const result = calculateTipPayout(1000, "pro");
    expect(result).toEqual({
      grossCents: 1000,
      stripeFeeCents: 59,
      platformFeeCents: 0, // Pro: platform takes 0%
      netPayoutCents: 941, // 1000 - 59
    });
  });

  it("$10 tip, free plan, international card → surcharge applied", () => {
    const result = calculateTipPayout(1000, "free", { isInternationalCard: true });
    expect(result).toEqual({
      grossCents: 1000,
      stripeFeeCents: 74, // (1000 * (0.029 + 0.015)) + 30 = 74
      platformFeeCents: 200,
      netPayoutCents: 726, // 1000 - 74 - 200
    });
  });

  it("$10 tip, free plan, international + currency conversion → both surcharges", () => {
    const result = calculateTipPayout(1000, "free", {
      isInternationalCard: true,
      needsCurrencyConversion: true,
    });
    expect(result).toEqual({
      grossCents: 1000,
      stripeFeeCents: 84, // (1000 * (0.029 + 0.015 + 0.01)) + 30 = 84
      platformFeeCents: 200,
      netPayoutCents: 716, // 1000 - 84 - 200
    });
  });

  it("$0.50 tip (below fee floor) → graceful handling, never negative payout", () => {
    const result = calculateTipPayout(50, "free");
    expect(result.stripeFeeCents).toBe(31); // (50 * 0.029) + 30 = 31.45 → 31
    expect(result.platformFeeCents).toBe(10); // 50 * 0.20
    expect(result.netPayoutCents).toBeGreaterThanOrEqual(0);
    expect(result.grossCents).toBe(result.stripeFeeCents + result.platformFeeCents + result.netPayoutCents);
  });

  it("fees are rounded to the cent before subtracting (reconciles to gross)", () => {
    // $5 tip on free plan: stripe 44.5 → 45, platform 100, net 355 → sums exactly to 500
    const result = calculateTipPayout(500, "free");
    expect(result).toEqual({
      grossCents: 500,
      stripeFeeCents: 45, // (500 * 0.029) + 30 = 44.5 → rounds to 45
      platformFeeCents: 100, // 500 * 0.20
      netPayoutCents: 355, // 500 - 45 - 100
    });
  });

  it("sub-minimum tip where fees exceed gross clamps net to zero", () => {
    // $0.05 tip: stripe 30, platform 1 → fees (31) > gross (5), net clamps to 0
    const result = calculateTipPayout(5, "free");
    expect(result.grossCents).toBe(5);
    expect(result.stripeFeeCents).toBe(30); // (5 * 0.029) + 30 = 30.145 → 30
    expect(result.netPayoutCents).toBe(0);
  });

  it("pro plan never charges a platform fee regardless of card origin", () => {
    const domestic = calculateTipPayout(1000, "pro", { isInternationalCard: true });
    expect(domestic.platformFeeCents).toBe(0);
    expect(domestic.netPayoutCents).toBe(1000 - domestic.stripeFeeCents);
  });

  it("negative/zero input is clamped to zero gross", () => {
    expect(calculateTipPayout(-100, "free").grossCents).toBe(0);
    expect(calculateTipPayout(0, "pro").grossCents).toBe(0);
  });
});

describe("isBelowMinimumTip", () => {
  it("flags tips under the $5.00 floor", () => {
    expect(isBelowMinimumTip(499)).toBe(true);
  });
  it("accepts tips at or above the floor", () => {
    expect(isBelowMinimumTip(500)).toBe(false);
    expect(isBelowMinimumTip(1000)).toBe(false);
  });
});
