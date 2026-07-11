ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by text DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by) WHERE referred_by IS NOT NULL;
