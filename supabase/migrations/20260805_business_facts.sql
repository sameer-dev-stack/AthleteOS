-- Migration: 20260805_business_facts.sql
-- Add won_at column to inquiries table and create business_facts table

-- 1. Add won_at timestamp to inquiries table
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS won_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_inquiries_won_at ON public.inquiries(athlete_id, won_at DESC) WHERE status = 'won';

-- 2. Create business_facts table
CREATE TABLE IF NOT EXISTS public.business_facts (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_voice TEXT,
  preferred_tone TEXT NOT NULL DEFAULT 'confident' CHECK (preferred_tone IN ('confident', 'casual', 'professional', 'playful')),
  min_deal_value NUMERIC DEFAULT NULL,
  deal_preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_facts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes can read own business_facts" ON public.business_facts;
CREATE POLICY "Athletes can read own business_facts"
  ON public.business_facts FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Athletes can insert own business_facts" ON public.business_facts;
CREATE POLICY "Athletes can insert own business_facts"
  ON public.business_facts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Athletes can update own business_facts" ON public.business_facts;
CREATE POLICY "Athletes can update own business_facts"
  ON public.business_facts FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);
