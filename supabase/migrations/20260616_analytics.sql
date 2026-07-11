-- Phase 8: Analytics data layer
-- 20260616_analytics.sql

-- 1. Page views table
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

-- 2. Link clicks table
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  link_label TEXT NOT NULL,
  link_url TEXT NOT NULL,
  viewer_ip_hash TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_page_views_athlete_id ON public.page_views(athlete_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_athlete_date ON public.page_views(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_athlete_id ON public.link_clicks(athlete_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_created_at ON public.link_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_athlete_date ON public.link_clicks(athlete_id, created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies: service role has full access, anonymous users can insert, athletes can read their own rows
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
