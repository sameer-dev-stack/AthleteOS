-- ============================================================
-- Lock-In System Migration
-- Tables: athlete_ai_memory, ai_events
-- Run in Supabase SQL Editor
-- ============================================================

-- ── athlete_ai_memory ──────────────────────────────────────
-- One row per athlete. Continuously updated as they use AI tools.
-- This is their AI "profile" that makes outputs feel personal.

CREATE TABLE IF NOT EXISTS public.athlete_ai_memory (
  profile_id              UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  preferred_tone          TEXT DEFAULT 'confident',
  preferred_output_length TEXT DEFAULT 'medium',
  preferred_brand_categories TEXT[] DEFAULT '{}',
  last_used_tool          TEXT,
  tools_used_count        JSONB DEFAULT '{}'::jsonb,
  outputs_saved_count     INTEGER DEFAULT 0,
  outputs_regenerated_count INTEGER DEFAULT 0,
  outputs_ignored_count   INTEGER DEFAULT 0,
  last_active_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athlete_ai_memory_profile ON public.athlete_ai_memory(profile_id);
CREATE INDEX IF NOT EXISTS idx_athlete_ai_memory_last_active ON public.athlete_ai_memory(last_active_at DESC);

ALTER TABLE public.athlete_ai_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes read own memory" ON public.athlete_ai_memory;
CREATE POLICY "Athletes read own memory"
  ON public.athlete_ai_memory FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- No direct INSERT/UPDATE by athletes — server uses service role to write

-- ── ai_events ────────────────────────────────────────────────
-- Append-only behavioral event log. Every action fires one row.
-- Used to update memory aggregates and for future analytics.

CREATE TABLE IF NOT EXISTS public.ai_events (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tool          TEXT NOT NULL,   -- bio, captions, pitch, optimize, rate, nil_engine
  action        TEXT NOT NULL,   -- generated, saved, copied, regenerated, ignored, applied
  tone_used     TEXT,
  output_length TEXT,            -- short, medium, long
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_events_profile ON public.ai_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_created_at ON public.ai_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_tool ON public.ai_events(profile_id, tool);

ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes insert own events" ON public.ai_events;
CREATE POLICY "Athletes insert own events"
  ON public.ai_events FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Athletes read own events" ON public.ai_events;
CREATE POLICY "Athletes read own events"
  ON public.ai_events FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());
