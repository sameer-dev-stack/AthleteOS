-- Phase 7: Admin security hardening
-- 20260615_admin_hardening.sql

-- 1. Re-create is_admin() with SET search_path to prevent schema poisoning attacks
--    SECURITY DEFINER without a fixed search_path is vulnerable to search_path hijacking.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- 2. Explicit RESTRICT policies for UPDATE on audit_log
--    RLS denies by default when no permissive policy matches, but explicit RESTRICT
--    policies make the immutability intent unambiguous and survive future policy changes.
DROP POLICY IF EXISTS "No updates to audit logs" ON public.audit_log;
CREATE POLICY "No updates to audit logs"
  ON public.audit_log FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- 3. Explicit RESTRICT policy for DELETE on audit_log
DROP POLICY IF EXISTS "No deletes from audit logs" ON public.audit_log;
CREATE POLICY "No deletes from audit logs"
  ON public.audit_log FOR DELETE
  TO authenticated
  USING (false);

-- 4. Database-level immutability trigger — enforces hardness even for service_role
--    which bypasses RLS entirely. This is the true last line of defense.
CREATE OR REPLACE FUNCTION public.audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log rows are immutable — updates and deletes are not permitted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS tg_audit_log_no_update ON public.audit_log;
CREATE TRIGGER tg_audit_log_no_update
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

DROP TRIGGER IF EXISTS tg_audit_log_no_delete ON public.audit_log;
CREATE TRIGGER tg_audit_log_no_delete
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

-- 5. Composite index to make rate-limit window queries fast (admin_id + action + created_at)
--    Used by the Server Action rate limiter to count recent actions within the last hour.
CREATE INDEX IF NOT EXISTS idx_audit_log_rate_limit
  ON public.audit_log(admin_id, action, created_at DESC);
