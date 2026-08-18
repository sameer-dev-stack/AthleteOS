-- Add team roles and permissions
-- admin: full control (invite, remove, change roles)
-- coach: can view roster and analytics, no member management
-- athlete: basic member, no special permissions

-- Ensure role column has valid values
ALTER TABLE team_members
  DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE team_members
  ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('admin', 'coach', 'athlete'));

-- RLS: allow admins to update role on team_members they own
-- The existing "Team admins manage members" policy already covers UPDATE,
-- but we add an explicit one for clarity.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update member roles') THEN
    CREATE POLICY "Admins can update member roles"
      ON team_members
      FOR UPDATE
      TO authenticated
      USING (team_id IN (SELECT id FROM team_accounts WHERE admin_user_id = auth.uid()))
      WITH CHECK (team_id IN (SELECT id FROM team_accounts WHERE admin_user_id = auth.uid()));
  END IF;
END $$;
