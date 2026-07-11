-- AthleteOS Phase 7-11 Complete Migration
-- Run in Supabase SQL Editor

-- ============================================================
-- PHASE 7: Admin additions
-- ============================================================

-- Moderation columns on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Tips table
CREATE TABLE IF NOT EXISTS tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sender_email TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PHASE 9: Fan Memberships
-- ============================================================

CREATE TABLE IF NOT EXISTS membership_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fan_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES membership_tiers(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fan_user_id, athlete_id)
);

CREATE TABLE IF NOT EXISTS content_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  media_url TEXT,
  is_members_only BOOLEAN DEFAULT false,
  tier_required TEXT DEFAULT 'free',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PHASE 10: Brand-Side Tools
-- ============================================================

CREATE TABLE IF NOT EXISTS brand_accounts (
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

CREATE TABLE IF NOT EXISTS campaign_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brand_accounts(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sport TEXT,
  budget_min_cents INTEGER,
  budget_max_cents INTEGER,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_company TEXT,
  inquiry_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_athletes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brand_accounts(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, athlete_id)
);

-- ============================================================
-- PHASE 11: Team Tier
-- ============================================================

CREATE TABLE IF NOT EXISTS team_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school TEXT,
  sport TEXT,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logo_url TEXT,
  custom_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES team_accounts(id) ON DELETE CASCADE NOT NULL,
  athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, athlete_id)
);

CREATE TABLE IF NOT EXISTS team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES team_accounts(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- ============================================================
-- THEME PICKER
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_accent TEXT DEFAULT '#C6FF3D';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_layout TEXT DEFAULT 'classic';

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Tips
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on tips') THEN
    CREATE POLICY "Service role full access on tips" ON tips FOR ALL TO service_role USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes can read own tips') THEN
    CREATE POLICY "Athletes can read own tips" ON tips FOR SELECT TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;

-- Membership tiers
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes manage own tiers') THEN
    CREATE POLICY "Athletes manage own tiers" ON membership_tiers FOR ALL TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read active tiers') THEN
    CREATE POLICY "Public can read active tiers" ON membership_tiers FOR SELECT TO anon USING (is_active = true);
  END IF;
END $$;

-- Fan subscriptions
ALTER TABLE fan_subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Fans read own subscriptions') THEN
    CREATE POLICY "Fans read own subscriptions" ON fan_subscriptions FOR SELECT TO authenticated USING (fan_user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes read own fan subs') THEN
    CREATE POLICY "Athletes read own fan subs" ON fan_subscriptions FOR SELECT TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access subs') THEN
    CREATE POLICY "Service role full access subs" ON fan_subscriptions FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- Content posts
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes manage own posts') THEN
    CREATE POLICY "Athletes manage own posts" ON content_posts FOR ALL TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read free posts') THEN
    CREATE POLICY "Public read free posts" ON content_posts FOR SELECT TO anon USING (published = true AND is_members_only = false);
  END IF;
END $$;

-- Brand accounts
ALTER TABLE brand_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brands manage own account') THEN
    CREATE POLICY "Brands manage own account" ON brand_accounts FOR ALL TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Campaign briefs
ALTER TABLE campaign_briefs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brands manage own briefs') THEN
    CREATE POLICY "Brands manage own briefs" ON campaign_briefs FOR ALL TO authenticated USING (brand_id IN (SELECT id FROM brand_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Inquiries
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes read own inquiries') THEN
    CREATE POLICY "Athletes read own inquiries" ON inquiries FOR SELECT TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role inquiries') THEN
    CREATE POLICY "Service role inquiries" ON inquiries FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- Saved athletes
ALTER TABLE saved_athletes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Brands manage own saved') THEN
    CREATE POLICY "Brands manage own saved" ON saved_athletes FOR ALL TO authenticated USING (brand_id IN (SELECT id FROM brand_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Team accounts
ALTER TABLE team_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Team admins manage') THEN
    CREATE POLICY "Team admins manage" ON team_accounts FOR ALL TO authenticated USING (admin_user_id = auth.uid());
  END IF;
END $$;

-- Team members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Team admins manage members') THEN
    CREATE POLICY "Team admins manage members" ON team_members FOR ALL TO authenticated USING (team_id IN (SELECT id FROM team_accounts WHERE admin_user_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Athletes read own teams') THEN
    CREATE POLICY "Athletes read own teams" ON team_members FOR SELECT TO authenticated USING (athlete_id = auth.uid());
  END IF;
END $$;

-- Team invites
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Team admins manage invites') THEN
    CREATE POLICY "Team admins manage invites" ON team_invites FOR ALL TO authenticated USING (team_id IN (SELECT id FROM team_accounts WHERE admin_user_id = auth.uid()));
  END IF;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tips_athlete ON tips(athlete_id);
CREATE INDEX IF NOT EXISTS idx_profiles_moderation ON profiles(moderation_status);
CREATE INDEX IF NOT EXISTS idx_membership_tiers_athlete ON membership_tiers(athlete_id);
CREATE INDEX IF NOT EXISTS idx_fan_subscriptions_athlete ON fan_subscriptions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_fan_subscriptions_fan ON fan_subscriptions(fan_user_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_athlete ON content_posts(athlete_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_brand ON campaign_briefs(brand_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_athlete ON inquiries(athlete_id);
CREATE INDEX IF NOT EXISTS idx_saved_athletes_brand ON saved_athletes(brand_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_athlete ON team_members(athlete_id);
