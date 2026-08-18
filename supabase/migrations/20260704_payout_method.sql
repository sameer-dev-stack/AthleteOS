-- Add payout method and settings columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_settings JSONB DEFAULT NULL;
