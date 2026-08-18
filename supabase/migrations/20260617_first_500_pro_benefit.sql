ALTER TABLE profiles ADD COLUMN IF NOT EXISTS waitlist_position INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_waitlist_position ON profiles(waitlist_position) WHERE waitlist_position IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_pro_expires ON profiles(pro_expires_at) WHERE pro_expires_at IS NOT NULL;
