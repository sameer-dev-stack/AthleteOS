-- Payouts table: tracks money withdrawn from athlete's Stripe Connect balance
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  stripe_payout_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  arrival_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes can read own payouts') THEN
    CREATE POLICY "Athletes can read own payouts" ON public.payouts FOR SELECT TO authenticated USING (athlete_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages payouts') THEN
    CREATE POLICY "Service role manages payouts" ON public.payouts FOR ALL TO service_role USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payouts_athlete ON public.payouts(athlete_id);
CREATE INDEX IF NOT EXISTS idx_payouts_created ON public.payouts(created_at DESC);
