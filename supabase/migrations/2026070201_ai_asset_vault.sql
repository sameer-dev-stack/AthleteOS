-- ============================================================
-- AI Asset Vault Migration
-- Table: ai_saved_assets
-- Run in Supabase SQL Editor
-- ============================================================

-- ── ai_saved_assets ──────────────────────────────────────
-- Stores AI-generated outputs that athletes save for later use.
-- Each row is one saved asset (bio, caption, pitch, etc.)

CREATE TABLE IF NOT EXISTS public.ai_saved_assets (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tool_type     TEXT NOT NULL CHECK (tool_type IN ('bio', 'captions', 'pitch', 'optimize', 'rate')),
  content       TEXT NOT NULL,
  is_starred    BOOLEAN DEFAULT false NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_saved_assets_profile ON public.ai_saved_assets(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_saved_assets_tool ON public.ai_saved_assets(profile_id, tool_type);
CREATE INDEX IF NOT EXISTS idx_ai_saved_assets_starred ON public.ai_saved_assets(profile_id, is_starred) WHERE is_starred = true;

-- Enable RLS
ALTER TABLE public.ai_saved_assets ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Athletes can read own assets" ON public.ai_saved_assets;
CREATE POLICY "Athletes can read own assets"
  ON public.ai_saved_assets FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Athletes can insert own assets" ON public.ai_saved_assets;
CREATE POLICY "Athletes can insert own assets"
  ON public.ai_saved_assets FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Athletes can update own assets" ON public.ai_saved_assets;
CREATE POLICY "Athletes can update own assets"
  ON public.ai_saved_assets FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Athletes can delete own assets" ON public.ai_saved_assets;
CREATE POLICY "Athletes can delete own assets"
  ON public.ai_saved_assets FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());
