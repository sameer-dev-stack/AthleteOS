-- Incremental migration: Phase 2 athlete fields
-- Project: nkyedqekfligqhrnwkqt

-- Add athlete fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sport TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class_year TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_published BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Drop old restrictive RLS policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public can read published profiles" ON profiles;

-- Profiles: athletes can read/update their own profile via anon key
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO anon
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO anon
  USING (auth.uid() = id);

-- Profiles: public read access for published profiles (used by public card page)
CREATE POLICY "Public can read published profiles"
  ON profiles FOR SELECT
  TO anon
  USING (profile_published = true);

-- Remove public read policies from waitlist/newsletter (security fix from Session 18)
DROP POLICY IF EXISTS "Allow public read for count" ON waitlist;
DROP POLICY IF EXISTS "Allow public read for count" ON newsletter;
