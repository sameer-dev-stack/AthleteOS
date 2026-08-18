ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX idx_profiles_stripe_sub ON profiles(stripe_subscription_id);
