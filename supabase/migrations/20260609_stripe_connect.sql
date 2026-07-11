-- Add Stripe Connect fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account ON profiles(stripe_account_id);
