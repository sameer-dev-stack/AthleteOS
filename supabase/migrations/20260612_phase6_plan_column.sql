ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';

CREATE INDEX idx_profiles_plan ON profiles(plan);

-- Migrate existing users to 'free' tier
UPDATE profiles SET plan = 'free' WHERE plan IS NULL;

-- Add RLS policy for plan column (part of existing profile update policy)
-- No separate policy needed — plan is updated via the existing profile update policy
