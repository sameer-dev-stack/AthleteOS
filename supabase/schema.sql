-- AthleteOS Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nkyedqekfligqhrnwkqt/sql
-- Last regenerated: 2026-06-17

-- ============================================================
-- TABLES
-- ============================================================

-- Waitlist emails
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'landing',
  confirmed BOOLEAN DEFAULT false,
  confirmation_token TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Athlete fields (Phase 2)
  username TEXT UNIQUE,
  sport TEXT,
  school TEXT,
  class_year TEXT,
  position TEXT,
  bio TEXT,
  stats JSONB DEFAULT '[]'::jsonb,
  links JSONB DEFAULT '[]'::jsonb,
  social JSONB DEFAULT '{}'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb,
  is_verified BOOLEAN DEFAULT false,
  profile_published BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,

  -- Referrals (migration 20260706_referrals.sql)
  referred_by TEXT DEFAULT NULL,
  extended_pro_until TIMESTAMPTZ,

  -- Subscription tier (Phase 6)
  plan TEXT DEFAULT 'free',
  stripe_subscription_id TEXT,

  -- Stripe Connect (Phase 4)
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,

  -- Admin (Phase 7)
  role TEXT DEFAULT 'user' NOT NULL,
  suspended BOOLEAN DEFAULT false NOT NULL,

  -- First 500 Pro benefit
  waitlist_position INTEGER,
  pro_expires_at TIMESTAMPTZ,

  -- Email confirmation
  email_confirmed BOOLEAN DEFAULT false,
  confirmation_token TEXT,
  confirmation_token_expires TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY KEY,
  key TEXT NOT NULL,
  count INT DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW()
);

-- AI usage tracking (Phase 5)
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  used_count INT DEFAULT 0,
  period_start DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, tool, period_start)
);

-- Analytics: page views (Phase 8)
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_ip_hash TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Analytics: link clicks (Phase 8)
CREATE TABLE IF NOT EXISTS link_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  link_label TEXT NOT NULL,
  link_url TEXT NOT NULL,
  viewer_ip_hash TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Admin audit log (Phase 7)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Referral codes (one per user)
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  code_used TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_days INTEGER DEFAULT 7 NOT NULL,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin role check (hardened search_path)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Audit log immutability trigger function
CREATE OR REPLACE FUNCTION public.audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log rows are immutable -- updates and deletes are not permitted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Raw log retention helper for future scheduled cleanup
CREATE OR REPLACE FUNCTION public.cleanup_raw_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM public.page_views WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.link_clicks WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Audit log immutability triggers
DROP TRIGGER IF EXISTS tg_audit_log_no_update ON audit_log;
CREATE TRIGGER tg_audit_log_no_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

DROP TRIGGER IF EXISTS tg_audit_log_no_delete ON audit_log;
CREATE TRIGGER tg_audit_log_no_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter(email);
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_sub ON profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account ON profiles(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_profiles_waitlist_position ON profiles(waitlist_position) WHERE waitlist_position IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_pro_expires ON profiles(pro_expires_at) WHERE pro_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_athlete_id ON page_views(athlete_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_athlete_date ON page_views(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_athlete_id ON link_clicks(athlete_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_created_at ON link_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_athlete_date ON link_clicks(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_rate_limit ON audit_log(admin_id, action, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Waitlist: no public read policies — all reads go through service role

-- Newsletter: no public read policies — all reads go through service role

-- Rate limits: no public read policies — all reads go through service role

-- Profiles: athletes can read/update their own profile
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

-- Profiles: public read access for published profiles (used by public card page)
CREATE POLICY "Public can read published profiles"
  ON profiles FOR SELECT
  TO anon
  USING (profile_published = true);

-- Profiles: admin access
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- AI usage: users can read/update own usage
CREATE POLICY "Users can read own usage"
  ON ai_usage FOR SELECT
  TO anon
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own usage"
  ON ai_usage FOR INSERT
  TO anon
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON ai_usage FOR UPDATE
  TO anon
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON ai_usage FOR ALL
  TO service_role
  USING (true);

-- Analytics: page views
DROP POLICY IF EXISTS "Service role manages page_views" ON page_views;
CREATE POLICY "Service role manages page_views"
  ON page_views FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert page_views" ON page_views;
CREATE POLICY "Anyone can insert page_views"
  ON page_views FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Athletes can read own page_views" ON page_views;
CREATE POLICY "Athletes can read own page_views"
  ON page_views FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

-- Analytics: link clicks
DROP POLICY IF EXISTS "Service role manages link_clicks" ON link_clicks;
CREATE POLICY "Service role manages link_clicks"
  ON link_clicks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert link_clicks" ON link_clicks;
CREATE POLICY "Anyone can insert link_clicks"
  ON link_clicks FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Athletes can read own link_clicks" ON link_clicks;
CREATE POLICY "Athletes can read own link_clicks"
  ON link_clicks FOR SELECT
  TO authenticated
  USING (athlete_id = auth.uid());

-- Audit log: admin access + immutability
CREATE POLICY "Admins can insert audit logs"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can read audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "No updates to audit logs" ON audit_log;
CREATE POLICY "No updates to audit logs"
  ON audit_log FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "No deletes from audit logs" ON audit_log;
CREATE POLICY "No deletes from audit logs"
  ON audit_log FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================
-- NIL DEALS (PHASE C COMPLIANCE OS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.nil_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  deal_value INTEGER NOT NULL, -- value in cents
  compensation_type TEXT NOT NULL, -- cash, product, equity, licensing
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, cleared, rejected
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nil_deals_athlete_id ON public.nil_deals(athlete_id);
CREATE INDEX IF NOT EXISTS idx_nil_deals_status ON public.nil_deals(status);
CREATE INDEX IF NOT EXISTS idx_nil_deals_created_at ON public.nil_deals(created_at DESC);

ALTER TABLE public.nil_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can read own deals"
  ON public.nil_deals FOR SELECT
  TO authenticated
  USING (auth.uid() = athlete_id);

CREATE POLICY "Athletes can insert own deals"
  ON public.nil_deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY "Athletes can update own deals"
  ON public.nil_deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = athlete_id);

CREATE POLICY "Admins can read all deals"
  ON public.nil_deals FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all deals"
  ON public.nil_deals FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- NIL VALUE ENGINE (PHASE D)
-- ============================================================

-- 1. Social accounts table
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'twitter', 'youtube', 'other'
  handle TEXT NOT NULL,
  followers INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, platform)
);

-- 2. NIL value metrics table
CREATE TABLE IF NOT EXISTS public.nil_value_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  card_views INTEGER NOT NULL DEFAULT 0,
  link_clicks INTEGER NOT NULL DEFAULT 0,
  click_through_rate NUMERIC NOT NULL DEFAULT 0,
  tips_amount NUMERIC NOT NULL DEFAULT 0,
  tips_count INTEGER NOT NULL DEFAULT 0,
  followers_total INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC NOT NULL DEFAULT 0,
  nil_score INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nil_value_metrics ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Users can read own social accounts"
  ON public.social_accounts FOR SELECT
  TO anon, authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own social accounts"
  ON public.social_accounts FOR INSERT
  TO anon, authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own social accounts"
  ON public.social_accounts FOR UPDATE
  TO anon, authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own social accounts"
  ON public.social_accounts FOR DELETE
  TO anon, authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can read own nil value metrics"
  ON public.nil_value_metrics FOR SELECT
  TO anon, authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Service role manages nil value metrics"
  ON public.nil_value_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can read all metrics"
  ON public.nil_value_metrics FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_profile ON public.social_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_nil_value_metrics_profile ON public.nil_value_metrics(profile_id);
CREATE INDEX IF NOT EXISTS idx_nil_value_metrics_dates ON public.nil_value_metrics(profile_id, period_start, period_end);


-- ============================================================
-- THE LOCK-IN SYSTEM (AI MEMORY & BEHAVIOR EVENTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.athlete_ai_memory (
  profile_id              UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  preferred_tone          TEXT DEFAULT 'confident',
  preferred_output_length TEXT DEFAULT 'medium',
  preferred_brand_categories TEXT[] DEFAULT '{}',
  last_used_tool          TEXT,
  tools_used_count        JSONB DEFAULT '{}'::jsonb,
  outputs_saved_count     INTEGER DEFAULT 0,
  outputs_regenerated_count INTEGER DEFAULT 0,
  outputs_ignored_count   INTEGER DEFAULT 0,
  last_active_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_events (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tool          TEXT NOT NULL,
  action        TEXT NOT NULL,
  tone_used     TEXT,
  output_length TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.athlete_ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Athletes read own memory"
  ON public.athlete_ai_memory FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Athletes insert own events"
  ON public.ai_events FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Athletes read own events"
  ON public.ai_events FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_athlete_ai_memory_profile ON public.athlete_ai_memory(profile_id);
CREATE INDEX IF NOT EXISTS idx_athlete_ai_memory_last_active ON public.athlete_ai_memory(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_profile ON public.ai_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_created_at ON public.ai_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_tool ON public.ai_events(profile_id, tool);

-- ============================================================
-- AI ASSET VAULT (SAVED AI OUTPUTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_saved_assets (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tool_type     TEXT NOT NULL CHECK (tool_type IN ('bio', 'captions', 'pitch', 'optimize', 'rate')),
  content       TEXT NOT NULL,
  is_starred    BOOLEAN DEFAULT false NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_saved_assets_profile ON public.ai_saved_assets(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_saved_assets_tool ON public.ai_saved_assets(profile_id, tool_type);
CREATE INDEX IF NOT EXISTS idx_ai_saved_assets_starred ON public.ai_saved_assets(profile_id, is_starred) WHERE is_starred = true;

ALTER TABLE public.ai_saved_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can read own assets"
  ON public.ai_saved_assets FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Athletes can insert own assets"
  ON public.ai_saved_assets FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Athletes can update own assets"
  ON public.ai_saved_assets FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Athletes can delete own assets"
  ON public.ai_saved_assets FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

