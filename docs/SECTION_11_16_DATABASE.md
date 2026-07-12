# AthleteOS — Database Documentation & Security Review

> Derived strictly from `supabase/schema.sql`, `supabase/APPLY_MIGRATIONS.sql`, and all 37 files under `supabase/migrations/`.
> Confidence legend: **High** = fully defined & consistent across schema + migration; **Medium** = defined in migrations only / minor ambiguity; **Low** = referenced in code but **no migration and no schema definition exists**.

---

## SECTION 11 — Database Documentation

### 11.0 Effective-schema caveats (READ FIRST)

- `schema.sql` header says *"Last regenerated: 2026-06-17"* but the file actually contains tables created as late as 2026-07-11 (`referral_codes`, `referrals`, `nil_deals`, `social_accounts`, `nil_value_metrics`, `athlete_ai_memory`, `ai_events`, `ai_saved_assets`). **The header date is stale**, and the file is still **incomplete** (see 11.1 Missing-from-schema.sql).
- `APPLY_MIGRATIONS.sql` is also **incomplete** — it does not contain `scheduled_posts`, `profile_events`, `weekly_snapshots`, `milestones`, `payouts`, `athlete_knowledge`, `nil_score_history`, nor the 7 code-referenced tables that have no migration at all.
- Migrations are assumed applied in filename (date) order. Several `CREATE TABLE IF NOT EXISTS` statements are repeated across files; the first physical creation wins and later ones are no-ops.
- **No native Postgres `ENUM` types are used.** All enumerated values are enforced via `TEXT` + `CHECK` constraints (or comments only). They are listed per-table below.

### 11.1 Tables referenced in code but MISSING from `schema.sql` (FLAG — High priority)

| Table | Where used in code | In a migration? | Confidence | Notes |
|---|---|---|---|---|
| `tips` | `lib/actions/tips.ts`, `balance.ts`, `admin.ts`, `gdpr.ts`, webhook | Yes (20260617, 20260620, APPLY) | High (exists) but **absent from schema.sql** | Defined only in migrations. schema.sql omits it entirely. |
| `fan_subscriptions` | `lib/actions/memberships.ts`, `teams.ts`, webhook | Yes (20260620, APPLY) | High (exists) but **absent from schema.sql** | |
| `membership_tiers` | `lib/actions/memberships.ts`, `memberships-client.ts` | Yes (20260620, APPLY) | High (exists) but **absent from schema.sql** | |
| `payouts` | `lib/actions/balance.ts`, webhook | Yes (20260702_payouts) | High (exists) but **absent from schema.sql** | |
| `team_members` (`teams`) | `lib/actions/teams.ts` | Yes (20260620, APPLY) | High (exists) but **absent from schema.sql** | |
| `team_accounts` (`teams`) | `lib/actions/teams.ts` | Yes (20260620, APPLY) | High (exists) but **absent from schema.sql** | |
| `inquiries` | `lib/actions/inquiries.ts`, `analytics.ts`, `gdpr.ts` | Yes (20260620, APPLY) | High (exists) but **absent from schema.sql** | |
| `milestones` | `lib/actions/milestones.ts` | Yes (20260702_data_moat) | High (exists) but **absent from schema.sql** | |
| `athlete_knowledge` | `lib/actions/athlete-knowledge.ts` | Yes (20260704) | High (exists) but **absent from schema.sql** | |
| `campaign_briefs` (`campaigns`) | `lib/actions/brand.ts` | Yes (20260620, APPLY) | High (exists) but **absent from schema.sql** | NOTE: code also references a separate `email_campaigns` table (see below). |
| `email_preferences` | (task list) | **Not a table** — it is a **column** on `profiles` (`email_preferences JSONB`) added by `20260705_email_preferences.sql` | n/a | Flag: `email_preferences` is a column, not a standalone table. |
| `email_campaigns` | `lib/actions/campaigns.ts` (lines 70,103,127,150,207) | **NO — no migration, not in schema.sql** | **Low — MISSING** | Code inserts/selects/updates `email_campaigns` (athlete_id, name, subject, body_html, recipient_count, sent_count, open_count, click_count, status, scheduled_at, sent_at). Will fail at runtime against a DB built from migrations. |
| `fan_subscribers` | `lib/actions/campaigns.ts` (line 140) | **NO — no migration, not in schema.sql** | **Low — MISSING** | Code selects `email` where athlete_id + confirmed. No DDL anywhere. |
| `team_messages` | `lib/actions/teams.ts` (lines 729,768) | **NO — no migration, not in schema.sql** | **Low — MISSING** | Referenced for team chat. No DDL. |
| `team_content` | `lib/actions/teams.ts` (lines 831,872,889,907) | **NO — no migration, not in schema.sql** | **Low — MISSING** | No DDL. |
| `team_tasks` | `lib/actions/teams.ts` (lines 976,1017,1035,1076,1094) | **NO — no migration, not in schema.sql** | **Low — MISSING** | No DDL. |
| `team_events` | `lib/actions/teams.ts` (lines 1160,1201,1218,1236) | **NO — no migration, not in schema.sql** | **Low — MISSING** | No DDL. |
| `team_announcements` | `lib/actions/teams.ts` (lines 1284,1323,1340,1358) | **NO — no migration, not in schema.sql** | **Low — MISSING** | No DDL. |

> **Bottom line:** `schema.sql` is stale/partial. 9 tables that the task expected to find in schema.sql are in fact only in migrations (not in schema.sql). 7 further tables are used by the app but have **no migration and no schema definition at all** and will raise "relation does not exist" errors in production.

---

### 11.2 Table-by-table reference

#### `profiles` — core user record (extends `auth.users`)
- **PK:** `id` UUID → `auth.users(id)` ON DELETE CASCADE
- **Columns:** `email TEXT NOT NULL`, `full_name TEXT`, `avatar_url TEXT`, `username TEXT UNIQUE`, `sport TEXT`, `school TEXT`, `class_year TEXT`, `position TEXT`, `bio TEXT`, `stats JSONB DEFAULT '[]'`, `links JSONB DEFAULT '[]'`, `social JSONB DEFAULT '{}'`, `highlights JSONB DEFAULT '[]'`, `is_verified BOOLEAN DEFAULT false`, `profile_published BOOLEAN DEFAULT false`, `onboarding_completed BOOLEAN DEFAULT false`, `referred_by TEXT`, `extended_pro_until TIMESTAMPTZ`, `plan TEXT DEFAULT 'free'`, `stripe_subscription_id TEXT`, `stripe_account_id TEXT`, `stripe_onboarding_complete BOOLEAN DEFAULT false`, `role TEXT DEFAULT 'user' NOT NULL`, `suspended BOOLEAN DEFAULT false NOT NULL`, `waitlist_position INTEGER`, `pro_expires_at TIMESTAMPTZ`, `email_confirmed BOOLEAN DEFAULT false`, `confirmation_token TEXT`, `confirmation_token_expires TIMESTAMPTZ`, `moderation_status TEXT DEFAULT 'approved'`, `moderation_notes TEXT`, `theme_accent TEXT DEFAULT '#C6FF3D'`, `theme_layout TEXT DEFAULT 'classic'`, `contact_phone TEXT`, `contact_email TEXT`, `payout_method TEXT`, `payout_settings JSONB`, `last_digest_sent_at TIMESTAMPTZ`, `cover_url TEXT`, `email_preferences JSONB DEFAULT '{"welcome":true,"published":true,"inquiry":true,"weekly":true}'`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
- **Constraints:** `username UNIQUE`; `role IN` implicitly enforced via app only (no CHECK); `moderation_status` no CHECK.
- **Indexes:** `idx_profiles_username`, `idx_profiles_plan`, `idx_profiles_stripe_sub`, `idx_profiles_stripe_account`, `idx_profiles_waitlist_position` (partial), `idx_profiles_pro_expires` (partial), `idx_profiles_moderation`, `idx_profiles_referred_by` (partial), `idx_profiles_confirmation_token` (partial), `idx_profiles_last_digest`.
- **RLS:** Enabled. Policies: *Users read own* (SELECT anon,authenticated USING id=auth.uid()), *Users insert own* (INSERT WITH CHECK), *Users update own* (UPDATE), *Public read published profiles* (SELECT anon USING profile_published=true), *Admins read all* (SELECT authenticated USING is_admin()), *Admins update all* (UPDATE WITH CHECK is_admin()).
- **Confidence:** High.

#### `waitlist`
- **PK:** `id` UUID default `gen_random_uuid()`. **Columns:** `email TEXT UNIQUE NOT NULL`, `source TEXT DEFAULT 'landing'`, `confirmed BOOLEAN DEFAULT false`, `confirmation_token TEXT`, `joined_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_waitlist_email`. **RLS:** Enabled, **no policies** (reads only via service_role). **Confidence:** High.

#### `newsletter`
- **PK:** `id` UUID. **Columns:** `email TEXT UNIQUE NOT NULL`, `subscribed_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_newsletter_email`. **RLS:** Enabled, no policies. **Confidence:** High.

#### `rate_limits`  ⚠️ BUG
- **PK:** `id UUID DEFAULT gen_random_uuid() PRIMARY KEY KEY` — **line 79 of schema.sql has a duplicate `KEY` keyword (syntax error; the statement will not execute).** `migrations/` do not create this table; it exists only in schema.sql.
- **Columns:** `key TEXT NOT NULL`, `count INT DEFAULT 1`, `window_start TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_rate_limits_key`, `idx_rate_limits_window`. **RLS:** Enabled, **no policies defined** → with RLS on and no policy, all non-service_role access is denied. App rate-limiter (`lib/storage.ts`) must use the service role. **Confidence:** High (but DDL is broken in schema.sql).

#### `ai_usage`
- **PK:** `id` UUID. **Columns:** `user_id UUID → auth.users ON DELETE CASCADE`, `tool TEXT NOT NULL`, `used_count INT DEFAULT 0`, `period_start DATE DEFAULT CURRENT_DATE`.
- **Unique:** `(user_id, tool, period_start)`. **Indexes:** `idx_ai_usage_user`. **RLS:** Enabled. Policies: read/upsert/update own (anon USING/WITH CHECK user_id=auth.uid()), service_role full. **Confidence:** High.

#### `page_views`  ⚠️ anon-insertable (see §16)
- **PK:** `id` UUID. **FK:** `athlete_id UUID → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `viewer_ip_hash TEXT NOT NULL`, `referrer TEXT`, `user_agent TEXT`, `country TEXT`, `city TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL`.
- **Indexes:** `idx_page_views_athlete_id`, `idx_page_views_created_at DESC`, `idx_page_views_athlete_date`.
- **RLS:** Enabled. Policies: *Service role manages* (ALL), *Anyone can insert* (**INSERT TO anon WITH CHECK true** — unauthenticated, unvalidated), *Athletes read own* (SELECT athlete_id=auth.uid()). **Confidence:** High.

#### `link_clicks`  ⚠️ anon-insertable (see §16)
- **PK:** `id` UUID. **FK:** `athlete_id UUID → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `link_label TEXT NOT NULL`, `link_url TEXT NOT NULL`, `viewer_ip_hash TEXT NOT NULL`, `referrer TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL`.
- **Indexes:** `idx_link_clicks_athlete_id`, `idx_link_clicks_created_at DESC`, `idx_link_clicks_athlete_date`.
- **RLS:** same shape as page_views — *Anyone can insert* TO anon WITH CHECK true. **Confidence:** High.

#### `audit_log`
- **PK:** `id` UUID. **FK:** `admin_id UUID → auth.users ON DELETE SET NULL`. **Columns:** `action TEXT NOT NULL`, `target_type TEXT NOT NULL`, `target_id TEXT`, `metadata JSONB DEFAULT '{}' NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL`.
- **Indexes:** `idx_audit_log_admin_id`, `idx_audit_log_created_at DESC`, `idx_audit_log_rate_limit (admin_id, action, created_at DESC)`.
- **RLS:** Enabled. Policies: *Admins insert/read* (USING is_admin()), *No updates* (USING false WITH CHECK false), *No deletes* (USING false). **Plus immutability triggers** `tg_audit_log_no_update`/`tg_audit_log_no_delete` raise exceptions even for service_role. **Confidence:** High (hardened).

#### `referral_codes`
- **PK:** `id` UUID. **FK:** `user_id UUID → profiles(id) ON DELETE CASCADE UNIQUE NOT NULL`. **Columns:** `code TEXT UNIQUE NOT NULL`, `is_active BOOLEAN DEFAULT true NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL`.
- **Indexes:** `idx_referral_codes_code`, `idx_referral_codes_user`. **RLS:** Enabled, *Users view own* (SELECT USING user_id=auth.uid()). **Confidence:** High.

#### `referrals`
- **PK:** `id` UUID. **FK:** `referrer_id → profiles(id) ON DELETE CASCADE NOT NULL`, `referred_id → profiles(id) ON DELETE CASCADE UNIQUE NOT NULL`. **Columns:** `code_used TEXT NOT NULL`, `status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending','completed','rewarded'))`, `reward_days INTEGER DEFAULT 7 NOT NULL`, `rewarded_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL`.
- **Indexes:** `idx_referrals_referrer`, `idx_referrals_referred`. **RLS:** Enabled, *Users view own referrals* (SELECT USING referrer_id=auth.uid()). **Confidence:** High.

#### `nil_deals`
- **PK:** `id` UUID. **FK:** `athlete_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `company_name TEXT NOT NULL`, `deal_value INTEGER NOT NULL` (cents), `compensation_type TEXT NOT NULL` (comment: cash/product/equity/licensing — **no CHECK**), `description TEXT`, `start_date DATE NOT NULL`, `end_date DATE`, `status TEXT DEFAULT 'pending' NOT NULL` (pending/cleared/rejected), `document_url TEXT`, `created_at`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_nil_deals_athlete_id`, `idx_nil_deals_status`, `idx_nil_deals_created_at DESC`. **RLS:** Enabled. Athlete read/insert/update own; Admin read/update all. **Confidence:** High.

#### `social_accounts`
- **PK:** `id` UUID. **FK:** `profile_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `platform TEXT NOT NULL` (instagram/tiktok/twitter/youtube/other — comment only), `handle TEXT NOT NULL`, `followers INTEGER DEFAULT 0` (altered to nullable in 20260707_social_oauth), `updated_at TIMESTAMPTZ DEFAULT NOW()`, **plus OAuth cols** `access_token TEXT`, `is_connected BOOLEAN NOT NULL DEFAULT false`, `platform_user_id TEXT`, `profile_url TEXT`.
- **Unique:** `(profile_id, platform)`. **Indexes:** `idx_social_accounts_profile`. **RLS:** Enabled. Full CRUD own (anon,authenticated USING/WITH CHECK profile_id=auth.uid()). **Confidence:** High.

#### `nil_value_metrics`
- **PK:** `id` UUID. **FK:** `profile_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `period_start DATE NOT NULL`, `period_end DATE NOT NULL`, `card_views INTEGER`, `link_clicks INTEGER`, `click_through_rate NUMERIC`, `tips_amount NUMERIC` (dollars), `tips_count INTEGER`, `followers_total INTEGER`, `engagement_rate NUMERIC`, `nil_score INTEGER`, `computed_at TIMESTAMPTZ DEFAULT NOW()`.
- **Unique:** `(profile_id, period_start, period_end)`. **Indexes:** `idx_nil_value_metrics_profile`, `idx_nil_value_metrics_dates`. **RLS:** Enabled. User read own; service_role full; admin read all. **Confidence:** High.

#### `athlete_ai_memory`
- **PK:** `profile_id → profiles(id) ON DELETE CASCADE` (PK is the FK). **Columns:** `preferred_tone TEXT DEFAULT 'confident'`, `preferred_output_length TEXT DEFAULT 'medium'`, `preferred_brand_categories TEXT[] DEFAULT '{}'`, `last_used_tool TEXT`, `tools_used_count JSONB DEFAULT '{}'`, `outputs_saved_count INTEGER DEFAULT 0`, `outputs_regenerated_count INTEGER DEFAULT 0`, `outputs_ignored_count INTEGER DEFAULT 0`, `last_active_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_athlete_ai_memory_profile`, `idx_athlete_ai_memory_last_active DESC`. **RLS:** Enabled, *Athletes read own* (SELECT). **No INSERT/UPDATE policy** — server writes via service_role. **Confidence:** High.

#### `ai_events`
- **PK:** `id` UUID. **FK:** `profile_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `tool TEXT NOT NULL`, `action TEXT NOT NULL`, `tone_used TEXT`, `output_length TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_ai_events_profile`, `idx_ai_events_created_at DESC`, `idx_ai_events_tool (profile_id, tool)`. **RLS:** Enabled. *Athletes insert own* (WITH CHECK), *Athletes read own*. **Confidence:** High.

#### `ai_saved_assets`
- **PK:** `id` UUID. **FK:** `profile_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `tool_type TEXT NOT NULL CHECK (tool_type IN ('bio','captions','pitch','optimize','rate'))`, `content TEXT NOT NULL`, `is_starred BOOLEAN DEFAULT false NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL`.
- **Indexes:** `idx_ai_saved_assets_profile`, `idx_ai_saved_assets_tool (profile_id, tool_type)`, `idx_ai_saved_assets_starred` (partial, is_starred=true). **RLS:** Enabled. Full CRUD own (with WITH CHECK). **Confidence:** High.

#### `tips`  (NOT in schema.sql — defined in migrations)
- **PK:** `id` UUID. **FK:** `athlete_id → profiles(id) ON DELETE CASCADE` (NOT NULL in 20260617/APPLY). **Columns:** `amount INTEGER NOT NULL`, `platform_fee INTEGER NOT NULL`, `net_amount INTEGER NOT NULL`, `sender_name TEXT`, `sender_email TEXT`, `stripe_session_id TEXT`, `stripe_payment_intent_id TEXT`, `status TEXT NOT NULL DEFAULT 'succeeded'`, `created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL`.
- ⚠️ **Schema divergence:** `20260620_full_platform.sql` defines a *different* `tips` (columns: `sender_email, amount, currency DEFAULT 'usd', stripe_payment_id, status DEFAULT 'pending'`, **no platform_fee/net_amount/sender_name/session/payment_intent**). Because 20260617 runs first, its `CREATE TABLE IF NOT EXISTS` wins; the 20260620 variant is a no-op if ordered. If applied out of order, the divergent shape wins. The effective live shape = 20260617/APPLY.
- **Indexes:** `idx_tips_athlete_id`, `idx_tips_created_at DESC`, `idx_tips_athlete_created`. **RLS:** `Athletes read own tips` (authenticated USING athlete_id=auth.uid()); `Service role full access on tips` (ALL). **Confidence:** Medium (divergent DDL across migrations).

#### `membership_tiers`  (NOT in schema.sql)
- **PK:** `id` UUID. **FK:** `athlete_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `name TEXT NOT NULL`, `description TEXT`, `price_cents INTEGER NOT NULL`, `stripe_price_id TEXT`, `is_active BOOLEAN DEFAULT true`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_membership_tiers_athlete`. **RLS:** *Athletes manage own tiers* (**FOR ALL USING athlete_id=auth.uid() — no WITH CHECK**, see §16 gap), *Public read active tiers* (SELECT anon USING is_active=true). **Confidence:** High.

#### `fan_subscriptions`  (NOT in schema.sql)
- **PK:** `id` UUID. **FK:** `fan_user_id → auth.users ON DELETE CASCADE`, `athlete_id → profiles(id) ON DELETE CASCADE NOT NULL`, `tier_id → membership_tiers(id) ON DELETE SET NULL`.
- **Columns:** `stripe_subscription_id TEXT`, `status TEXT DEFAULT 'active'`, `created_at TIMESTAMPTZ DEFAULT NOW()`. **Unique:** `(fan_user_id, athlete_id)`.
- **Indexes:** `idx_fan_subscriptions_athlete`, `idx_fan_subscriptions_fan`. **RLS:** *Fans read own* (fan_user_id=auth.uid()), *Athletes read own fan subs* (athlete_id=auth.uid()), *Service role full*, plus `Athletes insert own fan subscriptions` (INSERT WITH CHECK athlete_id=auth.uid(), added 20260705_fan_content_rls). **Confidence:** High.

#### `content_posts`  (NOT in schema.sql)
- **PK:** `id` UUID. **FK:** `athlete_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `title TEXT NOT NULL`, `body TEXT`, `media_url TEXT`, `is_members_only BOOLEAN DEFAULT false`, `tier_required TEXT DEFAULT 'free'`, `published BOOLEAN DEFAULT true`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_content_posts_athlete`. **RLS:** *Athletes manage own posts* (**FOR ALL USING athlete_id=auth.uid() — no WITH CHECK**, §16 gap), *Public read free posts* (SELECT anon USING published=true AND is_members_only=false), *Fans read subscribed content* (added 20260705_fan_content_rls). **Confidence:** High.

#### `brand_accounts`  (NOT in schema.sql)
- **PK:** `id` UUID. **FK:** `user_id → auth.users ON DELETE CASCADE UNIQUE NOT NULL`. **Columns:** `company_name TEXT NOT NULL`, `industry TEXT`, `website TEXT`, `logo_url TEXT`, `description TEXT`, `is_verified BOOLEAN DEFAULT false`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **RLS:** *Brands manage own account* (**FOR ALL USING user_id=auth.uid() — no WITH CHECK**, §16 gap). **Confidence:** High.

#### `campaign_briefs`  (NOT in schema.sql)
- **PK:** `id` UUID. **FK:** `brand_id → brand_accounts(id) ON DELETE CASCADE NOT NULL`. **Columns:** `title TEXT NOT NULL`, `description TEXT`, `sport TEXT`, `budget_min_cents INTEGER`, `budget_max_cents INTEGER`, `deadline TIMESTAMPTZ`, `status TEXT DEFAULT 'open'`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_campaign_briefs_brand`. **RLS:** *Brands manage own briefs* (FOR ALL USING brand_id IN subquery — no WITH CHECK, §16 gap). **Confidence:** High.

#### `inquiries`  (NOT in schema.sql)
- **PK:** `id` UUID. **FK:** `athlete_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `sender_name TEXT NOT NULL`, `sender_email TEXT NOT NULL`, `sender_company TEXT`, `inquiry_type TEXT NOT NULL`, `message TEXT NOT NULL`, `status TEXT DEFAULT 'new'`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_inquiries_athlete`. **RLS:** *Athletes read own inquiries* (SELECT), *Service role inquiries* (ALL). **Confidence:** High.

#### `saved_athletes`  (NOT in schema.sql)
- **PK:** `id` UUID. **FK:** `brand_id → brand_accounts(id) ON DELETE CASCADE NOT NULL`, `athlete_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `notes TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW()`. **Unique:** `(brand_id, athlete_id)`.
- **Indexes:** `idx_saved_athletes_brand`. **RLS:** *Brands manage own saved* (FOR ALL USING subquery, no WITH CHECK, §16 gap). **Confidence:** High.

#### `team_accounts`  (NOT in schema.sql)
- **PK:** `id` UUID. **FK:** `admin_user_id → auth.users ON DELETE CASCADE NOT NULL`. **Columns:** `name TEXT NOT NULL`, `school TEXT`, `sport TEXT`, `logo_url TEXT`, `custom_domain TEXT`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **RLS:** *Team admins manage* (**FOR ALL USING admin_user_id=auth.uid() — no WITH CHECK**, §16 gap). **Confidence:** High.

#### `team_members`  (NOT in schema.sql)
- **PK:** `id` UUID. **FK:** `team_id → team_accounts(id) ON DELETE CASCADE NOT NULL`, `athlete_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `role TEXT DEFAULT 'member'` (CHECK `role IN ('admin','coach','athlete')` added by 20260707_team_roles), `joined_at TIMESTAMPTZ DEFAULT NOW()`. **Unique:** `(team_id, athlete_id)`.
- **Indexes:** `idx_team_members_team`, `idx_team_members_athlete`. **RLS:** *Team admins manage members* (FOR ALL USING subquery), *Athletes read own teams* (SELECT), *Admins can update member roles* (UPDATE WITH CHECK, added 20260707_team_roles). **Confidence:** High.

#### `team_invites`  (NOT in schema.sql)
- **PK:** `id` UUID. **FK:** `team_id → team_accounts(id) ON DELETE CASCADE NOT NULL`. **Columns:** `email TEXT NOT NULL`, `status TEXT DEFAULT 'pending'`, `invited_at TIMESTAMPTZ DEFAULT NOW()`, `accepted_at TIMESTAMPTZ`.
- **RLS:** *Team admins manage invites* (FOR ALL USING subquery, no WITH CHECK, §16 gap). **Confidence:** High.

#### `profile_events`  (NOT in schema.sql — 20260702_data_moat)
- **PK:** `id` UUID. **FK:** `profile_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `event_type TEXT NOT NULL`, `field_name TEXT`, `old_value TEXT`, `new_value TEXT`, `metadata JSONB DEFAULT '{}'`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_profile_events_profile`, `idx_profile_events_created DESC`, `idx_profile_events_type`. **RLS:** *Athletes read own* (SELECT only — server writes via service_role). **Confidence:** High.

#### `weekly_snapshots`  (NOT in schema.sql — 20260702_data_moat)
- **PK:** `id` UUID. **FK:** `profile_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `week_start DATE NOT NULL`, `week_end DATE NOT NULL`, `card_views INTEGER`, `link_clicks INTEGER`, `tips_amount NUMERIC` (dollars), `tips_count INTEGER`, `followers_total INTEGER`, `nil_score INTEGER`, `profile_score INTEGER`, `created_at TIMESTAMPTZ DEFAULT NOW()`. **Unique:** `(profile_id, week_start)`.
- **Indexes:** `idx_weekly_snapshots_profile`, `idx_weekly_snapshots_week DESC`. **RLS:** *Athletes read own* (SELECT), *Service role manages* (ALL). **Confidence:** High.

#### `milestones`  (NOT in schema.sql — 20260702_data_moat)
- **PK:** `id` UUID. **FK:** `profile_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `milestone_type TEXT NOT NULL` (first_tip, first_100_views, etc. — comment only), `title TEXT NOT NULL`, `description TEXT`, `value NUMERIC`, `achieved_at TIMESTAMPTZ DEFAULT NOW()`. **Unique:** `(profile_id, milestone_type)`.
- **Indexes:** `idx_milestones_profile`, `idx_milestones_type`. **RLS:** *Athletes read own* (SELECT), *Service role manages* (ALL). **Confidence:** High.

#### `payouts`  (NOT in schema.sql — 20260702_payouts)
- **PK:** `id` UUID. **FK:** `athlete_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `amount INTEGER NOT NULL`, `stripe_payout_id TEXT`, `status TEXT DEFAULT 'pending'`, `arrival_date DATE`, `created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL`.
- **Indexes:** `idx_payouts_athlete`, `idx_payouts_created DESC`. **RLS:** *Athletes read own payouts* (SELECT), *Service role manages* (ALL). **Confidence:** High.

#### `athlete_knowledge`  (NOT in schema.sql — 20260704)
- **PK:** `profile_id → profiles(id) ON DELETE CASCADE`. **Columns:** `brand_voice TEXT`, `content_themes TEXT[] DEFAULT '{}'`, `best_performing_content JSONB DEFAULT '[]'`, `deal_preferences JSONB DEFAULT '{}'`, `growth_trends JSONB DEFAULT '[]'`, `recommended_actions TEXT[] DEFAULT '{}'`, `last_learned_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- **RLS:** Enabled. *Select own* (USING profile_id=auth.uid()), *Update own* (USING). **No INSERT policy** — inserts via service_role only (upserts in code use admin client). **Confidence:** High.

#### `nil_score_history`  (NOT in schema.sql — 20260709)
- **PK:** `id` UUID. **FK:** `profile_id → profiles(id) ON DELETE CASCADE NOT NULL`. **Columns:** `nil_score INTEGER DEFAULT 0`, `label TEXT DEFAULT 'Emerging'`, `breakdown_json JSONB DEFAULT '{}'`, `computed_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_nil_score_history_profile`, `idx_nil_score_history_profile_computed`. **RLS:** *Users read own* (anon,authenticated), *Service role manages* (ALL), *Admins read all*. **Confidence:** High.

#### `scheduled_posts`  (NOT in schema.sql, NOT in APPLY — 20260707_social_scheduler)
- **PK:** `id` UUID. **FK:** `user_id → auth.users(id) ON DELETE CASCADE NOT NULL`. **Columns:** `platform TEXT NOT NULL CHECK (platform IN ('instagram','tiktok','twitter','youtube','other'))`, `content TEXT NOT NULL`, `media_url TEXT`, `scheduled_at TIMESTAMPTZ NOT NULL`, `status TEXT DEFAULT 'draft' CHECK (status IN ('draft','queued','published','cancelled'))`, `hashtags TEXT[] DEFAULT '{}'`, `created_at`, `updated_at TIMESTAMPTZ DEFAULT NOW()`.
- **Indexes:** `idx_scheduled_posts_user`, `idx_scheduled_posts_scheduled_at`, `idx_scheduled_posts_status (user_id, status)`. **RLS:** Enabled. Full CRUD own (authenticated USING/WITH CHECK user_id=auth.uid()). **Confidence:** High.

#### Tables referenced in code with NO migration / NO schema (MISSING — §11.1)
`email_campaigns`, `fan_subscribers`, `team_messages`, `team_content`, `team_tasks`, `team_events`, `team_announcements` — **no DDL exists anywhere in `supabase/`**. These will error at runtime. **Confidence:** Low (do not exist).

---

### 11.3 Functions

| Function | Returns | SECURITY DEFINER | search_path set? | Notes |
|---|---|---|---|---|
| `handle_new_user()` | trigger | **YES** | **NO** ⚠️ | Auto-creates profile on auth signup. No `SET search_path` → search-path hijack risk. |
| `cleanup_rate_limits()` | void | **YES** | **NO** ⚠️ | Deletes >1h old rate_limits. No search_path. |
| `is_admin()` | boolean | YES | YES (`public, pg_catalog`) | Hardened. |
| `audit_log_immutable()` | trigger | YES | YES | Raises on update/delete. |
| `cleanup_raw_analytics()` | void / jsonb | YES | YES | 90-day prune of page_views/link_clicks. |
| `generate_referral_code()` | text | NO | n/a | 8-char code generator. |
| `grant_pro_reward(referrer_uuid)` | void | **YES** | **NO** ⚠️ | Extends pro. No search_path. |

### 11.4 Triggers
- `on_auth_user_created` (auth.users AFTER INSERT → handle_new_user)
- `tg_audit_log_no_update`, `tg_audit_log_no_delete` (audit_log BEFORE UPDATE/DELETE → audit_log_immutable)

### 11.5 Enumerated values (TEXT + CHECK, no native ENUMs)
- `referrals.status`: pending | completed | rewarded
- `ai_saved_assets.tool_type`: bio | captions | pitch | optimize | rate
- `scheduled_posts.platform`: instagram | tiktok | twitter | youtube | other
- `scheduled_posts.status`: draft | queued | published | cancelled
- `team_members.role`: admin | coach | athlete
- `nil_deals.status`: pending | cleared | rejected (compensation_type has comment only, no CHECK)
- `tips.status`: succeeded / pending (varies by migration)
- `content_posts.tier_required`: free (default); `is_members_only` bool

### 11.6 ER-style relationships
```
auth.users (1)───< profiles (1)───< page_views, link_clicks, tips, nil_deals,
                                │        social_accounts, nil_value_metrics,
                                │        athlete_ai_memory (1:1), ai_events,
                                │        ai_saved_assets, membership_tiers,
                                │        fan_subscriptions, content_posts,
                                │        inquiries, profile_events, weekly_snapshots,
                                │        milestones, nil_score_history, athlete_knowledge,
                                │        payouts, referral_codes (1:1), referrals,
                                │        scheduled_posts (via auth.users), team_members
                                │
profiles (1)───< referral_codes (1:1) ; referrals (referrer_id, referred_id) ──> profiles
membership_tiers (1)───< fan_subscriptions (tier_id) ; fan_subscriptions.fan_user_id ──> auth.users
team_accounts (1)───< team_members, team_invites ; team_members.athlete_id ──> profiles
brand_accounts (1)───< campaign_briefs, saved_athletes ; saved_athletes.athlete_id ──> profiles
```
External (used in code, undefined): `email_campaigns`, `fan_subscribers`, `team_messages`, `team_content`, `team_tasks`, `team_events`, `team_announcements`.

---

## SECTION 16 (partial) — Security Findings

### 16.1 SECURITY DEFINER without `SET search_path` (search-path hijack risk)
- `handle_new_user()` — **SECURITY DEFINER, no search_path**. A malicious user could create a function/table named `gen_random_uuid` or shadow `public.profiles` in a writable schema placed earlier in `search_path`, executing with definer privileges on signup. **Fix:** add `SET search_path = public, pg_catalog`.
- `cleanup_rate_limits()` — same issue.
- `grant_pro_reward(UUID)` (20260711_referral_system.sql) — same issue; also callable by anyone with EXECUTE (default PUBLIC) and performs an UPDATE on `profiles` as definer. **Fix:** restrict `REVOKE EXECUTE` or add search_path + ownership check.
- Properly hardened (reference): `is_admin()`, `audit_log_immutable()`, `cleanup_raw_analytics()` already set `search_path = public, pg_catalog`.

### 16.2 Anon-insertable tables (unauthenticated writes, no validation)
- `page_views`: `CREATE POLICY "Anyone can insert page_views" ... TO anon WITH CHECK (true)` — any anonymous client can write unlimited rows. No rate limiting at the DB layer (rate_limits has RLS on with no anon policy). **Abuse/spam/flood vector**; also a PII sink (viewer_ip_hash, user_agent, country, city stored for anonymous visitors).
- `link_clicks`: identical anonymous insert policy.
- **Recommendation:** gate behind a service_role-backed edge function with server-side validation/rate limiting, or add a CHECK that throttles per `viewer_ip_hash`.

### 16.3 RLS gaps — `FOR ALL ... USING (...) ` without `WITH CHECK` (INSERT privilege escalation)
Several "manage own" policies use `FOR ALL` with only a `USING` clause. For `INSERT`, Postgres applies `WITH CHECK`, **not** `USING` — so the ownership check is **not enforced on insert**, allowing any authenticated user to create rows pointing at *another* user's ID:
- `membership_tiers` — "Athletes manage own tiers" `FOR ALL USING (athlete_id = auth.uid())` → can INSERT a tier owned by any `athlete_id`.
- `content_posts` — "Athletes manage own posts" `FOR ALL USING (athlete_id = auth.uid())` → can INSERT posts as any athlete.
- `team_accounts` — "Team admins manage" `FOR ALL USING (admin_user_id = auth.uid())` → can INSERT a team owned by an arbitrary `admin_user_id`.
- `brand_accounts` — "Brands manage own account" `FOR ALL USING (user_id = auth.uid())` → can INSERT a brand row for any `user_id` (and the `UNIQUE user_id` would then block the real user).
- `campaign_briefs`, `saved_athletes`, `team_members`, `team_invites` — same pattern via subquery `USING` without `WITH CHECK`.
- **Fix:** split into separate `INSERT` policies with explicit `WITH CHECK`, or change `FOR ALL` to include `WITH CHECK (owner_col = auth.uid())`.
- Contrast: `profiles`, `ai_saved_assets`, `social_accounts`, `fan_subscriptions` (insert policy), `athlete_ai_memory` (no insert policy — service role only) are correctly handled.

### 16.4 `rate_limits` — RLS enabled with zero policies
`ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY` but **no policy is ever created** in schema.sql or migrations. With RLS on and no policy, all client-key access (anon/authenticated) is denied; only the `service_role` (which bypasses RLS) can read/write. The app's rate-limiter (`lib/storage.ts`) must therefore use the service role — fine functionally, but brittle: if any client-key query ever targets `rate_limits` it will silently return nothing. Also note the **`PRIMARY KEY KEY` typo in schema.sql (line 79)** means that file as-is will not even create the table. `rate_limits` is **not created by any migration**, so a DB built purely from migrations does not have this table at all — verify the rate limiter's fallback behavior.

### 16.5 `audit_log` — correctly hardened (positive note)
Immutable via both RLS RESTRICT policies **and** BEFORE UPDATE/DELETE triggers (`audit_log_immutable()`), so even `service_role` (which bypasses RLS) cannot mutate rows. This is the model the rest of the schema should follow.

### 16.6 Currency-unit inconsistency (data-integrity, not auth)
- `nil_deals.deal_value` is documented as **cents** (INTEGER).
- `weekly_snapshots.tips_amount` is documented as **dollars** (NUMERIC).
- `tips.amount` / `payouts.amount` are INTEGER with no unit comment (likely cents given Stripe).
- Mixing cents (INTEGER) and dollars (NUMERIC) across tables invites calculation bugs. **Recommendation:** standardize and document a unit per column.

### 16.7 GDPR / account-deletion coverage gap
`lib/actions/gdpr.ts` deletes from `profiles, tips, inquiries, ai_usage, ai_saved_assets, page_views, link_clicks` and references `ai_events, audit_log, fan_subscriptions, content_posts, membership_tiers` — but **does not delete** from `team_messages, team_content, team_tasks, team_events, team_announcements, email_campaigns, fan_subscribers` (the code-only tables) nor consistently from `profile_events, weekly_snapshots, milestones, nil_score_history, athlete_knowledge, payouts, scheduled_posts, social_accounts, referral_codes, referrals, brand_accounts, campaign_briefs, saved_athletes, team_accounts, team_members, team_invites`. Cascading FKs from `profiles` cover most, but the team_* and campaign tables (if they ever exist) would orphan data on deletion.

### 16.8 Storage bucket policies
- `avatars` bucket: authenticated users upload/update/delete only inside their own `auth.uid()` folder; public read. OK.
- `covers` bucket: public read; authenticated insert (any authenticated user can upload to **any** folder — only UPDATE/DELETE are folder-scoped). Minor: an authenticated user could write a `covers/<someone_else_id>/x.png`. Low severity (public bucket, overwritable by owner).

---

## Appendix A — Full table inventory (39 defined + 7 code-only)

**Defined in schema.sql +/or migrations (39):** waitlist, newsletter, profiles, rate_limits\*, ai_usage, page_views, link_clicks, audit_log, referral_codes, referrals, nil_deals, social_accounts, nil_value_metrics, athlete_ai_memory, ai_events, ai_saved_assets, tips\*, membership_tiers\*, fan_subscriptions\*, content_posts\*, brand_accounts\*, campaign_briefs\*, inquiries\*, saved_athletes\*, team_accounts\*, team_members\*, team_invites\*, profile_events, weekly_snapshots, milestones, payouts, athlete_knowledge, nil_score_history, scheduled_posts.
(\* = present in migrations/APPLY but **absent from schema.sql**; `rate_limits` has a **syntax error** in schema.sql and is created by no migration.)

**Code-referenced, NO migration, NO schema (7):** email_campaigns, fan_subscribers, team_messages, team_content, team_tasks, team_events, team_announcements.

**Column (not table):** `email_preferences` (JSONB on `profiles`).
