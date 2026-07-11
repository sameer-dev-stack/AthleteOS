# PLANNED.md — Features Built & Next Steps

> Track every feature we've discussed, built, or planned during sessions.
> Completed items stay here for reference. Remove only when fully shipped and verified live.

---

## Completed Features

### Auth & Onboarding
- [x] Auth callback profile upsert fixed — service role client (`app/auth/callback/route.ts`)
- [x] Onboarding profile upsert fixed — service role + email field (`lib/actions/profile.ts`)
- [x] `getPublicProfile` uses service role client for authenticated users
- [x] `getMyProfile` uses service role client to bypass RLS mismatch
- [x] `checkUsername` uses service role client to check across all profiles
- [x] Middleware uses singleton service role client for all profile reads
- [x] Dashboard redirect loop fixed — `onboarding_completed` check in middleware
- [x] Navbar shows "Dashboard" button when logged in, "Sign in"/"Get started" when logged out
- [x] Extra "Edit profile" button removed from Your Card card
- [x] `revalidatePath` fix — uses `data.username` from upsert response
- [x] Onboarding redirect guard — middleware redirects completed users from `/onboarding` to `/dashboard`

### RLS & Database
- [x] RLS policies fixed — `TO anon, authenticated` for profiles and ai_usage tables (SQL migration `20260617_fix_profile_rls_roles.sql`)
- [x] All profile reads/writes use service role client to avoid role mismatch

### AI Tools
- [x] Gemini API key set, model set to `gemini-2.0-flash-lite`
- [x] Gemini SDK fixed — `systemInstruction` passed via model constructor
- [x] Retry logic for 429 errors added
- [x] AI error messages now show actual Gemini error in dev

### Monetization
- [x] Tips table created (`tips` table)
- [x] Tip earnings display built — server action, dashboard component
- [x] Stripe Connect onboarding — `createConnectOnboarding()` server action, "Connect with Stripe" CTA
- [x] Payout balance display — `getPayoutBalance()` reads Stripe connected account balance
- [x] Webhook handles `account.updated` to set `stripe_onboarding_complete`

### UI/UX
- [x] Empty state illustrations for dashboard sections (Stats, Links, Highlights, Tip earnings, Analytics)
- [x] Reusable `EmptyState` component (`components/dashboard/empty-state.tsx`)
- [x] Landing page (14 sections) — see ARCHITECTURE.md
- [x] Premium dark theme with custom Tailwind tokens
- [x] Lenis smooth scroll + Framer Motion animation system
- [x] 3D mouse-tracking athlete card mockup
- [x] Scroll-triggered reveals, magnetic CTAs, spotlight cards, animated counters
- [x] Custom cinematic footer with parallax wordmark

### Dashboard
- [x] Dashboard editor with 5 tabbed sections (Bio, Stats, Links, Social, Highlights)
- [x] Profile completion score with progress bar
- [x] AI toolkit with 5 tools (Bio Builder, Pitch Writer, Caption Generator, Profile Optimizer, Rate Helper)
- [x] Billing panel with Stripe Checkout + Customer Portal
- [x] Analytics panel with 7d/30d/90d ranges
- [x] Tip earnings panel with payout balance

---

## Blocked / Needs User Action

### Gemini API Quota
- **Status:** BLOCKED
- **Issue:** `gemini-2.0-flash-lite` returns `limit: 0` for all free tier metrics
- **Action required:** User must enable billing on Google Cloud project
- **Impact:** AI tools (Bio Builder, Pitch Writer, Caption Generator, Profile Optimizer, Rate Helper) cannot generate

### Stripe Webhook — account.updated
- **Status:** NEEDS CONFIGURATION
- **Issue:** `account.updated` event not yet added to Stripe webhook endpoint
- **Action required:** User must add `account.updated` to Stripe Dashboard webhook settings
- **Impact:** `stripe_onboarding_complete` flag won't auto-set when Stripe onboarding finishes

### Supabase Migrations
- **Status:** NEEDS EXECUTION
- **Issue:** `supabase/migrations/20260617_tips.sql` must be run in Supabase SQL Editor
- **Action required:** User confirmed done, but verify in Supabase Dashboard

---

## Planned / Not Yet Built

### Immediate Next Steps
- [ ] AI streaming responses — don't make user wait for full output
- [ ] Edit before applying AI drafts
- [ ] Profile completion prompts after onboarding
- [ ] Weekly email digest of profile activity
- [ ] End-to-end test with live Stripe keys

### Short-term (Next Sessions)
- [ ] OG image generation for public cards (`@vercel/og`)
- [ ] QR code share for public card
- [ ] Social share buttons on public card
- [ ] Sport-specific stat templates (basketball, football, soccer, etc.)
- [ ] Theme picker for public card (accent color limited palette)
- [ ] Cover image upload for public card

### Medium-term
- [ ] Fan memberships — recurring fan revenue for athletes
- [ ] Exclusive content section on athlete card (member-only posts, media, updates)
- [ ] Fan dashboard (manage subscriptions, view content)
- [ ] Stripe subscriptions for fan recurring payments

### Long-term
- [ ] Brand-side tools — athlete discovery, campaign brief creation, inbound lead management
- [ ] Verified athlete profiles
- [ ] Campaign matching
- [ ] Team tier — multi-athlete accounts, bulk roster onboarding
- [ ] Roster analytics dashboard
- [ ] NIL deal disclosure flow
- [ ] Custom domain support

### Cross-cutting
- [ ] SEO — structured data on public profiles, sitemap, robots.txt
- [ ] Performance budget — public profiles < 50kB JS, < 1.5s LCP
- [ ] Privacy / compliance — GDPR, CCPA, COPPA
- [ ] Trust & safety — content moderation on bios, captions, fan messages
- [ ] Observability — Sentry for errors, PostHog for product analytics
- [ ] Usage monitoring per-user AI/API usage dashboards (admin)
- [ ] Content moderation (profiles, bios, fan messages) (admin)
- [ ] Payout management (view payouts, trigger payouts) (admin)
- [ ] Abuse detection (rate limits, spam flagging, suspicious patterns) (admin)

---

## Key Decisions Made

1. **Service role client everywhere** — RLS `TO anon` vs `authenticated` role mismatch caused silent failures. All profile reads/writes now use service role client.
2. **Singleton service role in middleware** — Created once at module level, reused across requests.
3. **`data.username` for revalidation** — `validated.username` is optional in updates; using the returned `data.username` ensures correct path revalidation.
4. **Gemini `systemInstruction` via model constructor** — Inline format caused SDK errors.
5. **Tips table + webhook recording** — Tips recorded on `checkout.session.completed` when metadata has `athleteos_athlete_id` (no `tier`).
6. **Stripe Connect onboarding** — Auto-creates Express account; `account.updated` webhook marks `stripe_onboarding_complete` when `charges_enabled && payouts_enabled`.

---

Last updated: 2026-06-17
