-- Launch Offer 500 Users 3-Month Trial Migration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_claimed_promo_trial BOOLEAN DEFAULT FALSE;

-- Index for fast counting of claimed promo trials
CREATE INDEX IF NOT EXISTS idx_profiles_has_claimed_promo_trial ON profiles(has_claimed_promo_trial) WHERE has_claimed_promo_trial = TRUE;
