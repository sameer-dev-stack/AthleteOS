-- Referral System Migration
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nkyedqekfligqhrnwkqt/sql

-- ============================================================
-- TABLES
-- ============================================================

-- Unique referral codes (one per user)
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Individual referral records
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  code_used TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_days INTEGER DEFAULT 7 NOT NULL,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Extended Pro expiration from referral rewards
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS extended_pro_until TIMESTAMPTZ DEFAULT NULL;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- referral_codes: users can read their own
CREATE POLICY "Users can view own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- referrals: users can read referrals they made
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Generate a unique 8-char alphanumeric code (no ambiguous chars)
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant Pro reward to referrer (adds 7 days from now or from extended_pro_until if future)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
