-- Tips table: records each tip received by an athlete
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'succeeded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Only the athlete can read their own tips
CREATE POLICY "Athletes can read own tips"
  ON public.tips FOR SELECT
  TO anon, authenticated
  USING (auth.uid() = athlete_id);

-- No public inserts — tips are recorded via service role in webhooks
CREATE POLICY "Service role inserts tips"
  ON public.tips FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_tips_athlete_id ON public.tips(athlete_id);
CREATE INDEX IF NOT EXISTS idx_tips_created_at ON public.tips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tips_athlete_created ON public.tips(athlete_id, created_at DESC);
