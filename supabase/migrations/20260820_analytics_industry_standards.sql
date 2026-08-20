-- Industry Standard Analytics: UTM Attribution, Bot Filtering, Daily Rollups
-- 20260820_analytics_industry_standards.sql

-- 1. Extend page_views table
ALTER TABLE public.page_views 
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS ref_tag TEXT,
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false NOT NULL;

-- 2. Extend link_clicks table
ALTER TABLE public.link_clicks 
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS ref_tag TEXT,
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false NOT NULL;

-- 3. Indexes for bot filtering & attribution queries
CREATE INDEX IF NOT EXISTS idx_page_views_is_bot ON public.page_views(athlete_id, is_bot);
CREATE INDEX IF NOT EXISTS idx_page_views_utm_source ON public.page_views(athlete_id, utm_source);
CREATE INDEX IF NOT EXISTS idx_link_clicks_is_bot ON public.link_clicks(athlete_id, is_bot);

-- 4. Daily rollup table for long-term historical analytics preservation
CREATE TABLE IF NOT EXISTS public.daily_athlete_analytics (
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_views INT DEFAULT 0 NOT NULL,
  unique_visitors INT DEFAULT 0 NOT NULL,
  total_clicks INT DEFAULT 0 NOT NULL,
  total_inquiries INT DEFAULT 0 NOT NULL,
  total_tips_cents BIGINT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (athlete_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_athlete_analytics_athlete_date ON public.daily_athlete_analytics(athlete_id, date DESC);

-- 5. Enable RLS on daily_athlete_analytics
ALTER TABLE public.daily_athlete_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages daily_athlete_analytics" ON public.daily_athlete_analytics;
CREATE POLICY "Service role manages daily_athlete_analytics"
  ON public.daily_athlete_analytics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Athletes can read own daily_athlete_analytics" ON public.daily_athlete_analytics;
CREATE POLICY "Athletes can read own daily_athlete_analytics"
  ON public.daily_athlete_analytics FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

-- 6. Function to aggregate daily analytics for a target date
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_athlete_analytics (
    athlete_id,
    date,
    total_views,
    unique_visitors,
    total_clicks,
    total_inquiries,
    total_tips_cents,
    updated_at
  )
  SELECT
    p.id AS athlete_id,
    target_date AS date,
    COALESCE(v.total_views, 0) AS total_views,
    COALESCE(v.unique_visitors, 0) AS unique_visitors,
    COALESCE(c.total_clicks, 0) AS total_clicks,
    COALESCE(i.total_inquiries, 0) AS total_inquiries,
    COALESCE(t.total_tips_cents, 0) AS total_tips_cents,
    NOW() AS updated_at
  FROM public.profiles p
  LEFT JOIN (
    SELECT
      athlete_id,
      COUNT(*) AS total_views,
      COUNT(DISTINCT viewer_ip_hash) AS unique_visitors
    FROM public.page_views
    WHERE created_at::date = target_date AND is_bot = false
    GROUP BY athlete_id
  ) v ON v.athlete_id = p.id
  LEFT JOIN (
    SELECT
      athlete_id,
      COUNT(*) AS total_clicks
    FROM public.link_clicks
    WHERE created_at::date = target_date AND is_bot = false
    GROUP BY athlete_id
  ) c ON c.athlete_id = p.id
  LEFT JOIN (
    SELECT
      athlete_id,
      COUNT(*) AS total_inquiries
    FROM public.inquiries
    WHERE created_at::date = target_date
    GROUP BY athlete_id
  ) i ON i.athlete_id = p.id
  LEFT JOIN (
    SELECT
      athlete_id,
      SUM(amount) AS total_tips_cents
    FROM public.tips
    WHERE created_at::date = target_date
    GROUP BY athlete_id
  ) t ON t.athlete_id = p.id
  WHERE (COALESCE(v.total_views, 0) > 0 OR COALESCE(c.total_clicks, 0) > 0 OR COALESCE(i.total_inquiries, 0) > 0 OR COALESCE(t.total_tips_cents, 0) > 0)
  ON CONFLICT (athlete_id, date) DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_visitors = EXCLUDED.unique_visitors,
    total_clicks = EXCLUDED.total_clicks,
    total_inquiries = EXCLUDED.total_inquiries,
    total_tips_cents = EXCLUDED.total_tips_cents,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- 7. Update raw analytics cleanup to run daily aggregation before purging logs older than 90 days
CREATE OR REPLACE FUNCTION public.cleanup_raw_analytics()
RETURNS void AS $$
DECLARE
  purge_date DATE;
BEGIN
  -- Aggregate raw data into daily rollups for the days being purged
  FOR purge_date IN 
    SELECT DISTINCT created_at::date 
    FROM public.page_views 
    WHERE created_at < NOW() - INTERVAL '90 days'
  LOOP
    PERFORM public.aggregate_daily_analytics(purge_date);
  END LOOP;

  DELETE FROM public.page_views WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.link_clicks WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;
