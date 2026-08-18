-- Migration: 20260805_deal_room_inquiries.sql
-- Add pipeline status constraint and deal_value to inquiries table for Deal Room

-- Currency Unit Note: tips.amount is stored in CENTS. inquiries.deal_value is stored in DOLLARS.

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS deal_value NUMERIC DEFAULT NULL;

-- Update status default and check constraint
ALTER TABLE public.inquiries
  DROP CONSTRAINT IF EXISTS inquiries_status_check;

ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_status_check
  CHECK (status IN ('new', 'replied', 'negotiating', 'won', 'lost'));

-- Security Hardening: Trigger to force status = 'new' and deal_value = NULL on public inserts
CREATE OR REPLACE FUNCTION public.sanitize_inquiry_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status := 'new';
  NEW.deal_value := NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tg_inquiries_sanitize_insert ON public.inquiries;
CREATE TRIGGER tg_inquiries_sanitize_insert
  BEFORE INSERT ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_inquiry_insert();

-- Ensure RLS policies for athlete owner
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can read own inquiries" ON public.inquiries;
CREATE POLICY "Athletes can read own inquiries"
  ON public.inquiries FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Athletes can update own inquiries" ON public.inquiries;
CREATE POLICY "Athletes can update own inquiries"
  ON public.inquiries FOR UPDATE
  TO authenticated
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert inquiries" ON public.inquiries;
CREATE POLICY "Anyone can insert inquiries"
  ON public.inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
