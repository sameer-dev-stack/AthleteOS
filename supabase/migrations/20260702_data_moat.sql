-- ============================================================
-- Data Moat Migration
-- Tables: profile_events, weekly_snapshots, milestones
-- Run in Supabase SQL Editor
-- ============================================================

-- ── profile_events ──────────────────────────────────────────
-- Every profile change logged with before/after diff.
-- Enables "your profile improved 30% this month" narratives.

CREATE TABLE IF NOT EXISTS public.profile_events (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_type    TEXT NOT NULL,  -- 'bio_updated', 'stats_changed', 'link_added', 'avatar_changed', 'theme_changed', 'published', etc.
  field_name    TEXT,           -- which specific field changed
  old_value     TEXT,           -- previous value (truncated to 500 chars)
  new_value     TEXT,           -- new value (truncated to 500 chars)
  metadata      JSONB DEFAULT '{}'::jsonb,  -- extra context (e.g. stats count before/after)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_events_profile ON public.profile_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_events_created ON public.profile_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_events_type ON public.profile_events(profile_id, event_type);

ALTER TABLE public.profile_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes read own profile events" ON public.profile_events;
CREATE POLICY "Athletes read own profile events"
  ON public.profile_events FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- No direct INSERT by athletes — server uses service role

-- ── weekly_snapshots ────────────────────────────────────────
-- Historical performance rollups. One row per athlete per week.
-- Enables trend charts and "you grew 40% this month" narratives.

CREATE TABLE IF NOT EXISTS public.weekly_snapshots (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_start      DATE NOT NULL,
  week_end        DATE NOT NULL,
  card_views      INTEGER NOT NULL DEFAULT 0,
  link_clicks     INTEGER NOT NULL DEFAULT 0,
  tips_amount     NUMERIC NOT NULL DEFAULT 0,  -- dollars
  tips_count      INTEGER NOT NULL DEFAULT 0,
  followers_total INTEGER NOT NULL DEFAULT 0,
  nil_score       INTEGER NOT NULL DEFAULT 0,
  profile_score   INTEGER NOT NULL DEFAULT 0,  -- completion percentage
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_profile ON public.weekly_snapshots(profile_id);
CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_week ON public.weekly_snapshots(week_start DESC);

ALTER TABLE public.weekly_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes read own snapshots" ON public.weekly_snapshots;
CREATE POLICY "Athletes read own snapshots"
  ON public.weekly_snapshots FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Service role full access
DROP POLICY IF EXISTS "Service role manages snapshots" ON public.weekly_snapshots;
CREATE POLICY "Service role manages snapshots"
  ON public.weekly_snapshots FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── milestones ──────────────────────────────────────────────
-- Achievement tracking. One row per milestone per athlete.
-- Creates engagement hooks and makes the platform feel alive.

CREATE TABLE IF NOT EXISTS public.milestones (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  milestone_type TEXT NOT NULL,  -- 'first_tip', 'first_100_views', 'first_1000_views', 'first_link_click', 'profile_50_percent', 'profile_100_percent', 'first_ai_save', 'nil_score_20', 'nil_score_50', 'nil_score_80', 'first_brand_inquiry', 'streak_7_days'
  title         TEXT NOT NULL,   -- human-readable: "First tip received!"
  description   TEXT,            -- "You received a $5 tip from @fan123"
  value         NUMERIC,         -- optional numeric value (tip amount, view count, etc.)
  achieved_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, milestone_type)
);

CREATE INDEX IF NOT EXISTS idx_milestones_profile ON public.milestones(profile_id);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON public.milestones(milestone_type);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes read own milestones" ON public.milestones;
CREATE POLICY "Athletes read own milestones"
  ON public.milestones FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Service role manages milestones
DROP POLICY IF EXISTS "Service role manages milestones" ON public.milestones;
CREATE POLICY "Service role manages milestones"
  ON public.milestones FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
