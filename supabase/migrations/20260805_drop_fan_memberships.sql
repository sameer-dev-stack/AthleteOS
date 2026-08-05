-- Drop orphaned fan-membership tables (ADR-043, 2026-08-05).
-- Fan memberships (tiers, fan subscriptions, content posts, email campaigns)
-- were removed from the product pre-MVP. No code references these tables
-- anymore; drop them so a fresh DB or schema dump stays clean.
-- Order matters: fan_subscriptions references membership_tiers (FK).
DROP TABLE IF EXISTS public.fan_subscriptions;
DROP TABLE IF EXISTS public.content_posts;
DROP TABLE IF EXISTS public.membership_tiers;
DROP TABLE IF EXISTS public.email_campaigns;
DROP TABLE IF EXISTS public.fan_subscribers;
