-- Drop orphaned fan-membership tables (ADR-043, 2026-08-05).
-- Fan memberships (tiers, fan subscriptions, content posts, email campaigns)
-- were removed from the product pre-MVP. No code references these tables
-- anymore; drop them so a fresh DB or schema dump stays clean.
-- Order matters: fan_subscriptions references membership_tiers (FK).
-- CASCADE is safe here: the only dependents are same-cluster orphan tables
-- and their RLS policies (e.g. "Fans read subscribed content" on content_posts
-- references fan_subscriptions), all of which are removed together.
DROP TABLE IF EXISTS public.fan_subscriptions CASCADE;
DROP TABLE IF EXISTS public.content_posts CASCADE;
DROP TABLE IF EXISTS public.membership_tiers CASCADE;
DROP TABLE IF EXISTS public.email_campaigns CASCADE;
DROP TABLE IF EXISTS public.fan_subscribers CASCADE;
