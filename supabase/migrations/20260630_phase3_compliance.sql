-- NIL Deals table: records disclosures of student-athlete NIL activities
CREATE TABLE IF NOT EXISTS public.nil_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  deal_value INTEGER NOT NULL, -- value in cents
  compensation_type TEXT NOT NULL, -- cash, product, equity, licensing
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, cleared, rejected
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nil_deals_athlete_id ON public.nil_deals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_nil_deals_status ON public.nil_deals(status);
CREATE INDEX IF NOT EXISTS idx_nil_deals_created_at ON public.nil_deals(created_at DESC);

-- Enable RLS
ALTER TABLE public.nil_deals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Athletes can read own deals"
  ON public.nil_deals FOR SELECT
  TO authenticated
  USING (auth.uid() = athlete_id);

CREATE POLICY "Athletes can insert own deals"
  ON public.nil_deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Athletes can update own deals"
  ON public.nil_deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = athlete_id);

CREATE POLICY "Admins can read all deals"
  ON public.nil_deals FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all deals"
  ON public.nil_deals FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
