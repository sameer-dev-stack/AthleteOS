CREATE TABLE IF NOT EXISTS referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  code_used text NOT NULL,
  status text NOT NULL DEFAULT pending,
  reward_days integer NOT NULL DEFAULT 7,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS athlete_ai_memory (
  profile_id uuid NOT NULL,
  preferred_tone text DEFAULT confident,
  preferred_output_length text DEFAULT medium,
  preferred_brand_categories jsonb,
  last_used_tool text,
  tools_used_count text,
  outputs_saved_count integer,
  outputs_regenerated_count integer,
  outputs_ignored_count integer,
  last_active_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  amount integer NOT NULL,
  stripe_payout_id text,
  status text NOT NULL DEFAULT pending,
  arrival_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  payout_method text,
  payout_destination text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  subscribed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  referrer_id uuid NOT NULL,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  viewer_ip_hash text NOT NULL,
  referrer text,
  user_agent text,
  country text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  metadata text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  username text,
  sport text,
  school text,
  class_year text,
  position text,
  bio text,
  stats text,
  links text,
  social text,
  highlights text,
  is_verified boolean,
  profile_published boolean,
  onboarding_completed boolean,
  updated_at timestamptz DEFAULT now(),
  plan text DEFAULT free,
  stripe_subscription_id text,
  stripe_customer_id text,
  subscription_status text,
  subscription_current_period_end timestamptz,
  email_confirmed boolean NOT NULL,
  confirmation_token text,
  confirmation_token_expires timestamptz,
  stripe_account_id text,
  stripe_onboarding_complete boolean,
  role text NOT NULL DEFAULT user,
  suspended boolean NOT NULL,
  waitlist_position integer,
  pro_expires_at timestamptz,
  theme_accent text DEFAULT #C6FF3D,
  theme_layout text DEFAULT classic,
  moderation_status text DEFAULT approved,
  moderation_notes text,
  contact_phone text,
  contact_email text,
  payout_method text,
  payout_settings text,
  email_preferences text,
  cover_url text,
  referred_by text,
  extended_pro_until timestamptz
);

CREATE TABLE IF NOT EXISTS nil_value_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  card_views integer NOT NULL,
  link_clicks integer NOT NULL,
  click_through_rate numeric NOT NULL,
  tips_amount numeric NOT NULL,
  tips_count integer NOT NULL,
  followers_total integer NOT NULL,
  engagement_rate numeric NOT NULL,
  nil_score integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  tool text NOT NULL,
  action text NOT NULL,
  tone_used text,
  output_length text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  platform text NOT NULL,
  handle text NOT NULL,
  followers integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  verification_status text DEFAULT UNVERIFIED
);

CREATE TABLE IF NOT EXISTS inquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  sender_company text,
  inquiry_type text NOT NULL,
  message text NOT NULL,
  status text DEFAULT new,
  created_at timestamptz DEFAULT now(),
  deal_value numeric,
  won_at timestamptz
);

CREATE TABLE IF NOT EXISTS team_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  email text NOT NULL,
  status text DEFAULT pending,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

CREATE TABLE IF NOT EXISTS brand_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  industry text,
  website text,
  logo_url text,
  description text,
  is_verified boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS link_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  link_label text NOT NULL,
  link_url text NOT NULL,
  viewer_ip_hash text NOT NULL,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_athletes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text DEFAULT landing,
  confirmed boolean,
  joined_at timestamptz DEFAULT now(),
  confirmation_token text
);

CREATE TABLE IF NOT EXISTS tips (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  amount integer NOT NULL,
  platform_fee integer NOT NULL,
  net_amount integer NOT NULL,
  sender_name text,
  sender_email text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT succeeded,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_facts (
  profile_id uuid NOT NULL,
  brand_voice text,
  preferred_tone text NOT NULL DEFAULT confident,
  min_deal_value numeric,
  deal_preferences text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  school text,
  sport text,
  admin_user_id uuid NOT NULL,
  logo_url text,
  custom_domain text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool text NOT NULL DEFAULT all,
  used_count integer NOT NULL,
  period_start date NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_briefs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  sport text,
  budget_min_cents integer,
  budget_max_cents integer,
  deadline timestamptz,
  status text DEFAULT open,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  is_active boolean NOT NULL DEFAULT True,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  role text DEFAULT member,
  joined_at timestamptz DEFAULT now()
);

