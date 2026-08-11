-- ============================================================
-- 20260812 Security hardening (pre-launch audit)
-- See docs/DECISIONS.md ADR-xxx "Pre-launch security hardening"
--
-- 1.  profiles     — close privilege escalation via RLS self-update
--                    (users could set role/plan/balance columns).
-- 2.  ai_usage     — close AI quota self-reset (used_count).
-- 3.  social_accounts — close self-reported verified metrics.
-- 4.  nil_deals    — status is admin/compliance-only.
-- 5.  promo_slots  — single atomic counter that enforces the 500-user
--                    launch promo cap at redemption time.
-- 6.  payouts      — at most one open request per athlete.
-- 7.  social_oauth_states — one-time nonces binding OAuth callbacks to
--                    the browser that started the flow.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES: users may edit their own row (bio, stats, ...) but
--    NEVER privileged/platform columns. Column-level REVOKE is enforced
--    by Postgres independently of RLS, so the policy's missing WITH CHECK
--    can no longer be abused. Server actions use the service role.
-- ------------------------------------------------------------
REVOKE UPDATE (
  email,
  role,
  plan,
  pro_expires_at,
  extended_pro_until,
  has_claimed_promo_trial,
  suspended,
  is_verified,
  moderation_status,
  stripe_account_id,
  stripe_subscription_id,
  stripe_onboarding_complete,
  confirmation_token,
  confirmation_token_expires,
  email_confirmed,
  waitlist_position,
  created_at
) ON public.profiles FROM anon, authenticated;

-- ------------------------------------------------------------
-- 2. AI QUOTA: quota can only move through the definer RPC below.
--    Users could previously UPDATE ai_usage.used_count → unlimited AI.
-- ------------------------------------------------------------
REVOKE INSERT, UPDATE ON public.ai_usage FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id uuid, p_period_start date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'cannot update usage for another user';
  END IF;

  INSERT INTO public.ai_usage (user_id, tool, period_start, used_count)
  VALUES (p_user_id, 'all', p_period_start, 1)
  ON CONFLICT (user_id, tool, period_start)
  DO UPDATE SET used_count = public.ai_usage.used_count + 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(uuid, date) TO authenticated;

-- ------------------------------------------------------------
-- 3. SOCIAL ACCOUNTS: metrics must come from OAuth/scrape (service role).
--    Users may only insert placeholder rows (zero followers) to start a
--    verification flow; MANUAL rows exist for platforms with no OAuth
--    (twitter/youtube/other) and are clearly not "verified".
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own social accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "Users can update own social accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "Users can delete own social accounts" ON public.social_accounts;

CREATE POLICY "Users can insert own social accounts"
  ON public.social_accounts FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    auth.uid() = profile_id
    AND (followers = 0 OR verification_status = 'MANUAL')
    AND verification_status IN ('PENDING', 'UNVERIFIED', 'MANUAL')
  );

-- ------------------------------------------------------------
-- 4. NIL DEALS: compliance status is admin-only. Athletes can keep
--    editing their own deal content, but never the status column
--    (prevents self-clearing a deal to inflate financials).
-- ------------------------------------------------------------
REVOKE UPDATE (status, id, athlete_id, created_at) ON public.nil_deals FROM authenticated;

DROP POLICY IF EXISTS "Athletes can insert own deals" ON public.nil_deals;
CREATE POLICY "Athletes can insert own deals"
  ON public.nil_deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = athlete_id AND status = 'pending');

-- ------------------------------------------------------------
-- 5. PROMO SLOTS: single-row atomic counter. The Stripe webhook claims
--    a slot with `UPDATE ... WHERE claimed < capacity` which serializes
--    on the row lock — no race can oversell the 500 launch trials.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_slots (
  id integer PRIMARY KEY CHECK (id = 1),
  capacity integer NOT NULL DEFAULT 500 CHECK (capacity > 0),
  claimed integer NOT NULL DEFAULT 0 CHECK (claimed >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages promo slots" ON public.promo_slots;
CREATE POLICY "Service role manages promo slots" ON public.promo_slots FOR ALL TO service_role USING (true);

-- Seed from any promos already claimed before this migration.
INSERT INTO public.promo_slots (id, capacity, claimed)
SELECT 1, 500, COUNT(*) FROM public.profiles WHERE has_claimed_promo_trial = TRUE
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 6. PAYOUTS: block double-withdraw races — at most one open request
--    per athlete. Existing duplicate open rows (if any) are failed first
--    so the index can be created.
-- ------------------------------------------------------------
UPDATE public.payouts p
SET status = 'failed', updated_at = now()
WHERE p.status IN ('pending', 'processing')
  AND EXISTS (
    SELECT 1 FROM public.payouts newer
    WHERE newer.athlete_id = p.athlete_id
      AND newer.status IN ('pending', 'processing')
      AND (newer.created_at > p.created_at OR (newer.created_at = p.created_at AND newer.id > p.id))
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_payouts_one_open_per_athlete
  ON public.payouts (athlete_id) WHERE status IN ('pending', 'processing');

-- ------------------------------------------------------------
-- 7. SOCIAL OAUTH STATES: one-time nonce store. The connect routes
--    insert {state, profile_id, platform}, set an httpOnly cookie, and
--    the callback verifies nonce + cookie + expiry before writing the
--    account. Prevents hijacking another athlete's social_accounts row.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_oauth_states (
  state uuid PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_oauth_states_created ON public.social_oauth_states (created_at);

ALTER TABLE public.social_oauth_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages oauth states" ON public.social_oauth_states;
CREATE POLICY "Service role manages oauth states" ON public.social_oauth_states FOR ALL TO service_role USING (true);