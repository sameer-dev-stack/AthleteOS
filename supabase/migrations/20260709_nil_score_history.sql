-- Migration: NIL Score History
-- Keeps a rolling history of NIL score recalculations so the dashboard can show
-- score trend over time. The latest snapshot still lives in nil_value_metrics.

CREATE TABLE IF NOT EXISTS public.nil_score_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nil_score INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT 'Emerging',
  breakdown_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nil_score_history ENABLE ROW LEVEL SECURITY;

-- Users can read their own history
DROP POLICY IF EXISTS "Users can read own nil score history" ON public.nil_score_history;
CREATE POLICY "Users can read own nil score history"
  ON public.nil_score_history FOR SELECT
  TO anon, authenticated
  USING (auth.uid() = profile_id);

-- Service role full access to history
DROP POLICY IF EXISTS "Service role manages nil score history" ON public.nil_score_history;
CREATE POLICY "Service role manages nil score history"
  ON public.nil_score_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can read all history
DROP POLICY IF EXISTS "Admins can read all nil score history" ON public.nil_score_history;
CREATE POLICY "Admins can read all nil score history"
  ON public.nil_score_history FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nil_score_history_profile ON public.nil_score_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_nil_score_history_profile_computed ON public.nil_score_history(profile_id, computed_at);
