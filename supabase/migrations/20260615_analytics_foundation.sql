-- Phase 8: Analytics foundation with PII protection
-- 20260615_analytics_foundation.sql

-- Analytics tables
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_ip_hash TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.link_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  link_label TEXT NOT NULL,
  link_url TEXT NOT NULL,
  viewer_ip_hash TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_page_views_athlete_id ON public.page_views(athlete_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_athlete_date ON public.page_views(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_athlete_id ON public.link_clicks(athlete_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_created_at ON public.link_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_athlete_date ON public.link_clicks(athlete_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Service role has full access for server-side tracking and dashboard reads
DROP POLICY IF EXISTS "Service role manages page_views" ON public.page_views;
CREATE POLICY "Service role manages page_views"
  ON public.page_views FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert page_views" ON public.page_views;
CREATE POLICY "Anyone can insert page_views"
  ON public.page_views FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Athletes can read own page_views" ON public.page_views;
CREATE POLICY "Athletes can read own page_views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages link_clicks" ON public.link_clicks;
CREATE POLICY "Service role manages link_clicks"
  ON public.link_clicks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert link_clicks" ON public.link_clicks;
CREATE POLICY "Anyone can insert link_clicks"
  ON public.link_clicks FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Athletes can read own link_clicks" ON public.link_clicks;
CREATE POLICY "Athletes can read own link_clicks"
  ON public.link_clicks FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

-- Raw log retention helper for future scheduled cleanup
CREATE OR REPLACE FUNCTION public.cleanup_raw_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM public.page_views WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.link_clicks WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;
