# CREDENTIALS.md — Project Credentials & API Keys

> **Every service, key, URL, and account used by this project.**
> This file is the source of truth for all credentials. If you add, rotate, or remove any key, update this file immediately.
> The actual secret values live in `.env` (gitignored). This file records what exists and where it comes from.

---

## Analytics — Google Tag (gtag.js)

| Item | Value | Where to find it |
|------|-------|-----------------|
| Google Analytics Measurement ID | `G-END1CXF54P` | Google Analytics → Admin → Data Streams. Hardcoded in `app/layout.tsx` via `next/script`. |

---

## Supabase

| Item | Value | Where to find it |
|------|-------|-----------------|
| Project URL | `https://nkyedqekfligqhrnwkqt.supabase.co` | Supabase Dashboard → Settings → API |
| Project ID | `nkyedqekfligqhrnwkqt` | From the URL |
| Region | `ap-northeast-1` (Tokyo) | Supabase Dashboard |
| Plan | Free | Supabase Dashboard |
| Dashboard | https://supabase.com/dashboard/project/nkyedqekfligqhrnwkqt | — |

### API Keys (Legacy)

| Key name | Env var | Where to find it |
|----------|---------|-----------------|
| Anon key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → "anon public" |
| Service role key | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → "service_role secret" |

Both keys are set in `.env` (local) and Vercel Environment Variables (production).

### Publishable / Secret Keys (New)

| Key name | Where to find it | Purpose |
|----------|-----------------|---------|
| Publishable key | Supabase Dashboard → Settings → API → "Publishable key" | Public key for new API key format |
| Secret key | Supabase Dashboard → Settings → API → "Secret key" | Privileged key for new API key format |

### Supabase Platform Token

| Item | Where to find it | Purpose |
|------|-----------------|---------|
| Access Token | Supabase Dashboard → Account → Access Tokens → "NIL" | Supabase CLI/API authentication |

### Database Schema

Schema file: `supabase/schema.sql` — run in Supabase SQL Editor.

Tables: `waitlist`, `newsletter`, `profiles`, `rate_limits`.
The `waitlist` table has a `confirmation_token TEXT` column (added in Session 16).
See `docs/DATABASE.md` for full schema documentation.

### Database Migration (Session 16)

```sql
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS confirmation_token TEXT;
```
Run via Supabase Management API. The `supabase/schema.sql` file already includes this column.

### Admin Users

| Field | Value |
|-------|-------|
| Email | `sameer@athleteos.app` |
| Password | Set via Supabase Auth (ask project owner if you need a reset) |
| Type | Email/password auth (Supabase Auth) |
| Status | Email confirmed, has logged in before |
| Profile ID | `83c283e5-ef8f-4c4f-a255-abc7e66f4970` |

| Field | Value |
|-------|-------|
| Email | `bdzone010@gmail.com` |
| Password | Set via Supabase Auth |
| Type | Email/password auth (Supabase Auth) |
| Status | Admin access granted |
| Profile ID | — |

| Field | Value |
|-------|-------|
| Email | `Admin@nilcard.app` |
| Password | `mzplayz123@` |
| Type | Email/password auth (Supabase Auth) |
| Status | Admin access granted |
| Profile ID | `2cd7ce07-e260-4a5d-b899-ba56db846f99` |

---

## Vercel

| Item | Value |
|------|-------|
| Project name | `athlete-os` |
| Team/account | `sameer-dev-stack` |
| Production URL | `https://www.nilcard.app` (canonical); deploy URL `https://athlete-os-vert.vercel.app` |
| Project ID | `prj_ysAdRgOP9l40afrTbzQb0vPokiBD` |
| Deployments | https://vercel.com/sameer-projects/athlete-os/deployments |
| SSO Protection | `none` (disabled in Session 12 for public access) |
| Framework | Next.js (auto-detected) |

### Vercel Access Token

| Item | Where to find it | Purpose |
|------|-----------------|---------|
| Token (Full Account) | Vercel Dashboard → Settings → Tokens → "NILFullAccount" | Vercel API authentication |

### Environment Variables (Vercel)

These must be set in Vercel Dashboard → Settings → Environment Variables for production deployment:

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |
| `NEXT_PUBLIC_SITE_URL` | `https://www.nilcard.app` |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks |
| `STRIPE_PRICE_ID_PRO` | Stripe Dashboard → Products → AthleteOS Pro |
| `STRIPE_PRICE_ID_ELITE` | Stripe Dashboard → Products → AthleteOS Elite |
| `GEMINI_API_KEY` | Google AI Studio → API Keys |
| `GEMINI_MODEL` | Default: `gemini-2.0-flash` |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog Dashboard → Settings → Project → API Keys |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Dashboard → Settings → Projects → athleteos → Client Keys |
| `ANALYTICS_IP_HASH_SECRET` | Generated secret for IP hashing |

---

## Resend (Email)

| Item | Value |
|------|-------|
| API Key | `re_...` (starts with `re_`) | Resend Dashboard → API Keys → default key |
| Sending address | `onboarding@resend.dev` (sandbox) |
| Dashboard | https://resend.com |
| Plan | Free (100 emails/day) |
| Used for | Confirmation emails, welcome emails |

---

## Stripe (Billing)

| Item | Value | Where to find it |
|------|-------|-----------------|
| Secret key | `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` — in `.env` as `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| Publishable key | `pk_live_51QTlW7AhbY1vKIDZoSTH2CnZ2Hn398FR1Ry0hYUSygDLO242gLAFPps3rts1daNnqnm851rHfpIh4QCR2SQTTwOj008evm180L` — in `.env` as `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| Price ID (Pro) | `price_1TqAqgAhbY1vKIDZfad8S5Uu` — in `.env` as `STRIPE_PRICE_ID_PRO` | Stripe Dashboard → Products → AthleteOS Pro ($14/mo) |
| Price ID (Elite) | `price_1TqAsAAhbY1vKIDZfpP9XaAn` — in `.env` as `STRIPE_PRICE_ID_ELITE` | Stripe Dashboard → Products → AthleteOS Elite ($29/mo) |
| Webhook secret | `whsec_jrRisuRZV0wBZqHXOkEFxZO8YlY4YIYx` — in `.env` as `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Event Destinations → captivating-oasis |
| Webhook endpoint | `https://www.nilcard.app/api/stripe/webhook` — **updated 2026-08-19**: old endpoint `https://athlete-os-vert.vercel.app/api/stripe/webhook` was DEAD (tips/subscriptions never processed). Verify in Stripe Dashboard → Developers → Event Destinations |
| Product ID (Pro) | `prod_UpqXk10SgNGblm` | Stripe Dashboard → Products → AthleteOS Pro |
| Product ID (Elite) | `prod_UpqZwmGBWCxwea` | Stripe Dashboard → Products → AthleteOS Elite |

- **Mode:** Live (real transactions)
- **Account:** Premierelitebasketball (ClickFunnels-managed)
- **Webhook events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- **Vercel env vars:** All 5 keys must be set for Production, Preview, and Development, then redeploy

---

## Google Gemini (AI Tools)
- **Status:** Obtained and set in `.env`
- **Keys:**
  - `GEMINI_API_KEY` — Set in `.env` and Vercel
  - `GEMINI_MODEL` — Set in `.env` and Vercel (default: `gemini-2.0-flash`)
- **SQL migration:** `supabase/migrations/20260612_ai_usage.sql` — run in Supabase Dashboard SQL Editor

---

## PostHog (Product Analytics)

| Item | Value | Where to find it |
|------|-------|-----------------|
| Project API key | `phc_uMVQPbjSrVEXkK3tFY4xLh7NvYQJx7fG3iqW8hqj8pXU` | PostHog Dashboard → Settings → Project → API Keys |
| Dashboard | https://app.posthog.com | — |

Set as `NEXT_PUBLIC_POSTHOG_KEY` in both `.env` and Vercel environment variables.

---

## Sentry (Error Monitoring)

| Item | Value | Where to find it |
|------|-------|-----------------|
| DSN | `https://08e9e781cb623b86fd1edb17e0d9ff8c@o4511687288881152.ingest.us.sentry.io/4511687291305984` | Sentry Dashboard → Settings → Projects → athleteos → Client Keys |
| Dashboard | https://sentry.io | — |

Set as `NEXT_PUBLIC_SENTRY_DSN` in both `.env` and Vercel environment variables.

---

## Instagram OAuth

| Item | Env var | Where to find it |
|------|---------|-----------------|
| App ID | `INSTAGRAM_APP_ID` | Meta for Developers → App Settings → Basic |
| App Secret | `INSTAGRAM_APP_SECRET` | Meta for Developers → App Settings → Basic |
| Redirect URI | `{origin}/api/social/instagram/callback` | Set in Meta App Dashboard → Facebook Login → Valid OAuth Redirect URIs |
| Scopes | `user_profile,user_media` | Requested during OAuth flow |
| API version | Graph API v18.0 | Hardcoded in route handlers |

**Status:** Not yet obtained. Add to `.env` and Vercel when ready.

---

## TikTok OAuth

| Item | Env var | Where to find it |
|------|---------|-----------------|
| Client Key | `TIKTOK_CLIENT_KEY` | TikTok Developer Portal → App → Client Key |
| Client Secret | `TIKTOK_CLIENT_SECRET` | TikTok Developer Portal → App → Client Secret |
| Redirect URI | `{origin}/api/social/tiktok/callback` | Set in TikTok Developer Portal → Redirect URIs |
| Scopes | `user.info.basic` | Requested during OAuth flow |

**Status:** Not yet obtained. Add to `.env` and Vercel when ready.

---

## GitHub

| Item | Value |
|------|-------|
| Repo | https://github.com/sameer-dev-stack/AthleteOS |
| Branch | `main` (solo dev, direct commits) |
| Auth | GitHub CLI (`gh`) authenticated as `sameer-dev-stack` |
| Git remote | `origin → https://github.com/sameer-dev-stack/AthleteOS.git` |

---

## Local Development

| Item | Value |
|------|-------|
| Dev URL | `http://localhost:3000` |
| `.env` file | `C:\Users\Sameer\Desktop\NIL\.env` (gitignored) |
| Storage mode (local) | File-based fallback (`data/waitlist.json`, `data/newsletter.json`) |
| Storage mode (with Supabase keys) | Supabase Postgres |

### `.env` file contents

The `.env` file at `C:\Users\Sameer\Desktop\NIL\.env` contains (values omitted — see reference table above):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nkyedqekfligqhrnwkqt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase Dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase Dashboard>

# Resend
RESEND_API_KEY=<from Resend Dashboard>

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe (live)
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51QTlW7AhbY1vKIDZoSTH2CnZ2Hn398FR1Ry0hYUSygDLO242gLAFPps3rts1daNnqnm851rHfpIh4QCR2SQTTwOj008evm180L
STRIPE_WEBHOOK_SECRET=whsec_jrRisuRZV0wBZqHXOkEFxZO8YlY4YIYx
STRIPE_PRICE_ID_PRO=price_1TqAqgAhbY1vKIDZfad8S5Uu
STRIPE_PRICE_ID_ELITE=price_1TqAsAAhbY1vKIDZfpP9XaAn

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_uMVQPbjSrVEXkK3tFY4xLh7NvYQJx7fG3iqW8hqj8pXU

# Analytics
ANALYTICS_IP_HASH_SECRET=<generated-local-secret>
```

---

## Admin Accounts Summary

| Service | Email | Type |
|---------|-------|------|
| Supabase | `sameer-dev-stack` (GitHub) | GitHub OAuth |
| Vercel | `sameer-dev-stack` | GitHub OAuth |
| GitHub | `sameer-dev-stack` | — |
| Resend | sameer.imtiaz6040@gmail.com | Email/password |
| App admin | `sameer@athleteos.app` | Supabase Auth (email/password) — password set by admin |

> **Admin check:** Hardcoded in `lib/admin.ts` (single source of truth).

---

## Important URLs

| URL | Purpose |
|-----|---------|
| https://www.nilcard.app | Canonical production domain (SEO target) |
| https://athlete-os-vert.vercel.app | Vercel deployment URL (redirects/non-canonical) |
| http://localhost:3000 | Local dev server |
| http://localhost:3000/api/waitlist | Local waitlist count API |
| http://localhost:3000/api/confirm-waitlist | Waitlist email confirmation endpoint |
| http://localhost:3000/auth/sign-in | Admin sign-in page |
| http://localhost:3000/auth/sign-up | Admin sign-up page |
| http://localhost:3000/admin | Admin dashboard (requires auth) |
| https://github.com/sameer-dev-stack/AthleteOS | Source code |
| https://supabase.com/dashboard/project/nkyedqekfligqhrnwkqt | Supabase project dashboard |
| https://vercel.com/sameer-projects/athlete-os/deployments | Vercel deployments |
| https://resend.com | Email dashboard |
| https://athleteos.app | DIFFERENT product (AI lifting coaching app) — NOT this project |

---

## Waitlist Data

As of Session 14, there is **1 waitlist entry** in Supabase:
- Email: `tayije8396@5nek.com`
- Source: `landing`
- Confirmed: `false`
- Joined: `2026-06-07T19:20:09.138759+00:00`

---

## Security Notes

- The `.env` file is gitignored — never commit it.
- This `CREDENTIALS.md` file IS committed to git (per project owner's explicit instruction to document everything).
- If any key is leaked, rotate it in the respective service dashboard and update both `.env` and this file.
- The Supabase service role key has full database access — treat it as sensitive.

---

Last updated: 2026-06-17
