-- Migration: NIL Value Engine tables

-- 1. Social accounts table
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'twitter', 'youtube', 'other'
  handle TEXT NOT NULL,
  followers INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, platform)
);

-- 2. NIL value metrics table
CREATE TABLE IF NOT EXISTS public.nil_value_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  card_views INTEGER NOT NULL DEFAULT 0,
  link_clicks INTEGER NOT NULL DEFAULT 0,
  click_through_rate NUMERIC NOT NULL DEFAULT 0,
  tips_amount NUMERIC NOT NULL DEFAULT 0, -- Store tips in dollars/cents
  tips_count INTEGER NOT NULL DEFAULT 0,
  followers_total INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC NOT NULL DEFAULT 0,
  nil_score INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nil_value_metrics ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can read/write their own social accounts
DROP POLICY IF EXISTS "Users can read own social accounts" ON public.social_accounts;
CREATE POLICY "Users can read own social accounts"
  ON public.social_accounts FOR SELECT
  TO anon, authenticated
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert own social accounts" ON public.social_accounts;
CREATE POLICY "Users can insert own social accounts"
  ON public.social_accounts FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update own social accounts" ON public.social_accounts;
CREATE POLICY "Users can update own social accounts"
  ON public.social_accounts FOR UPDATE
  TO anon, authenticated
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete own social accounts" ON public.social_accounts;
CREATE POLICY "Users can delete own social accounts"
  ON public.social_accounts FOR DELETE
  TO anon, authenticated
  USING (auth.uid() = profile_id);

-- Users can read their own NIL value metrics
DROP POLICY IF EXISTS "Users can read own nil value metrics" ON public.nil_value_metrics;
CREATE POLICY "Users can read own nil value metrics"
  ON public.nil_value_metrics FOR SELECT
  TO anon, authenticated
  USING (auth.uid() = profile_id);

-- Service role full access to metrics
DROP POLICY IF EXISTS "Service role manages nil value metrics" ON public.nil_value_metrics;
CREATE POLICY "Service role manages nil value metrics"
  ON public.nil_value_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can read all metrics
DROP POLICY IF EXISTS "Admins can read all metrics" ON public.nil_value_metrics;
CREATE POLICY "Admins can read all metrics"
  ON public.nil_value_metrics FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_profile ON public.social_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_nil_value_metrics_profile ON public.nil_value_metrics(profile_id);
CREATE INDEX IF NOT EXISTS idx_nil_value_metrics_dates ON public.nil_value_metrics(profile_id, period_start, period_end);
