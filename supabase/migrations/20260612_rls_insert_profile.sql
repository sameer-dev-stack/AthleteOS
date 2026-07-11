-- Add INSERT policy for profiles (needed for upsert when trigger-created row is missing)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO anon
  WITH CHECK (auth.uid() = id);
