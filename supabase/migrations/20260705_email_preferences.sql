ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_preferences jsonb DEFAULT '{"welcome":true,"published":true,"inquiry":true,"weekly":true}'::jsonb;
