-- Migration: NIL Value Engine Apify Extension
-- Adds engagement columns, scrape tracking, verification status, and trend delta columns.

-- 1. Extend social_accounts table
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS engagement_rate NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS average_likes NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS average_comments NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS average_views NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS average_shares NUMERIC NOT NULL DEFAULT 0;
-- Total raw engagements per scrape window (used for true cross-platform ER)
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS total_engagements NUMERIC NOT NULL DEFAULT 0;
-- Tracks when the last successful Apify scrape ran (used by cron to gate polling frequency)
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ DEFAULT NULL;
-- Tracks async verification state: NULL | PENDING | VERIFIED | PRIVATE_ACCOUNT | ERROR
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT NULL;

-- 2. Extend nil_value_metrics table
ALTER TABLE public.nil_value_metrics ADD COLUMN IF NOT EXISTS follower_delta_percent NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.nil_value_metrics ADD COLUMN IF NOT EXISTS engagement_delta_percent NUMERIC NOT NULL DEFAULT 0;
