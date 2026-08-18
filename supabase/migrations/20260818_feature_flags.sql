-- 20260818_feature_flags.sql
-- Persist feature flags in DB instead of in-memory mock

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write feature flags
CREATE POLICY "Admins can read feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE email = ANY(ARRAY['sameer@athleteos.app', 'admin@royalclass.com', 'bdzone010@gmail.com', 'Admin@nilcard.app']))
  );

CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE email = ANY(ARRAY['sameer@athleteos.app', 'admin@royalclass.com', 'bdzone010@gmail.com', 'Admin@nilcard.app']))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE email = ANY(ARRAY['sameer@athleteos.app', 'admin@royalclass.com', 'bdzone010@gmail.com', 'Admin@nilcard.app']))
  );

-- Seed default flags (only if table is empty)
INSERT INTO public.feature_flags (flag_name, enabled, description) VALUES
  ('onboarding_active', true, 'Allows new athlete accounts to claim usernames and onboard.'),
  ('ai_limitations_enabled', true, 'Enforces monthly generation quotas per tier (Free/Pro).'),
  ('automatic_compliance_review', false, 'Enables AI to auto-screen deals before human compliance audit.'),
  ('platform_tipping_enabled', true, 'Allows public card profiles to display the Stripe TIP support modal.'),
  ('payout_instant_withdrawals', false, 'Enables instant debit payouts to connected bank debit cards.')
ON CONFLICT (flag_name) DO NOTHING;
