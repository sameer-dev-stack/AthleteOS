-- ============================================
-- APPLY ALL MISSING MIGRATIONS
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/nkyedqekfligqhrnwkqt/sql/new
-- ============================================

-- 1. Stripe Connect columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account ON profiles(stripe_account_id);

-- 2. Admin role + suspended columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false NOT NULL;

-- 3. is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- 4. Set admin role for sameer@athleteos.app
UPDATE public.profiles SET role = 'admin' WHERE id = '83c283e5-ef8f-4c4f-a255-abc7e66f4970';

-- 5. audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON public.audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_rate_limit ON public.audit_log(admin_id, action, created_at DESC);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_log;
CREATE POLICY "Admins can insert audit logs" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_log;
CREATE POLICY "Admins can read audit logs" ON public.audit_log FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "No updates to audit logs" ON public.audit_log;
CREATE POLICY "No updates to audit logs" ON public.audit_log FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "No deletes from audit logs" ON public.audit_log;
CREATE POLICY "No deletes from audit logs" ON public.audit_log FOR DELETE TO authenticated USING (false);

-- 6. Audit log immutability triggers
CREATE OR REPLACE FUNCTION public.audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log rows are immutable';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS tg_audit_log_no_update ON public.audit_log;
CREATE TRIGGER tg_audit_log_no_update BEFORE UPDATE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();
DROP TRIGGER IF EXISTS tg_audit_log_no_delete ON public.audit_log;
CREATE TRIGGER tg_audit_log_no_delete BEFORE DELETE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

-- 7. Admin RLS on profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8. Analytics tables
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_ip_hash TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  link_label TEXT NOT NULL,
  link_url TEXT NOT NULL,
  viewer_ip_hash TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_page_views_athlete_id ON public.page_views(athlete_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_athlete_date ON public.page_views(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_athlete_id ON public.link_clicks(athlete_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_created_at ON public.link_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_clicks_athlete_date ON public.link_clicks(athlete_id, created_at DESC);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages page_views" ON public.page_views;
CREATE POLICY "Service role manages page_views" ON public.page_views FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can insert page_views" ON public.page_views;
CREATE POLICY "Anyone can insert page_views" ON public.page_views FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Athletes can read own page_views" ON public.page_views;
CREATE POLICY "Athletes can read own page_views" ON public.page_views FOR SELECT TO authenticated USING (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages link_clicks" ON public.link_clicks;
CREATE POLICY "Service role manages link_clicks" ON public.link_clicks FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can insert link_clicks" ON public.link_clicks;
CREATE POLICY "Anyone can insert link_clicks" ON public.link_clicks FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Athletes can read own link_clicks" ON public.link_clicks;
CREATE POLICY "Athletes can read own link_clicks" ON public.link_clicks FOR SELECT TO authenticated USING (athlete_id = auth.uid());

-- 9. First 500 Pro benefit columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS waitlist_position INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_profiles_waitlist_position ON profiles(waitlist_position) WHERE waitlist_position IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_pro_expires ON profiles(pro_expires_at) WHERE pro_expires_at IS NOT NULL;

-- 10. NIL Deals (Phase C Compliance OS)
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

DROP POLICY IF EXISTS "Athletes can read own deals" ON public.nil_deals;
CREATE POLICY "Athletes can read own deals" ON public.nil_deals FOR SELECT TO authenticated USING (auth.uid() = athlete_id);

DROP POLICY IF EXISTS "Athletes can insert own deals" ON public.nil_deals;
CREATE POLICY "Athletes can insert own deals" ON public.nil_deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = athlete_id);

DROP POLICY IF EXISTS "Athletes can update own deals" ON public.nil_deals;
CREATE POLICY "Athletes can update own deals" ON public.nil_deals FOR UPDATE TO authenticated USING (auth.uid() = athlete_id);

DROP POLICY IF EXISTS "Admins can read all deals" ON public.nil_deals;
CREATE POLICY "Admins can read all deals" ON public.nil_deals FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all deals" ON public.nil_deals;
CREATE POLICY "Admins can update all deals" ON public.nil_deals FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ============================================================
-- 11. Fan Memberships, Brand-Side, Teams & Moderation (Phase 7-11 migrations)
-- ============================================================

-- Moderation columns on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Tips table
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'succeeded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Membership tiers
CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fan subscriptions
CREATE TABLE IF NOT EXISTS public.fan_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES public.membership_tiers(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fan_user_id, athlete_id)
);

-- Content posts
CREATE TABLE IF NOT EXISTS public.content_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  media_url TEXT,
  is_members_only BOOLEAN DEFAULT false,
  tier_required TEXT DEFAULT 'free',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand accounts
CREATE TABLE IF NOT EXISTS public.brand_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign briefs
CREATE TABLE IF NOT EXISTS public.campaign_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brand_accounts(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sport TEXT,
  budget_min_cents INTEGER,
  budget_max_cents INTEGER,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inquiries
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_company TEXT,
  inquiry_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved athletes
CREATE TABLE IF NOT EXISTS public.saved_athletes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brand_accounts(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, athlete_id)
);

-- Team accounts
CREATE TABLE IF NOT EXISTS public.team_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school TEXT,
  sport TEXT,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logo_url TEXT,
  custom_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.team_accounts(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, athlete_id)
);

-- Team invites
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.team_accounts(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Theme picker columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_accent TEXT DEFAULT '#C6FF3D';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_layout TEXT DEFAULT 'classic';

-- Enable RLS
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on tips') THEN
    CREATE POLICY "Service role full access on tips" ON public.tips FOR ALL TO service_role USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes can read own tips') THEN
    CREATE POLICY "Athletes can read own tips" ON public.tips FOR SELECT TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes manage own tiers') THEN
    CREATE POLICY "Athletes manage own tiers" ON public.membership_tiers FOR ALL TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read active tiers') THEN
    CREATE POLICY "Public can read active tiers" ON public.membership_tiers FOR SELECT TO anon USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Fans read own subscriptions') THEN
    CREATE POLICY "Fans read own subscriptions" ON public.fan_subscriptions FOR SELECT TO authenticated USING (fan_user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes read own fan subs') THEN
    CREATE POLICY "Athletes read own fan subs" ON public.fan_subscriptions FOR SELECT TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access subs') THEN
    CREATE POLICY "Service role full access subs" ON public.fan_subscriptions FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes manage own posts') THEN
    CREATE POLICY "Athletes manage own posts" ON public.content_posts FOR ALL TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read free posts') THEN
    CREATE POLICY "Public read free posts" ON public.content_posts FOR SELECT TO anon USING (published = true AND is_members_only = false);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brands manage own account') THEN
    CREATE POLICY "Brands manage own account" ON public.brand_accounts FOR ALL TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brands manage own briefs') THEN
    CREATE POLICY "Brands manage own briefs" ON public.campaign_briefs FOR ALL TO authenticated USING (brand_id IN (SELECT id FROM public.brand_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes read own inquiries') THEN
    CREATE POLICY "Athletes read own inquiries" ON public.inquiries FOR SELECT TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role inquiries') THEN
    CREATE POLICY "Service role inquiries" ON public.inquiries FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brands manage own saved') THEN
    CREATE POLICY "Brands manage own saved" ON public.saved_athletes FOR ALL TO authenticated USING (brand_id IN (SELECT id FROM public.brand_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Team admins manage') THEN
    CREATE POLICY "Team admins manage" ON public.team_accounts FOR ALL TO authenticated USING (admin_user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Team admins manage members') THEN
    CREATE POLICY "Team admins manage members" ON public.team_members FOR ALL TO authenticated USING (team_id IN (SELECT id FROM public.team_accounts WHERE admin_user_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes read own teams') THEN
    CREATE POLICY "Athletes read own teams" ON public.team_members FOR SELECT TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Team admins manage invites') THEN
    CREATE POLICY "Team admins manage invites" ON public.team_invites FOR ALL TO authenticated USING (team_id IN (SELECT id FROM public.team_accounts WHERE admin_user_id = auth.uid()));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tips_athlete ON public.tips(athlete_id);
CREATE INDEX IF NOT EXISTS idx_tips_created_at ON public.tips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tips_athlete_created ON public.tips(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_moderation ON public.profiles(moderation_status);
CREATE INDEX IF NOT EXISTS idx_membership_tiers_athlete ON public.membership_tiers(athlete_id);
CREATE INDEX IF NOT EXISTS idx_fan_subscriptions_athlete ON public.fan_subscriptions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_fan_subscriptions_fan ON public.fan_subscriptions(fan_user_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_athlete ON public.content_posts(athlete_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_brand ON public.campaign_briefs(brand_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_athlete ON public.inquiries(athlete_id);
CREATE INDEX IF NOT EXISTS idx_saved_athletes_brand ON public.saved_athletes(brand_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_athlete ON public.team_members(athlete_id);

-- 34. Contact Info
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 35. NIL Value Engine (Phase D)
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  followers INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, platform)
);

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

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nil_value_metrics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own social accounts') THEN
    CREATE POLICY "Users can read own social accounts" ON public.social_accounts FOR SELECT TO anon, authenticated USING (auth.uid() = profile_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own social accounts') THEN
    CREATE POLICY "Users can insert own social accounts" ON public.social_accounts FOR INSERT TO anon, authenticated WITH CHECK (auth.uid() = profile_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own social accounts') THEN
    CREATE POLICY "Users can update own social accounts" ON public.social_accounts FOR UPDATE TO anon, authenticated USING (auth.uid() = profile_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own social accounts') THEN
    CREATE POLICY "Users can delete own social accounts" ON public.social_accounts FOR DELETE TO anon, authenticated USING (auth.uid() = profile_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own nil value metrics') THEN
    CREATE POLICY "Users can read own nil value metrics" ON public.nil_value_metrics FOR SELECT TO anon, authenticated USING (auth.uid() = profile_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manages nil value metrics') THEN
    CREATE POLICY "Service role manages nil value metrics" ON public.nil_value_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all metrics') THEN
    CREATE POLICY "Admins can read all metrics" ON public.nil_value_metrics FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_social_accounts_profile ON public.social_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_nil_value_metrics_profile ON public.nil_value_metrics(profile_id);
CREATE INDEX IF NOT EXISTS idx_nil_value_metrics_dates ON public.nil_value_metrics(profile_id, period_start, period_end);


-- 36. The Lock-In System (AI Memory & Behavior Events)
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

ALTER TABLE public.athlete_ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes read own memory') THEN
    CREATE POLICY "Athletes read own memory" ON public.athlete_ai_memory FOR SELECT TO authenticated USING (profile_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes insert own events') THEN
    CREATE POLICY "Athletes insert own events" ON public.ai_events FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes read own events') THEN
    CREATE POLICY "Athletes read own events" ON public.ai_events FOR SELECT TO authenticated USING (profile_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_athlete_ai_memory_profile ON public.athlete_ai_memory(profile_id);
CREATE INDEX IF NOT EXISTS idx_athlete_ai_memory_last_active ON public.athlete_ai_memory(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_profile ON public.ai_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_created_at ON public.ai_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_tool ON public.ai_events(profile_id, tool);

-- 37. AI Asset Vault
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes can read own assets') THEN
    CREATE POLICY "Athletes can read own assets" ON public.ai_saved_assets FOR SELECT TO authenticated USING (profile_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes can insert own assets') THEN
    CREATE POLICY "Athletes can insert own assets" ON public.ai_saved_assets FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes can update own assets') THEN
    CREATE POLICY "Athletes can update own assets" ON public.ai_saved_assets FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes can delete own assets') THEN
    CREATE POLICY "Athletes can delete own assets" ON public.ai_saved_assets FOR DELETE TO authenticated USING (profile_id = auth.uid());
  END IF;
END $$;

-- ============================================
-- 38. Analytics Pruning (cleanup_raw_analytics function)
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_raw_analytics()
RETURNS jsonb AS $$
DECLARE
  page_views_deleted integer;
  link_clicks_deleted integer;
  total_deleted integer;
BEGIN
  DELETE FROM public.page_views
  WHERE created_at < now() - interval '90 days';

  GET DIAGNOSTICS page_views_deleted = ROW_COUNT;

  DELETE FROM public.link_clicks
  WHERE created_at < now() - interval '90 days';

  GET DIAGNOSTICS link_clicks_deleted = ROW_COUNT;

  total_deleted := page_views_deleted + link_clicks_deleted;

  RETURN jsonb_build_object(
    'page_views_deleted', page_views_deleted,
    'link_clicks_deleted', link_clicks_deleted,
    'total_deleted', total_deleted,
    'pruned_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;


-- ============================================
-- 39. Manual Payment Method Setup
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_settings JSONB DEFAULT NULL;


