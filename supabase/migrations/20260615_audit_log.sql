-- Phase 7: Admin audit logs and policies migration
-- 20260615_audit_log.sql

-- 1. Add admin role and suspended status columns to profiles if they do not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false NOT NULL;

-- 2. Create is_admin security-definer helper function to avoid infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON public.audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- 5. Enable Row Level Security (RLS) on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS policies for audit_log: admins can insert/read, no deletes or updates allowed
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_log;
CREATE POLICY "Admins can insert audit logs"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_log;
CREATE POLICY "Admins can read audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 7. Add SELECT and UPDATE policies on profiles to allow admins to manage users
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
