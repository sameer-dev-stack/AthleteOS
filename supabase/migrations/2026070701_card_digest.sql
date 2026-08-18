-- Add last_digest_sent_at for bi-weekly card strength digest
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_last_digest ON profiles (last_digest_sent_at);
