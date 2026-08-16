# ROADMAP.md — Post-Landing Product Roadmap

> The landing page is shipped. This document describes what the actual product needs to become.
> **Master strategic blueprint:** See [VISION.md](./VISION.md) for the full product thesis, build order, and operating rules.
> Sourced from the original brief in `../NIL.md` and refined by [VISION.md](./VISION.md).

---

## Status Snapshot

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 0** | DONE | Marketing landing page (conversion + waitlist) |
| **Phase 1** | DONE | Waitlist capture backend + auth + email confirmation |
| **Phase 2** | DONE | **Athlete onboarding** — sign-up flow, profile creation |
| **Phase 3** | DONE | **Public athlete card** — `nilcard.app/username` |
| **Phase 4** | DONE | **First monetization feature** — Stripe Connect tips |
| **Phase 5** | DONE | **AI tools (metered)** — All 5 tools complete + plan-based quotas enforced |
| **Phase 6** | DONE | **Subscription/paywall + usage metering** — Stripe Billing wired, webhook handlers complete |
| **Phase 7** | DONE | **God Mode admin** — All 8 items: user mgmt, plan controls, audit log, sign-out, usage monitoring, content moderation, payout management, abuse detection |
| **Phase 8** | DONE | **Analytics + refinement** — raw event schema, server actions, dashboard panel, platform analytics |
| **Phase 9** | CUT (2026-08-05) | **Fan memberships** — REMOVED pre-MVP. Tiers/content posts/subscriber mgmt/Stripe subscriptions deleted from codebase (see Phase 9 section) |
| **Phase 10** | DONE | **Brand-side tools** — brand accounts, athlete discovery, campaign briefs, inbound inquiries, public discovery portal |
| **Phase 11** | DONE | **Team tier** — multi-athlete accounts, bulk onboarding, roster analytics, team pages |
| **Phase 12** | DONE | **AI Asset Vault + Gamified Milestones** — save/reuse AI outputs, Day 7/30/90 feature unlocks |
| **Phase 13** | DONE | **Email system** — Welcome, card published, inquiry/tip notifications, email preferences |
| **Phase 14** | DONE | **SEO + social sharing** — Dynamic OG images, JSON-LD, canonical URLs, Twitter cards |
| **Phase 15** | DONE | **Mobile polish** — Bottom tab nav, safe areas, viewport-fit, tap highlight |
| **Phase 16** | DONE | **Performance** — AI toolkit lazy-loaded (66% reduction), QR modal lazy |
| **Phase 17** | DONE | **Stripe hardening** — Unknown event 200, tip idempotency, shared constants, .env.example fix |
| **Phase 18** | DONE | **Sentry error monitoring** — Client/server/edge config, tunnel route, CSP updated |
| **Phase 19** | DONE | **PostHog analytics** — Autocapture, pageview tracking, provider in layout |
| **Phase 20** | DONE | **GDPR/CCPA** — Cookie consent banner, data export, delete account, PostHog opt-out |
| **Phase 21** | DONE | **Landing page A/B testing** — Cookie-persistent variant, navbar + hero CTAs 50/50 |
| **Phase 22** | DONE | **Cover image upload** — covers storage bucket, cover_url column, card displays cover |
| **Phase 23** | DONE | **Admin real-time dashboard** — 15s auto-refresh, live metrics, tips/signups feeds |
| **Phase 24** | DONE | **UI polish** — Sidebar navigation, header search, notifications, breadcrumbs, settings, billing, analytics presets, onboarding preview |
| **Phase 25** | NEXT | **Production deployment** — Deploy to Vercel production, user acceptance testing, monitor for issues |

---

## Phase 1 — Waitlist + Auth ✅ DONE

**Goal:** Make the waitlist form actually save emails. Set up the auth foundation so future phases plug in cleanly.

### ✅ Done (Session 11)
- [x] Supabase client setup (`lib/supabase/client.ts`, `server.ts`, `middleware.ts`)
- [x] Database schema: `waitlist`, `newsletter`, `profiles`, `rate_limits` tables (`supabase/schema.sql`)
- [x] Storage layer refactored from Vercel KV to Supabase Postgres (`lib/storage.ts`)
- [x] Auth server actions: `signUp`, `signIn`, `signInWithGoogle`, `signOut` (`lib/actions/auth.ts`)
- [x] Auth routes: `/auth/callback`, `/auth/confirm`, `/auth/error`, `/auth/welcome`
- [x] Resend client + confirmation/welcome email templates (`lib/resend.ts`, `lib/actions/emails.ts`)
- [x] Admin dashboard with waitlist table, search, CSV export (`app/admin/page.tsx`)
- [x] Source tracking on waitlist signups
- [x] Next.js middleware for session refresh
- [x] Documentation: DATABASE.md, .env.example, updated ARCHITECTURE/DEPLOYMENT/DECISIONS/COMPONENTS

### ✅ Done (Session 10)
- [x] `lib/storage.ts` abstraction with `kv` / `file` runtime selection
- [x] `lib/actions/waitlist.ts` refactored to use the storage layer
- [x] `app/api/waitlist/route.ts` returns `mode: "kv" | "file" | "unavailable"`
- [x] `docs/DEPLOYMENT.md` updated with one-time Vercel KV setup guide

### ✅ Done (Session 7)
- [x] Server Action `joinWaitlist` with zod validation, dedupe, rate-limit, honeypot
- [x] Server Action `subscribeNewsletterAction` for the footer form
- [x] `GET /api/waitlist` returns counts for live counter
- [x] `<LiveWaitlistCount>` component pulls real count into hero + FinalCTA
- [x] Form error state with `aria-invalid` + `aria-describedby` + `role="alert"`
- [x] `data/` gitignored, so submissions never leak to GitHub
- [x] Storage path overridable via `WAITLIST_FILE` / `NEWSLETTER_FILE` env vars

### ✅ Done (Session 16)
- [x] Confirmation email sent when someone joins waitlist
- [x] `confirmation_token` column added to Supabase
- [x] `/api/confirm-waitlist` route handles email link clicks
- [x] Vercel env vars verified (all 5 present in Production + Development)
- [x] Schema updated in `supabase/schema.sql`

### ⏳ Remaining (optional, low priority)
- [ ] Set up Google OAuth in Supabase Dashboard → Authentication → Providers → Google

**Definition of done:** Emails entered on the landing page show up in the database; user receives a confirmation email; clicking the link lands them in the auth flow. Admin can view and export waitlist entries.

---

## Phase 2 — Athlete Onboarding (week 1–2)

**Goal:** A clean sign-up flow where an athlete creates their account and builds their first profile.

### Sign-up flow
- [ ] Sign-up (email + social: Google, Apple)
- [ ] Username claim with availability check
- [ ] Sport + school picker (autocomplete from a dataset)
- [ ] Bio editor with character count
- [ ] Avatar + cover image upload (Vercel Blob or Cloudflare R2)
- [ ] Optional: athlete verification request (school email / Instagram blue check / ID upload)

**Definition of done:** Athlete can sign up, fill out basic info, and see their draft profile.

---

## Phase 3 — Public Athlete Card (week 3–4)

**Goal:** The core identity layer — a fast, shareable public profile at `nilcard.app/username`.

### Card features
- [ ] Server-rendered, fast, SEO-friendly
- [ ] Bio, sport, school, stats, highlights, media, verified badge
- [ ] Stats blocks (sport-specific templates)
- [ ] Highlight reel: video URL list (YouTube / TikTok / Hudl embeds)
- [ ] Custom links (label + URL + icon)
- [ ] Theme picker (accent color limited palette, layout variants)
- [ ] QR share, copy link, social share buttons
- [ ] Open Graph image generation (`@vercel/og`)
- [ ] Mobile-first layout

### Profile strength engine
- [ ] Scores card 0–100 with actionable suggestions
- [ ] "Complete your profile" prompts

**Definition of done:** An athlete can share `nilcard.app/their-name` to a phone that loads in <1 second on a mobile browser.

---

## Phase 4 — First Monetization Feature (week 5–6)

**Goal:** Athletes can actually receive money via their card on day one.

### Stripe setup
- [ ] Stripe Connect (Express) for athlete payouts
- [ ] Onboarding flow inside dashboard (KYC handled by Stripe)
- [ ] Webhooks for payment events, payout events, account updates

### Revenue stream #1: Tips (build first)
- [ ] Stripe Payment Element
- [ ] Suggested amounts ($3 / $5 / $10 / custom)
- [ ] No account required to send a tip
- [ ] Tip notification to athlete

**Definition of done:** An athlete connected via Stripe can receive a tip from a fan and see it in their dashboard within 60 seconds.

---

## Phase 5 — AI Tools ✅ DONE

**Goal:** Ship the metered AI tools advertised on the landing page. See [VISION.md](./VISION.md) for the full AI strategy.

### Provider choice
- [x] Pick Google Gemini (gemini-2.0-flash) — fast, cost-efficient, generous free tier
- [x] Build a thin LLM wrapper in `lib/ai.ts` so the provider can be swapped

### Quota infrastructure
- [x] `ai_usage` table: `(user_id, tool, used_count, period_start)`
- [x] Middleware that checks quota before each generation
- [x] On limit hit: return 402 + show upgrade prompt UI
- [ ] Pro plan check via Stripe subscription status

### AI tools
1. **Bio Generator** — Input: sport, school, accolades, tone. Output: 3 polished variations.
   - [x] `lib/ai.ts` — Gemini provider abstraction
   - [x] `lib/actions/ai-usage.ts` — Quota tracking
   - [x] `lib/actions/ai.ts` — Server action with Zod validation
   - [x] `components/dashboard/ai-bio-builder.tsx` — Client UI
   - [x] `supabase/migrations/20260612_ai_usage.sql` — Database table
   - [x] Dashboard integration
2. **Sponsor Pitch Writer** — Input: brand name + your audience stats. Output: subject line + 3-paragraph pitch.
   - [x] `lib/ai.ts` — `generateSponsorPitch()`
   - [x] `lib/actions/ai.ts` — `generatePitch()` server action
   - [x] `components/dashboard/ai-pitch-writer.tsx` — Client UI
3. **Caption Generator** — Input: post context (win, sponsorship, training) + tone. Output: 3 options w/ hashtags.
   - [x] `lib/ai.ts` — `generateCaptions()`
   - [x] `lib/actions/ai.ts` — `generateCaptionsAction()` server action
   - [x] `components/dashboard/ai-caption-generator.tsx` — Client UI
4. **Profile Optimizer** — Input: current card. Output: scored critique + rewritten sections with better hooks and CTA placement.
   - [x] `lib/ai.ts` — `optimizeProfile()`
   - [x] `lib/actions/ai.ts` — `optimizeProfileAction()` server action
   - [x] `components/dashboard/ai-profile-optimizer.tsx` — Client UI
5. **Rate/Readiness Helper** — Input: sport, audience size, engagement. Output: structured pricing guidance (with disclaimers).
   - [x] `lib/ai.ts` — `generateRateGuidance()`
   - [x] `lib/actions/ai.ts` — `generateRateGuidanceAction()` server action
   - [x] `components/dashboard/ai-rate-helper.tsx` — Client UI

### Shared infrastructure
- [x] `components/dashboard/ai-toolkit.tsx` — Unified parent component with tabs + quota banner
- [x] Shared quota pool: Free = 5 total/month, Pro = 300 total/month, Elite = 500 total/month
- [x] All tools integrated into dashboard via `<AIToolkit>`

### UX requirements
- [x] Show remaining quota visibly ("3 of 5 free actions left this month")
- [ ] Stream responses (don't make user wait for full output)
- [x] One-click "Use this draft" → applies to card (bio + optimizer)
- [ ] Edit before applying

**Definition of done:** Free user can generate 5 things total per month; Pro user generates up to 300. Quota resets monthly. Upgrade prompts trigger when hitting limits.

---

## Phase 6 — Subscription/Paywall + Usage Metering (week 10–11)

**Goal:** Gate features behind the pricing ladder and track all usage.

### Subscription infrastructure
- [x] Stripe Billing for recurring subscriptions (Checkout + Portal + Webhooks)
- [x] Plans: Free ($0), Pro ($14/mo, 300 AI/mo), Elite ($29/mo, 500 AI/mo)
- [x] Webhooks for subscription lifecycle events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`)
- [x] Plan enforcement via `profiles.plan` column + `getPlan()` helper
- [x] Billing panel UI (`components/dashboard/billing-panel.tsx`) with checkout flow + loading states
- [x] Dashboard integration (3:2 grid with AI Toolkit)
- [x] Checkout session creation with tier metadata + success/cancel redirects
- [x] Customer portal for subscription management + graceful cancellation

### Usage metering
- [x] Track AI actions per plan tier (Free=5, Pro=300, Elite=500)
- [x] Usage display in billing panel (progress bar + remaining count)
- [x] Upgrade flow (Stripe Checkout via billing panel)
- [ ] Downgrade flow (currently "Contact support" for elite→pro)
- [ ] Profile views / link click tracking (Phase 8)

### Remaining
- [x] Webhook handlers for checkout.session.completed + customer.subscription.updated/deleted
- [x] profiles.plan column updated on subscription events
- [x] 200 response returned on webhook success
- [ ] End-to-end test with live Stripe keys
- [ ] Configure webhook endpoint in Stripe Dashboard (listen for 5 events)
- [ ] Set webhook secret in `.env` and Vercel

**Definition of done:** A user on the Free plan hits their AI limit and sees an upgrade prompt. Clicking "Upgrade" takes them through Stripe checkout and unlocks the new tier immediately.

---

## Phase 7 — God Mode Admin (week 12–13)

**Goal:** Full admin control over the entire platform — billing, moderation, usage visibility.

### Admin features
- [x] User management (view, search, suspend) — paginated table with inline actions
- [x] Subscription management (view plans, change plan) — plan dropdown in user actions
- [x] Plan controls (override plan) — updateUserPlan() server action with audit logging
- [x] Audit log (all admin actions logged) — paginated table with action badges
- [ ] Usage monitoring (per-user AI/API usage, metering dashboards)
- [ ] Content moderation (profiles, bios, fan messages)
- [ ] Payout management (view payouts, trigger payouts)
- [ ] Abuse detection (rate limits, spam flagging, suspicious patterns)

**Definition of done:** All platform operations can be managed from a single admin dashboard without touching the database directly.

---

## Phase 8 — Analytics + Refinement (week 14–15)

**Goal:** Make athletes feel like a real business with numbers.

### Athlete analytics
- [x] Real-time view counts — `page_views` table with server-side IP hashing + 24h dedup
- [x] Click-through counts per link — `link_clicks` table tracking each link/highlight click
- [x] Referrer + country breakdown — `getAnalytics()` returns topReferrers and geoBreakdown
- [x] Views by day chart — `getAnalytics()` returns viewsByDay for bar chart
- [x] Dashboard analytics panel — `components/dashboard/analytics-panel.tsx` with 7d/30d/90d ranges
- [ ] Apply analytics SQL migrations to Supabase production
- [ ] Conversion funnel (visit → action → revenue)
- [ ] Weekly email digest of profile activity

### Refinement
- [ ] Profile completion prompts
- [ ] CTA performance testing
- [ ] Social performance insights

**Definition of done:** Athletes can see "Your profile got 143 views this week, and 12 people clicked your Tip link."

---

## Phase 9 — Fan Memberships (week 16–17) — CUT from MVP

**Goal:** Recurring fan revenue for athletes.

**Status:** REMOVED 2026-08-05. Post-MVP if ever — the MVP is the athlete card (name, contact, stats, photos, tips) only. Tiers create per-athlete recurring Stripe subscriptions, exclusive content gating, and subscriber management — too much surface for launch.

**If revisited:**
- [ ] Fan sign-up (email or social)
- [ ] Support tier selection ($3/$5/$10/mo)
- [ ] Exclusive content section on athlete card (member-only posts, media, updates)
- [ ] Stripe subscriptions for recurring payments
- [ ] Fan dashboard (manage subscriptions, view content)

**Definition of done (original):** A fan can subscribe to an athlete and get access to exclusive content in their feed.

---

## Phase 10 — Brand-Side Tools (week 18–20)

**Goal:** Allow brands to discover, vet, and message athletes.

### Brand features
- [ ] Brand account creation
- [ ] Athlete discovery (search by sport, school, audience size, location)
- [ ] Campaign brief creation
- [ ] Inbound lead management
- [ ] Verified athlete profiles
- [ ] Campaign matching

**Phase 1 (lightweight):** Inbound inquiry form on athlete card + categorized inbox.
**Phase 2 (full marketplace):** Brand discovery, campaign matching, structured deal flow.

**Important:** Do not start the marketplace until there are quality athlete profiles and engagement data.

---

## Phase 11 — Team Tier (week 21+)

**Goal:** Sell to schools, NIL collectives, agencies.

- [ ] Multi-athlete account structure
- [ ] Bulk roster onboarding (CSV upload + invite emails)
- [ ] Branded team landing page (`nilcard.app/team/stanford-basketball`)
- [ ] Roster analytics dashboard
- [ ] Compliance: NIL deal disclosure flow, school-side approval workflow
- [ ] Brand match-making: surface athletes that match a brand's audience
- [ ] Custom domain support (`nil.stanford.edu`)
- [ ] Contracts: pricing per seat, annual billing only

**Definition of done:** A school athletic department can onboard 50 athletes in an afternoon.

---

## Phase 12 — AI Asset Vault + Gamified Milestones ✅ DONE

**Goal:** Maximize athlete retention by letting them save and reuse AI outputs, and reward continued platform usage with feature unlocks.

### ✅ Done (Session 64)
- [x] **AI Asset Vault database** — `ai_saved_assets` table with RLS policies scoped to `auth.uid()`
- [x] **Server actions** — `saveAssetToVault`, `getSavedAssets`, `getSavedAssetsCount`, `toggleStarAsset`, `deleteAsset`, `updateAssetContent` with Zod validation
- [x] **Vault component** — filter tabs (All/Bio/Pitch/Caption/Optimize/Rate), asset cards with tool-type badges, inline editing, copy-to-clipboard, star toggle, delete with confirmation, empty state
- [x] **Vault tab in AI Toolkit** — 6th tab with Bookmark icon and saved asset count badge
- [x] **Save to Vault buttons** — added to all 5 AI tools (bio, pitch, caption, optimize, rate) with "Saved" confirmation
- [x] **Dashboard overview indicator** — "Saved Assets" row with count in Quick Stats, linking to vault
- [x] **Gamified milestones** — Redesigned CompoundingValue with Day 7/30/90 unlock milestones:
  - Day 7: Personalized Pitch Templates
  - Day 30: Pricing Helper PDF Export
  - Day 90: Elite Card Custom Layout
- [x] **Bug fixes** — fixed `loadPosts`/`loadTiers` scope issues, Stripe API version mismatch

**Definition of done:** Athletes can save any AI output with one click, browse/filter their saved library, and see tangible feature unlock rewards for continued platform usage.

---

## Phase 13 — Email System (Resend) ✅ DONE

**Goal:** Automated lifecycle emails that drive retention, engagement, and professionalism.

### Existing (already wired)
- [x] Confirmation email on sign-up (`sendConfirmationEmail`)
- [x] Weekly NIL briefing email (`sendWeeklyBriefing` — cron route)
- [x] Payment failed email (`sendPaymentFailedEmail` — Stripe webhook)

### New emails built
- [x] **Welcome email** — sent after onboarding completion. Includes: card URL, 3 quick-start tips, AI toolkit teaser
- [x] **Card published email** — sent on first publish. Includes: public card URL, QR code, sharing tips
- [x] **New inquiry email** — sent when a brand sends an inquiry. Includes: brand name, message preview, CTA to respond
- [x] **Tip received email** — sent when athlete receives a tip. Includes: amount, supporter name, CTA

### Infrastructure
- [x] Shared email layout component (`emailLayout()` — reusable dark template with header, footer, CTA)
- [x] Email preference opt-out column on profiles table (`email_preferences` jsonb)
- [x] Unsubscribe link in every email footer

**Definition of done:** Athlete signs up → gets welcome email. Publishes card → gets published email. Brand sends inquiry → athlete gets notified by email. Tip received → email notification.

---

## Phase 14 — SEO + Social Sharing ✅ DONE

**Goal:** Make every public card shareable with rich previews and discoverable by search engines.

### OG image generation
- [x] `@vercel/og` endpoint for dynamic Open Graph images (`/api/og/[username]`) — edge runtime, JSX-based
- [x] Card shows: avatar, name, sport, school, accent color
- [x] Fallback static OG image for crawlers that don't execute JS

### Structured data
- [x] JSON-LD `Person` schema on public card pages
- [x] `sameAs` links for Twitter, Instagram, TikTok, YouTube
- [x] Canonical URL via `alternates.canonical`

### Meta tags
- [x] Dynamic `<title>` and `<meta description>` per athlete
- [x] `og:image`, `og:url`, `twitter:card`, `twitter:images`
- [x] Canonical URL tag

### Sitemap
- [x] Dynamic sitemap including all published athlete cards
- [x] Include `/discover`, `/brands`, `/teams` pages

**Definition of done:** Sharing an athlete card link on Twitter/X produces a rich preview with their photo, name, and sport. Google indexes public cards.

---

## Phase 15 — Mobile Polish ✅ DONE

**Goal:** Dashboard and card feel native on mobile — fast, thumb-friendly, no dead zones.

### Navigation
- [x] Bottom tab bar on mobile (Home, AI, Analytics, Profile, More)
- [x] Bottom nav hidden on `md:` breakpoint
- [x] `pb-16 md:pb-0` on dashboard for bottom nav clearance

### Safe areas
- [x] Safe area insets for iPhone notch/Dynamic Island
- [x] `viewport-fit: "cover"` on root layout
- [x] `-webkit-tap-highlight-color: transparent` globally
- [x] `maximumScale: 1` on viewport to prevent zoom on input focus

**Definition of done:** The dashboard and card feel like a native app on iPhone/Android. Lighthouse mobile score > 90.
- [ ] Slide-out sidebar becomes bottom sheet on mobile
- [ ] Back gesture support (swipe right to go back)

### Dashboard mobile
- [ ] Metrics strip horizontally scrollable with snap
- [ ] Cards stack single-column with proper spacing
- [ ] Touch targets minimum 44px (iOS HIG)
- [ ] Pull-to-refresh on overview

### Card mobile
- [ ] Full-bleed photo, no wasted margins
- [ ] Swipe between stats/highlights/links sections
- [ ] Bottom CTA bar fixed on scroll
- [ ] Share sheet native feel (Web Share API)

### Polish
- [ ] Safe area insets for notch/Dynamic Island
- [ ] `viewport-fit=cover` for edge-to-edge
- [ ] Disable tap highlight on interactive elements
- [ ] Smooth 60fps scroll on all dashboard pages

**Definition of done:** The dashboard and card feel like a native app on iPhone/Android. Lighthouse mobile score > 90.

---

## Phase 16 — Performance ✅ DONE

**Goal:** Sub-2s load times, Lighthouse 90+, production-grade performance.

### Bundle optimization
- [x] AI toolkit: all 6 tools lazy-loaded via `React.lazy` + `Suspense` (page size: 8.99 kB → 3.09 kB, 66% reduction)
- [x] QR modal lazy-loaded in overview

### Images
- [x] Next/Image with `sizes` and `priority` props (existing)

### Monitoring
- [x] Sentry integration for error monitoring (Phase 18)
- [x] PostHog for product analytics (Phase 19)

**Definition of done:** Public cards load in <1.5s. Dashboard loads in <2s. Lighthouse mobile score consistently > 90.

---

## Phase 17 — Stripe Hardening ✅ DONE

**Goal:** Production-grade Stripe integration with proper error handling and idempotency.

### Webhook hardening
- [x] Unknown events return 200 (not 400) — prevents Stripe retry storms
- [x] Tip idempotency guard — checks `stripe_payment_intent_id` before insert
- [x] Tip received email notification wired into webhook

### Shared constants
- [x] `lib/constants.ts` — `PLATFORM_FEE_PERCENT=5`, `MINIMUM_PAYOUT_CENTS=2500`, `MINIMUM_TIP_CENTS=500`
- [x] `lib/actions/stripe.ts` uses `PLATFORM_FEE_PERCENT`
- [x] `lib/actions/balance.ts` uses `MINIMUM_PAYOUT_CENTS`

### Bug fixes
- [x] `tips.ts` `lastTipAmount` fixed — uses `net_amount` instead of `amount`
- [x] `.env.example` fixed — `STRIPE_PUBLISHABLE_KEY` (was `NEXT_PUBLIC_`), added `STRIPE_PRICE_ID_PRO`/`STRIPE_PRICE_ID_ELITE`
- [x] Diagnose endpoint — removed leaked webhook secret prefix from response

---

## Phase 18 — Sentry Error Monitoring ✅ DONE

**Goal:** Real-time error tracking with source maps and tunnel route.

### Setup
- [x] `@sentry/nextjs` installed and configured
- [x] `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- [x] `instrumentation.ts` for server/edge init
- [x] `next.config.mjs` wrapped with `withSentryConfig`
- [x] Source maps hidden in production
- [x] Tunnel route `/api/sentry` to bypass ad blockers
- [x] CSP updated to allow `*.ingest.sentry.io`

---

## Phase 19 — PostHog Product Analytics ✅ DONE

**Goal:** Understand user behavior with autocapture and pageview tracking.

### Setup
- [x] `posthog-js` installed
- [x] `PostHogProvider` in `components/providers/posthog-provider.tsx`
- [x] Autocapture, pageview tracking, localStorage+cookie persistence
- [x] Provider wrapped in root layout

---

## Phase 20 — GDPR/CCPA Compliance ✅ DONE

**Goal:** Cookie consent, data export, and account deletion.

### Cookie consent
- [x] Cookie consent banner with Accept/Decline buttons
- [x] Persisted in localStorage (`athleteos_cookie_consent`)
- [x] Decline triggers PostHog opt-out

### Data rights
- [x] `exportUserData()` server action — exports profile, tips, inquiries, AI usage, analytics
- [x] `deleteAccount()` server action — deletes all user data across 16+ tables

---

## Phase 21 — Landing Page A/B Testing ✅ DONE

**Goal:** Test CTA copy variants to improve conversion.

### Implementation
- [x] `useAbTest()` hook — cookie-persistent variant assignment (50/50 A/B)
- [x] Navbar CTA text variant: "Get started" vs "Launch your card"
- [x] Hero CTA text variant: "Claim your athlete card" vs "Get your free card"
- [x] Hero subtext variant: "Free to start" vs "Set up in 2 minutes"

---

## Phase 22 — Cover Image Upload ✅ DONE

**Goal:** Let athletes personalize their card with a cover image.

### Implementation
- [x] `cover_url` column added to profiles table
- [x] `covers` storage bucket with RLS policies
- [x] `CoverImageUpload` component — upload, preview, remove
- [x] Profile editor updated with cover image section
- [x] Public card displays cover with gradient fade into content

---

## Phase 23 — Admin Real-time Dashboard ✅ DONE

**Goal:** Live platform metrics for admin monitoring.

### Implementation
- [x] `RealtimeDashboard` component — new admin tab
- [x] 15-second auto-refresh interval
- [x] Live metrics grid: Active Users, Published Cards, Tips Today, Page Views
- [x] Secondary stats: Total Profiles, Tips Count, AI Usage
- [x] Recent Tips feed with amounts and timestamps
- [x] Recent Signups feed with names and times
- [x] Manual refresh button with last-refresh timestamp

---

## Phase 24 — UI Polish ✅ DONE

**Goal:** Dashboard UX improvements — navigation, search, settings, billing, analytics, onboarding.

### ✅ Done (Session 69)
- [x] **Sidebar navigation** — Collapsible sidebar with section grouping and active state
- [x] **Header search (Cmd+K)** — Command palette with fuzzy search and keyboard navigation
- [x] **Notification system** — Real-time notification center with event types and read/unread states
- [x] **User dropdown menu** — Account menu with profile, settings, billing, sign-out
- [x] **Breadcrumb navigation** — Context-aware breadcrumbs showing dashboard location
- [x] **Settings page** — User preferences form (email, privacy, notifications)
- [x] **Billing page with usage meter** — Dedicated billing view with subscription details and usage progress
- [x] **Analytics with date presets** — 7d, 30d, 90d, custom date range filtering
- [x] **Onboarding with live preview** — Multi-step wizard with real-time card preview
- [x] **Public card with NIL score** — Animated NIL score gauge on public profiles
- [x] **Hero with animations** — Scroll-triggered reveals, magnetic CTAs, animated counters

---

## Phase 25 — Production Deployment 🔄 NEXT

**Goal:** Ship to production and validate with real users.

### Pre-launch
- [ ] Run full Playwright test suite against production (`npx playwright test e2e/full-audit.spec.ts --config=playwright.prod.ts`)
- [ ] Verify all environment variables in Vercel production
- [ ] Test Stripe webhook endpoints in live mode
- [ ] Confirm Resend email delivery in production
- [ ] Check Sentry error monitoring in production

### Deployment
- [ ] Deploy to Vercel production (`athlete-os-vert.vercel.app`)
- [ ] Verify custom domain configuration (if applicable)
- [ ] Test public card load times (<1.5s LCP)
- [ ] Test dashboard responsiveness on mobile devices

### User Acceptance Testing
- [ ] Complete sign-up flow as new athlete
- [ ] Create and publish athlete card
- [ ] Test AI toolkit (bio, pitch, caption, optimize, rate)
- [ ] Test Stripe Connect tip flow
- [ ] Test billing upgrade flow
- [ ] Test analytics data population
- [ ] Test notification delivery
- [ ] Verify email notifications (welcome, card published, tip received)

### Monitoring
- [ ] Monitor Sentry for error spikes
- [ ] Monitor Vercel analytics for performance
- [ ] Monitor Stripe for payment issues
- [ ] Monitor Supabase for database performance
- [ ] Set up uptime monitoring

---

## Cross-cutting concerns (run alongside all phases)

- **SEO** — proper structured data on public profiles (`Person` + `SportsTeam` schema), sitemap, robots.txt
- **Performance budget** — public profiles < 50kB JS, < 1.5s LCP
- **Privacy / compliance** — GDPR, CCPA, COPPA (some HS recruits are minors)
- **Trust & safety** — content moderation on bios, captions, fan messages
- **Observability** — Sentry for errors, PostHog for product analytics
- **Documentation** — keep `docs/` updated per `AGENTS.md` rules
- **Automated testing** — Playwright headless browser tests against production (39 tests, 10 categories). Run `npx playwright test e2e/full-audit.spec.ts --config=playwright.prod.ts` before every deploy. See `docs/QA_TESTING.md` for full test matrix.

---

## Open questions

1. Are HS athletes (under 18) in scope at launch, or college only?
2. Verification: how strict for the "verified athlete" badge? School email? Roster check?
3. International athletes — Stripe Connect availability varies by country
4. Team tier pricing model — per-seat or flat?
5. Marketplace direction — should brands also have an account, or stay anonymous inquirers?

These will become ADRs in `DECISIONS.md` when answered.

---

Last updated: 2026-07-05 (Session 68)
