-- Migration: Social OAuth connections
-- Adds OAuth support for Instagram and TikTok

ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS is_connected BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS platform_user_id TEXT;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS profile_url TEXT;

-- Ensure followers can be null (auto-fetched on connect)
ALTER TABLE public.social_accounts ALTER COLUMN followers DROP NOT NULL;
ALTER TABLE public.social_accounts ALTER COLUMN followers SET DEFAULT 0;
