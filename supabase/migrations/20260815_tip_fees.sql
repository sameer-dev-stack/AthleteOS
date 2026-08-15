-- Tip payout fee breakdown: persist Stripe's processing fee alongside the
-- existing platform_fee / net_amount columns so the athlete balance ledger
-- reconciles exactly to Stripe's own numbers.
--
-- Fees are computed in lib/tip-payout.ts (calculateTipPayout) on a gross
-- basis, each rounded to the cent before subtraction:
--   FREE: stripe = tip*0.029 + 0.30 (+1.5% intl card, +1% currency conv),
--         platform = tip*0.20, net = tip - stripe - platform
--   PRO:  stripe = tip*0.029 + 0.30, platform = 0, net = tip - stripe
ALTER TABLE public.tips
  ADD COLUMN IF NOT EXISTS stripe_fee INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_tips_stripe_payment_intent
  ON public.tips(stripe_payment_intent_id);
