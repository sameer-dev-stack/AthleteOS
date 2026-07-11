-- Email confirmation columns for custom Resend flow
-- Idempotent: safe to run multiple times

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_confirmed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS confirmation_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS confirmation_token_expires TIMESTAMPTZ;

-- Index for token lookups during confirmation
CREATE INDEX IF NOT EXISTS idx_profiles_confirmation_token ON profiles (confirmation_token) WHERE confirmation_token IS NOT NULL;
