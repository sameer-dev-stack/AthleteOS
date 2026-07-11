# DATABASE.md — Supabase Postgres Schema

> All database tables, RLS policies, and migration notes for the AthleteOS backend.
> Run the SQL below in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql).

---

## Tables

### `waitlist`
Stores email signups from the landing page waitlist form.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `email` | `text` | — | Unique, not null |
| `source` | `text` | `'landing'` | Where the signup came from (e.g. `landing`, `announcement-bar`, `footer`) |
| `confirmed` | `boolean` | `false` | Whether the email has been confirmed via email link |
| `confirmation_token` | `text` | `null` | Unique token for email confirmation link (null after confirmed) |
| `joined_at` | `timestamptz` | `now()` | When the email was submitted |

### `newsletter`
Stores newsletter subscribers from the footer form.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `email` | `text` | — | Unique, not null |
| `subscribed_at` | `timestamptz` | `now()` | When the subscription was submitted |

### `profiles`
Extends Supabase Auth users with app-specific data. Created when a user confirms their email and first signs in.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | — | Primary key, references `auth.users(id)` |
| `email` | `text` | — | Not null, from auth.users |
| `full_name` | `text` | `null` | Optional display name |
| `avatar_url` | `text` | `null` | Optional profile image URL |
| `username` | `text` | `null` | Unique, athlete's public URL slug |
| `sport` | `text` | `null` | Athlete's sport |
| `school` | `text` | `null` | Athlete's school |
| `class_year` | `text` | `null` | Athlete's class year |
| `position` | `text` | `null` | Athlete's position |
| `bio` | `text` | `null` | Athlete bio (max 280 chars) |
| `stats` | `jsonb` | `'[]'` | Array of `{label, value}` stat entries |
| `links` | `jsonb` | `'[]'` | Array of `{label, url}` link entries |
| `social` | `jsonb` | `'{}'` | Object with `instagram`, `twitter`, `tiktok`, `youtube` handles |
| `highlights` | `jsonb` | `'[]'` | Array of `{title, url}` highlight entries |
| `is_verified` | `boolean` | `false` | Verified athlete badge |
| `profile_published` | `boolean` | `false` | Controls public profile visibility |
| `onboarding_completed` | `boolean` | `false` | Drives `/auth/callback` and dashboard routing |
| `plan` | `text` | `'free'` | Subscription tier: `free`, `pro`, `elite` |
| `stripe_subscription_id` | `text` | `null` | Stripe Billing subscription ID |
| `stripe_account_id` | `text` | `null` | Stripe Connect account ID (for tips) |
| `stripe_onboarding_complete` | `boolean` | `false` | Whether Stripe Connect onboarding is complete |
| `role` | `text` | `'user'` | User role: `user` or `admin` |
| `suspended` | `boolean` | `false` | Whether the account is suspended |
| `waitlist_position` | `integer` | `null` | Waitlist position for first-500 Pro benefit |
| `pro_expires_at` | `timestamptz` | `null` | When the Pro benefit expires |
| `contact_phone` | `text` | `null` | Optional athlete contact phone |
| `contact_email` | `text` | `null` | Optional athlete contact email |
| `created_at` | `timestamptz` | `now()` | When the profile was created |
| `updated_at` | `timestamptz` | `now()` | Last profile update |

### `rate_limits`
In-memory rate limiting table. Rows are cleaned up periodically.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `key` | `text` | — | Rate limit key (e.g. email address) |
| `count` | `int` | `1` | Number of attempts in current window |
| `window_start` | `timestamptz` | `now()` | When the current window started |

### `ai_usage`
Tracks AI tool usage per user per month. Shared pool across all 5 tools.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | — | References `auth.users(id)`, cascade delete |
| `tool` | `text` | — | Tool identifier (shared pool uses `"all"`) |
| `used_count` | `int` | `0` | Number of generations used this period |
| `period_start` | `date` | `current_date` | Start of the usage period (monthly reset) |
| | | | Unique constraint on `(user_id, tool, period_start)` |

### `page_views`
Analytics: tracks public card views with IP hashing for privacy.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `athlete_id` | `uuid` | — | References `profiles(id)`, cascade delete |
| `viewer_ip_hash` | `text` | — | SHA-256 hashed viewer IP |
| `referrer` | `text` | `null` | HTTP referrer header |
| `user_agent` | `text` | `null` | HTTP user-agent header |
| `country` | `text` | `null` | Vercel geo IP country identifier |
| `city` | `text` | `null` | Vercel geo IP city identifier |
| `created_at` | `timestamptz` | `now()` | When the view was recorded |

### `link_clicks`
Analytics: tracks outbound link and highlight clicks.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `athlete_id` | `uuid` | — | References `profiles(id)`, cascade delete |
| `link_label` | `text` | — | Display label of the clicked link |
| `link_url` | `text` | — | URL of the clicked link |
| `viewer_ip_hash` | `text` | — | SHA-256 hashed viewer IP |
| `referrer` | `text` | `null` | HTTP referrer header |
| `created_at` | `timestamptz` | `now()` | When the click was recorded |

### `audit_log`
Immutable log of all admin actions. Cannot be updated or deleted (enforced by triggers).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `admin_id` | `uuid` | `null` | References `auth.users(id)`, set null on delete |
| `action` | `text` | — | Action type (e.g. `plan_update`, `suspend`, `activate`) |
| `target_type` | `text` | — | Target entity type (e.g. `user`) |
| `target_id` | `text` | `null` | Target entity ID |
| `metadata` | `jsonb` | `'{}'` | Additional action details |
| `created_at` | `timestamptz` | `now()` | When the action was logged |

### `social_accounts` (New)
NIL Value Engine: stores linked athlete handles and follower metrics for social networks.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `profile_id` | `uuid` | — | References `profiles(id)`, cascade delete |
| `platform` | `text` | — | Platform key: `instagram`, `tiktok`, `youtube`, `twitter`, `other` |
| `handle` | `text` | — | Social media handler name / string |
| `followers` | `integer` | `0` | Audience count on this network |
| `updated_at` | `timestamptz` | `now()` | Timestamp of last modification |
| | | | Unique constraint on `(profile_id, platform)` |

### `nil_value_metrics` (New)
NIL Value Engine: stores aggregated performance metrics and computed scores per 30-day period.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `profile_id` | `uuid` | — | References `profiles(id)`, cascade delete |
| `period_start` | `date` | — | Start date of 30-day analytics aggregation |
| `period_end` | `date` | — | End date of 30-day analytics aggregation |
| `card_views` | `integer` | `0` | Deduplicated card views in period |
| `link_clicks` | `integer` | `0` | Click events in period |
| `click_through_rate` | `numeric` | `0` | Ratio of clicks to views |
| `tips_amount` | `numeric` | `0` | Sum of Stripe tips earned (converted to dollars) |
| `tips_count` | `integer` | `0` | Number of tips received |
| `followers_total` | `integer` | `0` | Total follower count across connected socials |
| `engagement_rate` | `numeric` | `0` | Calculated social engagement rate |
| `nil_score` | `integer` | `0` | Computed market value score (0-100) |
| `computed_at` | `timestamptz` | `now()` | Timestamp of valuation calculation |
| | | | Unique constraint on `(profile_id, period_start, period_end)` |

### `nil_deals` (New)
Compliance OS: tracks disclosed NIL sponsorship deals and status checks.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `athlete_id` | `uuid` | — | References `profiles(id)`, cascade delete |
| `company_name` | `text` | — | Brand/sponsor company name (max 100) |
| `deal_value` | `integer` | — | Deal amount in cents |
| `compensation_type` | `text` | — | Format: `cash`, `barter`, `equity`, `other` |
| `status` | `text` | `'pending'` | Audit status: `pending`, `cleared`, `rejected` |
| `description` | `text` | `null` | Deliverable descriptions (max 500) |
| `document_url` | `text` | `null` | Optional contract PDF URL |
| `start_date` | `date` | `current_date` | Date contract commences |
| `end_date` | `date` | `null` | Date contract terminates |
| `created_at` | `timestamptz` | `now()` | Disclosed date |
| `updated_at` | `timestamptz` | `now()` | Audit response date |

### `athlete_ai_memory` (New)
The Lock-In System: silent telemetry recording of athlete style preferences and aggregate tool usage.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `profile_id` | `uuid` | — | Primary key, references `profiles(id)`, cascade delete |
| `preferred_tone` | `text` | `'confident'` | Last used / preferred tone |
| `preferred_output_length` | `text` | `'medium'` | output size: `short`, `medium`, `long` |
| `preferred_brand_categories` | `text[]` | `'{}'` | Array of targeting niches |
| `last_used_tool` | `text` | `null` | Identifier of last active copywriter |
| `tools_used_count` | `jsonb` | `'{}'` | Key-value mapping of tool activations (e.g. `{"bio": 5, "captions": 12}`) |
| `outputs_saved_count` | `integer` | `0` | Total generated items saved/applied |
| `outputs_regenerated_count` | `integer` | `0` | Number of times regenerated without saving |
| `outputs_ignored_count` | `integer` | `0` | Number of times tab/section exited with no actions |
| `last_active_at` | `timestamptz` | `now()` | Last AI toolkit engagement timestamp |
| `updated_at` | `timestamptz` | `now()` | Timestamp of last model update |

### `ai_events` (New)
The Lock-In System: granular append-only event stream tracking every click within the AI toolkit.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | `uuid` | `gen_random_uuid()` | Primary key |
| `profile_id` | `uuid` | — | References `profiles(id)`, cascade delete |
| `tool` | `text` | — | Tool key: `bio`, `captions`, `pitch`, `optimize`, `rate`, `nil_engine` |
| `action` | `text` | — | Action key: `generated`, `saved`, `copied`, `regenerated`, `ignored`, `applied` |
| `tone_used` | `text` | `null` | Tone configuration |
| `output_length` | `text` | `null` | Output length configuration |
| `created_at` | `timestamptz` | `now()` | Timestamp of event fire |

---

## Row Level Security (RLS) Policies

All tables employ strict Row Level Security (RLS). 

* **Profiles**: signed-in athletes can read/write their own details (`auth.uid() = id`). Public reads are allowed for published profiles.
* **Waitlist / Newsletter**: Public access restricted (anon SELECT prohibited). Service role key manages ingestion.
* **Analytics (`page_views`, `link_clicks`)**: written using service role to bypass RLS. Raw visitor IP addresses are hashed immediately using SHA-256 + secret salt and are never written to disk.
* **NIL Value Engine & Compliance**: Athletes SELECT their own rows on `social_accounts`, `nil_value_metrics`, and `nil_deals`. Athletes INSERT/UPDATE social accounts and disclose deals; service-role handles metrics computation writes. Admins hold global select/update permissions on deals for clearing/rejecting.
* **AI Memory & Events**: `athlete_ai_memory` grants SELECT to owning authenticated athlete (`profile_id = auth.uid()`). Direct writes are disallowed. `ai_events` grants SELECT and INSERT to authenticated athlete.

---

Last updated: 2026-07-02 (Session 63 - The Lock-In System & NIL Value Engine Updates)
