-- Referral System Extension Migration
-- Run on the SUPABASE DIRECT connection (port 5432):
--   psql "postgresql://postgres:MZPlayz123%40@db.nkyedqekfligqhrnwkqt.supabase.co:5432/postgres" -f supabase/migrations/20260712_referral_extend.sql
-- Purpose: click-funnel table + harden grant_pro_reward search_path (PROJECT.md D13).

-- ============================================================
-- TABLE: referral_clicks (attribution funnel)
-- ============================================================
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL REFERENCES referral_codes(code) ON DELETE CASCADE,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_referrer ON referral_clicks(referrer_id);

ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;

-- Referrers can read their own clicks (aggregate via RPC / dashboard action)
CREATE POLICY "Referrers read own clicks"
  ON referral_clicks FOR SELECT
  USING (auth.uid() = referrer_id);

-- ============================================================
-- HARDEN grant_pro_reward: set search_path (PROJECT.md D13)
-- (function body unchanged; only adds SET search_path)
-- ============================================================
CREATE OR REPLACE FUNCTION grant_pro_reward(referrer_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET extended_pro_until = CASE
    WHEN extended_pro_until IS NULL OR extended_pro_until < NOW() THEN
      NOW() + INTERVAL '7 days'
    ELSE
      extended_pro_until + INTERVAL '7 days'
  END
  WHERE id = referrer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;
