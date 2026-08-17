# DEPLOYMENT.md — Deploy & GitHub Workflow

> How code goes from local edits to live on Vercel.

---

## Stack at a glance

| Layer | Service |
|-------|---------|
| Source control | GitHub — `sameer-dev-stack/AthleteOS` |
| CI / Build / Host | Vercel — project `athlete-os` (Sameer's projects · Hobby) |
| Branch → environment | `main` → Production · all other branches → Preview |
| Domain | `www.nilcard.app` (canonical) + `nilcard.app` + `*.vercel.app` (deploy) |
| Database | Supabase Postgres — `nkyedqekfligqhrnwkqt` (Tokyo) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Email | Resend — transactional emails |

---

## Day-to-day flow

```powershell
# 1. Make changes (edit code + docs per AGENTS.md)
# 2. Verify
npm run lint
npm run build

# 3. Run headless browser tests against live production
npx playwright test e2e/full-audit.spec.ts --config=playwright.prod.ts

# 4. Commit
git add -A
git commit -m "<concise present-tense summary>"

# 5. Push (triggers Vercel deploy automatically)
git push
```

Vercel will:
1. Detect the push on `origin/main`
2. Run `npm install`
3. Run `next build`
4. Deploy the build output globally
5. Update the production URL
6. (For non-`main` branches) generate a preview URL

Build status visible at: https://vercel.com/sameer-projects/athlete-os/deployments

---

## Initial Vercel setup (already done)

User imported the repo on the Vercel "New Project" screen with these settings:

| Field | Value |
|-------|-------|
| Project Name | `athlete-os` |
| Framework Preset | Next.js (auto-detected) |
| Root Directory | `./` |
| Build Command | `npm run build` (Next.js default) |
| Output Directory | Next.js default (`.next`) |
| Install Command | npm default |

## Static Assets (SEO + Social)

The following static files are auto-generated and committed to `public/`:

| File | Source | Size |
|------|--------|------|
| `/icon.svg` | `app/icon.svg` (hand-written) | ~290 B |
| `/apple-icon.png` | `scripts/gen-og.js` (180x180) | 3 kB |
| `/og-image.png` | `scripts/gen-og.js` (1200x630) | 73 kB |
| `/twitter-image.png` | `scripts/gen-og.js` (1200x675) | 71 kB |
| `/robots.txt` | `app/robots.ts` | — |
| `/sitemap.xml` | `app/sitemap.ts` | — |

**To regenerate the PNGs** (after changing the design):

```powershell
npm run gen:og
```

**Why not use `next/og` `ImageResponse`?** It's broken on Windows because `import.meta.url` doesn't resolve to a proper `file://` URL for the bundled CJS module, causing `fileURLToPath` to throw "Invalid URL" during prerender. Static PNGs work everywhere and don't add serverless render time. See `scripts/gen-og.js` for the full note.

---

## Public Access (Session 12)

SSO protection was disabled via the Vercel API so the site is publicly accessible without bypass tokens.

- **SSO Protection:** `none` (was `all_except_custom_domains`)
- **Production URL:** `https://athlete-os-vert.vercel.app` (alias: `athlete-os-sameers-projects-165cb2e7.vercel.app`)
- **API endpoint verified:** `GET /api/waitlist` returns `{"waitlist":0,"newsletter":0,"mode":"supabase"}`
- **Admin page verified:** `/admin` loads with waitlist table, dashboard, sign-out button
- **Sign-in page:** `/auth/sign-in` — email/password login form for admin access

To re-enable SSO protection (e.g. before launch):
```powershell
# Via Vercel API
$body = '{ "ssoProtection": { "deploymentType": "all_except_custom_domains" } }'
Invoke-WebRequest -Uri "https://api.vercel.com/v9/projects/prj_ysAdRgOP9l40afrTbzQb0vPokiBD" -Method PATCH -Body $body -Headers @{ "Authorization" = "Bearer $VERCEL_TOKEN"; "Content-Type" = "application/json" }
```

---

## Supabase Setup (Session 11)

### Project Details

| Item | Value |
|------|-------|
| Project URL | `https://nkyedqekfligqhrnwkqt.supabase.co` |
| Region | `ap-northeast-1` (Tokyo) |
| Plan | Free |

### Database Schema

Run the SQL in `supabase/schema.sql` via the Supabase SQL Editor:
1. Open https://supabase.com/dashboard/project/nkyedqekfligqhrnwkqt/sql
2. Paste the contents of `supabase/schema.sql`
3. Click "Run"

Tables created:
- `waitlist` — email signups with source tracking
- `newsletter` — newsletter subscribers
- `profiles` — extends Supabase Auth users
- `rate_limits` — rate limiting entries
- `page_views` — public-card view events with hashed viewer IP
- `link_clicks` — outbound link/highlight click events with hashed viewer IP

### Environment Variables (Vercel)

Add these to the Vercel project (Settings → Environment Variables):

| Variable | Source | Used by |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Server actions, admin |
| `RESEND_API_KEY` | Resend Dashboard → API Keys | Confirmation emails |
| `NEXT_PUBLIC_SITE_URL` | `https://www.nilcard.app` | OAuth redirects, email links, canonical URLs |
| `ANALYTICS_IP_HASH_SECRET` | Generated local secret | Server-side viewer IP hashing for analytics |

### Local Dev

No env vars needed for basic landing page + waitlist. The storage layer falls back to file-based JSON.

To test Supabase locally, create `.env.local` with the vars from `.env.example`.

---

## Production Verification (Session 31)

Verified with Vercel CLI on 2026-06-13:

```powershell
vercel project ls
vercel inspect https://athlete-os-vert.vercel.app
vercel --prod --yes
```

Current production deployment:

| Item | Value |
|------|-------|
| Project | `athlete-os` |
| Public URL | `https://athlete-os-vert.vercel.app` |
| Latest deployment status | `Ready` |
| Latest deployment ID | `dpl_J4KDpaySx7obxrbPWLx4gNDvdt71` |

Live route smoke test results:

| Route | Expected | Verified |
|-------|----------|----------|
| `/` | Landing page loads | `200 OK` |
| `/auth/sign-up` | Sign-up page loads | `200 OK` |
| `/onboarding` | Onboarding page loads | `200 OK` |
| `/api/waitlist` | Supabase-backed JSON | `{"waitlist":3,"newsletter":0,"mode":"supabase"}` |
| `/auth/callback` without code | Redirects to auth error | `307 Temporary Redirect` |

Vercel production env vars were re-applied from local `.env` for:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_PRO`
- `STRIPE_PRICE_ID_ELITE`
- `GEMINI_MODEL`
- `ANALYTICS_IP_HASH_SECRET`

`GEMINI_API_KEY` is not set in production because the local `.env` value is empty.

Supabase CLI remote checks:

```powershell
supabase migration list --linked
supabase link --project-ref nkyedqekfligqhrnwkqt
```

These currently fail with `Unauthorized` unless a valid Supabase platform access token or `SUPABASE_DB_PASSWORD` is provided. Runtime Supabase access was still verified through the production app via `/api/waitlist`.

---

## Resend Setup (Session 11)

### API Key

Stored in `.env` as `RESEND_API_KEY` and in Vercel Environment Variables. The actual value is never committed. Set it in:
- Local `.env`
- Vercel → Settings → Environment Variables (Production / Preview / Development)
- Location to view: Resend Dashboard → API Keys

### Email Templates

Confirmation and welcome emails are in `lib/actions/emails.ts`. They use inline HTML with the AthleteOS design system (dark theme, lime accent).

### Sending Domain

Currently using `onboarding@resend.dev` (Resend's default sandbox). To use a custom domain:
1. Add domain in Resend Dashboard → Domains
2. Add DNS records as Resend instructs
3. Update the `from` address in `lib/actions/emails.ts`

---

## Supabase Auth Setup

### Providers Enabled

- **Email/Password** — built-in, no setup needed
- **Google OAuth** — requires Google Cloud Console setup

### Google OAuth Setup

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://nkyedqekfligqhrnwkqt.supabase.co/auth/v1/callback`
4. Copy Client ID + Client Secret
5. In Supabase Dashboard → Authentication → Providers → Google → paste credentials
6. In Supabase Dashboard → Authentication → URL Configuration → Site URL must be `https://www.nilcard.app`, and **Redirect URLs** must include `https://www.nilcard.app/**` (and `http://localhost:3000/**` for dev).
7. In Vercel, set `NEXT_PUBLIC_SITE_URL=https://www.nilcard.app` (and `NEXT_PUBLIC_APP_URL=https://www.nilcard.app`) and redeploy.

> **OAuth redirect host allowlist** — `lib/actions/auth.ts` (`signInWithGoogle`) builds the post-Google callback URL from the request host, but only trusts a host allowlist (`NEXT_PUBLIC_SITE_URL` host, its bare/www variant, and localhost) before passing it to Supabase. If the visitor's host isn't allowed, it falls back to `NEXT_PUBLIC_SITE_URL`. So if `NEXT_PUBLIC_SITE_URL` is stale (e.g. still the old Vercel domain), Google OAuth returns users to the OLD domain. Fix: keep `NEXT_PUBLIC_SITE_URL=https://www.nilcard.app` in Vercel + Supabase URL Configuration. The allowlist now also accepts `nilcard.app` (bare) and `www.nilcard.app` regardless of which is configured.

---

## GitHub auth (one-time, already done)

The dev machine uses **GitHub CLI** (`gh`) for git credential management.

```powershell
# One-time install (already done)
winget install --id GitHub.cli

# One-time auth (already done as sameer-dev-stack)
gh auth login --git-protocol https --web -h github.com

# This configured the git credential helper:
gh auth setup-git
```

After this, `git push` is transparent — no password / token prompts.

To check status:
```powershell
gh auth status
```

To re-auth on a new machine, repeat the three commands above.

---

## Repo conventions

- **Default branch:** `main`
- **All commits to `main` directly** for now (solo dev, landing page only)
- **Future:** when product engineering starts (Phase 1+ in `ROADMAP.md`), switch to PR-based flow with preview deployments

---

## Environment variables

| Variable | Source | Used by |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Server actions, admin |
| `RESEND_API_KEY` | Resend Dashboard → API Keys | Confirmation emails |
| `NEXT_PUBLIC_SITE_URL` | `https://www.nilcard.app` | OAuth redirects, email links, canonical URLs |

**Rule:** Never commit `.env` files. `.gitignore` already covers `.env*`.

---

## Domain setup

The canonical production domain is `www.nilcard.app` (the bare `nilcard.app` also resolves and is accepted by the OAuth host allowlist).

To go live:
1. Ensure `nilcard.app` + `www.nilcard.app` DNS point at Vercel (A record → `76.76.21.21` or CNAME → `cname.vercel-dns.com`)
2. Add domains in Vercel: Project Settings → Domains
3. Add DNS records as Vercel instructs
4. SSL auto-provisions in <60s
5. Set `NEXT_PUBLIC_SITE_URL` to `https://www.nilcard.app` in Vercel env vars
6. (Optional) 301 the `athlete-os-vert.vercel.app` deployment URL to `https://www.nilcard.app` in Vercel Project Settings → Redirects
7. Update Supabase Dashboard → Authentication → URL Configuration → Site URL + Redirect URLs to include `https://www.nilcard.app/**` (see Google OAuth Setup above)

---

## Stripe Webhooks (Production)

Webhook endpoint: `https://athlete-os-vert.vercel.app/api/stripe/webhook`

**Configured in Stripe Dashboard:**
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Signing secret: `STRIPE_WEBHOOK_SECRET` in Vercel env vars
- API version: `2024-11-20.acacia`

**Local development:**
```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

**Verifying webhook delivery:**
1. Stripe Dashboard → Developers → Webhooks → athlete-os-vert.vercel.app
2. Click "Send test event" for any event type
3. Check Vercel function logs for 200 response

---

## Performance budget (track on every deploy)

| Metric | Target | Current (2026-06-06) |
|--------|--------|----------------------|
| Home page route size | < 80 kB | 60.5 kB ✅ |
| First Load JS | < 200 kB | 148 kB ✅ |
| Lighthouse Performance (mobile) | > 90 | TBD |
| Lighthouse Accessibility | > 95 | TBD |
| Lighthouse SEO | > 95 | TBD |
| LCP | < 1.5s | TBD |

Run Lighthouse on the deployed Vercel URL after each significant change.

---

## Rollback

Vercel keeps a deployment history. To roll back:
1. Vercel dashboard → Deployments
2. Find the last good deployment
3. Click "..." → Promote to Production

This is faster than reverting commits when you need to undo a bad ship.

---

## Local production preview

To test the actual production build locally before pushing:

```powershell
npm run build
npm start          # Serves the production bundle on http://localhost:3000
```

This catches any issues that only appear in the production build (e.g., server-component vs client-component mismatches, missing `"use client"` directives, font fetch errors).

---

## CI (not yet configured)
## CI (configured)
`.github/workflows/ci.yml` runs on push/PR to `main` **and** `develop`:
- `npm ci`
- `npm run lint`
- `npm run build` (placeholder secrets for Supabase/Stripe/Gemini so the build succeeds)

Vercel still builds + deploys on every push to `main` (production). The GitHub Action is the pre-merge quality gate; Vercel is the deploy trigger.

### CI branch mismatch (review)
The workflow triggers on `develop` as well as `main`, but `AGENTS.md` mandates **direct commits to `main`** (no long-lived branches). Either drop `develop` from the trigger or formally adopt a PR flow — decide before relying on the gate. See `docs/DECISIONS.md` if adopting PR-based flow.

### Local pre-push check (mirrors CI)
```powershell
npm run lint
npm run build
```

---

Last updated: 2026-07-02 (Session 66)
