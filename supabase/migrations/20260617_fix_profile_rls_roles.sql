-- Fix profile RLS policies: add "authenticated" role alongside "anon"
-- The existing policies only grant to "anon", but Supabase authenticated users
-- have role "authenticated", so they can't read/insert/update their own profiles.

-- Drop the old anon-only policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate with both anon and authenticated roles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO anon, authenticated
  USING (auth.uid() = id);
