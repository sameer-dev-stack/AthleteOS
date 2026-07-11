# ARCHITECTURE.md — System Architecture

> File structure, component map, render flow, animation pipeline.

---

## Directory Tree

```
NIL/
├── app/                          # Next.js 14 App Router
│   ├── admin/
│   │   ├── loading.tsx              # Admin loading skeleton
│   │   └── page.tsx              # Admin dashboar│   ├── api/
│   │   ├── auth/
│   │   │   └── confirm-email/
│   │   │       └── route.ts     # GET -> Email confirmation endpoint (custom Resend flow)
│   │   ├── cron/
│   │   │   ├── weekly-briefing/
│   │   │   │   └── route.ts     # GET → Weekly Resend briefing email cron route (protected)
│   │   │   └── prune-analytics/
│   │   │       └── route.ts     # GET → Weekly analytics pruning cron route (protected)
│   │   ├── confirm-waitlist/
│   │   │   └── route.ts         # GET → Waitlist email confirmation endpoint
│   │   ├── stripe/
│   │   │   └── webhook/route.ts     # POST -> Stripe webhook handler (subscription lifecycle)
│   │   └── waitlist/route.ts     # GET -> { waitlist, newsletter, mode } counts
│   ├── auth/
│   │   ├── callback/route.ts     # OAuth callback handler (Google, email confirmation)
│   │   ├── confirm/route.ts      # Email confirmation via token
│   │   ├── error/page.tsx        # Auth error page
│   │   ├── forgot-password/
│   │   │   └── page.tsx          # Forgot password page
│   │   ├── reset-password/
│   │   │   └── page.tsx          # Reset password page
│   │   ├── sign-in/page.tsx      # Email/password sign-in + Google OAuth
│   │   ├── sign-up/page.tsx      # Email/password sign-up + Google OAuth
│   │   ├── unconfirmed/page.tsx  # Unconfirmed email redirect page
│   │   └── welcome/page.tsx      # Post-confirmation welcome page
│   ├── brands/
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Brand dashboard — saved athletes, campaigns
│   │   │   └── error.tsx         # Brand dashboard error page
│   │   ├── discover/
│   │   │   ├── page.tsx          # Athlete discovery with search
│   │   │   └── error.tsx         # Brand discovery error page
│   │   ├── setup/
│   │   │   ├── page.tsx          # Brand account creation
│   │   │   └── error.tsx         # Brand setup error page
│   │   └── page.tsx              # Brand landing page
│   ├── discover/
│   │   ├── page.tsx              # Public athlete discovery portal (server)
│   │   ├── client.tsx            # Interactive explorer — filters, card grid, pagination (client)
│   │   └── error.tsx             # Discovery error page
│   ├── dashboard/
│   │   ├── loading.tsx           # Dashboard loading skeleton
│   │   ├── compliance/
│   │   │   ├── page.tsx          # Compliance page (server)
│   │   │   └── client.tsx        # Compliance deal list/disclosure form (client)
│   │   ├── nil/
│   │   │   ├── page.tsx          # NIL Value Engine cockpit (server component)
│   │   │   └── client.tsx        # NIL Dashboard client layout (client component)
│   │   ├── settings/
│   │   │   └── page.tsx          # Settings page with 7 collapsible sections
│   │   ├── ai/
│   │   │   ├── loading.tsx       # AI toolkit loading skeleton
│   │   │   └── error.tsx         # AI toolkit error page
│   │   ├── analytics/
│   │   │   ├── loading.tsx       # Analytics loading skeleton
│   │   │   └── error.tsx         # Analytics error page
│   │   ├── billing/
│   │   │   ├── loading.tsx       # Billing loading skeleton
│   │   │   └── error.tsx         # Billing error page
│   │   ├── profile/
│   │   │   ├── loading.tsx       # Profile editor loading skeleton
│   │   │   └── error.tsx         # Profile editor error page
│   │   ├── notifications/
│   │   │   └── error.tsx         # Notifications error page
│   │   ├── error.tsx             # Global dashboard error page
│   │   └── page.tsx              # Athlete dashboard (protected) — profile overview
│   ├── fan/
│   │   └── subscribe/
│   │       └── [tierId]/
│   │           ├── client.tsx    # Fan subscribe UI (client component)
│   │           └── page.tsx      # Fan subscription page (server component)
│   ├── onboarding/
│   │   └── page.tsx              # Multi-step onboarding wizard — username + profile
│   ├── stripe/
│   │   └── status/
│   │       └── page.tsx          # Admin-only Stripe webhook health status page
│   ├── suspended/
│   │   └── page.tsx              # Suspended account page
│   ├── teams/
│   │   ├── [teamId]/
│   │   │   ├── page.tsx          # Team dashboard — roster + analytics
│   │   │   └── error.tsx         # Team dashboard error page
│   │   ├── setup/
│   │   │   ├── page.tsx          # Team creation
│   │   │   └── error.tsx         # Team setup error page
│   │   └── page.tsx              # Teams landing page
│   ├── [username]/
│   │   ├── loading.tsx           # Public profile loading skeleton
│   │   └── page.tsx              # Public athlete card — dynamic by username
│   ├── error.tsx                 # Global error page with branded design
│   ├── not-found.tsx             # Custom 404 page with illustration and navigation
│   ├── globals.css               # Tailwind base + custom utilities + design tokens
│   ├── icon.svg                  # Favicon (file-based metadata convention)
│   ├── layout.tsx                # Root layout · Inter font · SmoothScroll wrapper · full metadata + JSON-LD
│   ├── page.tsx                  # Single landing page · composes all section components
│   ├── robots.ts                 # Generates /robots.txt at build time
│   ├── sitemap.ts                # Generates /sitemap.xml at build time
│   └── vercel.json               # Vercel settings and weekly-briefing cron configuration
│
│── components/                   # All React components (server by default)
│   ├── admin/
│   │   ├── admin-settings.tsx      # Admin settings panel — platform status + quick links (client)
│   │   ├── admin-shell.tsx         # Full admin workspace layout with sidebar (client)
│   │   ├── admin-tabs.tsx          # Tab navigation — Users, Waitlist, Audit, Settings (client)
│   │   ├── audit-log.tsx           # Audit log table (client)
│   │   ├── content-moderation.tsx  # Profile moderation queue — approve/flag (client)
│   │   ├── sign-out-button.tsx     # Sign out button (client)
│   │   ├── usage-monitor.tsx       # AI usage dashboard — stats, plans, top users (client)
│   │   ├── user-table.tsx          # User management table (client)
│   │   ├── waitlist-table.tsx      # Waitlist table with search + CSV export (client)
│   │   └── abuse-detection.tsx     # Security dashboard — rate limits, suspended (client)
│   │   └── payout-management.tsx   # Payout dashboard — Stripe Connect athletes (client)
│   │   └── god-mode/              # Premium Vite-ported admin modules
│   │       ├── AbuseDashboard.tsx  # Abuse detection and rate limit monitoring (client)
│   │       ├── AnalyticsOverview.tsx # Platform-wide analytics overview (client)
│   │       ├── AuditLogViewer.tsx  # Paginated audit log viewer with filtering (client)
│   │       ├── ComplianceQueue.tsx # NIL deal disclosure review queue (client)
│   │       ├── FinancialsMonitor.tsx # Platform revenue dashboard (client)
│   │       ├── PlatformSettings.tsx # Platform configuration panel (client)
│   │       ├── UsageMonitor.tsx    # AI usage monitoring dashboard (client)
│   │       ├── UserManagement.tsx  # Full user management with search, actions (client)
│   │       ├── supabase.ts        # Frontend API client for admin endpoints
│   │       └── types.ts           # Shared type definitions for admin modules
│   ├── dashboard/
│   │   ├── ai-asset-vault.tsx     # AI Asset Vault — saved outputs browser (client)
│   │   ├── ai-bio-builder.tsx    # AI bio generator form + results (client, streaming)
│   │   ├── ai-caption-generator.tsx  # AI social caption generator (client)
│   │   ├── ai-pitch-writer.tsx   # AI sponsor pitch writer (client)
│   │   ├── ai-profile-optimizer.tsx  # AI profile analysis + optimize (client)
│   │   ├── ai-rate-helper.tsx    # AI NIL pricing guidance (client)
│   │   ├── ai-toolkit.tsx        # Unified AI tools parent with tabs (client)
│   │   ├── analytics-panel.tsx   # Analytics dashboard panel (client)
│   │   ├── billing-panel.tsx     # Subscription billing + pricing cards (client)
│   │   ├── compounding-value.tsx # Days on platform compounding value lock-in card
│   │   ├── content-posts.tsx     # Exclusive content post management (client)
│   │   ├── dashboard-content.tsx # Dashboard state wrapper (client)
│   │   ├── empty-state.tsx       # Reusable empty state component
│   │   ├── inquiry-inbox.tsx     # Inbound inquiry management (client)
│   │   ├── launch-checklist.tsx  # Onboarding completion checklist
│   │   ├── membership-tiers.tsx  # Membership tier management (client)
│   │   ├── nil-ai-breakdown.tsx  # AI explanation panel with quota details (client)
│   │   ├── nil-deal-checker.tsx  # Deal evaluator form (client, Pro/Elite gated)
│   │   ├── nil-metrics-strip.tsx # Stats bar component displaying 5 NIL indicators
│   │   ├── nil-rate-table.tsx    # Suggested rate ranges per tier (client)
│   │   ├── nil-score-card.tsx    # Animated SVG radial gauge showing score + rank (client)
│   │   ├── profile-editor.tsx    # Tabbed profile editor with 8 sections (client)
│   │   ├── profile-score.tsx     # Profile completion score UI with progress bar
│   │   ├── qr-share-modal.tsx   # QR code share modal — glassmorphic (client)
│   │   ├── settings-panel.tsx    # Settings section components with collapsible sections
│   │   ├── smart-ai-actions.tsx  # One-click contextual AI prompts buttons (client)
│   │   ├── social-accounts-editor.tsx # Social account handles manager (client)
│   │   ├── system-status.tsx     # System health status with real-time checks
│   │   ├── theme-picker.tsx      # Card theme customization (client)
│   │   └── tip-earnings.tsx      # Tip earnings display (client)
│   ├── motion/                   # Animation primitives (all "use client")
│   │   ├── animated-gradient-bg.tsx  # Drifting radial gradient blobs for hero background
│   │   ├── counter.tsx           # In-view animated number with spring
│   │   ├── floating-elements.tsx # Decorative floating icons with gentle bob animation
│   │   ├── live-waitlist-count.tsx  # Fetches /api/waitlist, animates the real count
│   │   ├── magnetic.tsx          # Mouse-following spring wrapper for CTAs
│   │   ├── reveal.tsx            # Scroll-triggered fade/blur/lift (Reveal, RevealStagger, RevealItem)
│   │   ├── social-proof-avatars.tsx  # Named athlete avatars with hover tooltips
│   │   ├── spotlight.tsx         # Mouse-follow radial glow inside cards
│   │   ├── tilt.tsx              # 3D perspective tilt with cursor + sheen overlay
│   │   └── typing-text.tsx       # Typewriter cycling text animation
│   │
│   ├── layout/                   # Layout components
│   │   ├── bottom-nav.tsx        # Mobile bottom navigation with 5 tabs and haptic feedback
│   │   ├── header.tsx            # Global header with search, notifications, user dropdown, breadcrumbs
│   │   └── sidebar.tsx           # Collapsible sidebar with section grouping
│   ├── error-illustration.tsx    # Branded SVG illustrations for error pages
│   ├── announcement-bar.tsx      # Thin top strip · beta signal
│   ├── ai-features.tsx           # AI tools section · metered usage emphasis
│   ├── athlete-card.tsx          # Hero centerpiece · phone-frame mockup w/ 3D depth
│   ├── avatar-upload.tsx         # Reusable avatar upload with Supabase Storage (client)
│   ├── card-sections.tsx         # Reusable card section components — CardSection, StatItem, LinkCard, HighlightCard, InterestChip ("use client")
│   ├── dashboard-avatar.tsx      # Dashboard avatar wrapper with auto-save (client)
│   ├── faq.tsx                   # Accordion FAQ ("use client")
│   ├── features.tsx              # 9-tile bento grid
│   ├── final-cta.tsx             # Waitlist email capture ("use client")
│   ├── footer.tsx                # Premium footer w/ parallax wordmark ("use client")
│   ├── hero.tsx                  # Headline + CTAs + AthleteCard slot
│   ├── how-it-works.tsx          # 4-step process
│   ├── logo.tsx                  # Lime square w/ bolt-chart glyph
│   ├── monetization.tsx          # 6 revenue streams + dashboard mockup w/ chart
│   ├── navbar.tsx                # Sticky nav · scroll blur · mobile menu ("use client")
│   ├── photo-gallery.tsx         # Swipeable photo gallery with dot indicators ("use client")
│   ├── pricing.tsx               # 3-tier pricing teaser
│   ├── problem.tsx               # 4-cell pain grid
│   ├── profile-card.tsx          # Premium public profile card — vertical stack, expandable bio ("use client")
│   ├── public-card.tsx           # Full public athlete card ("use client") — dead code, not imported
│   ├── smooth-scroll.tsx         # Lenis provider ("use client")
│   ├── solution.tsx              # Left copy + live-profile preview
│   ├── tip-button.tsx            # Stripe tip modal — glass morphism bottom sheet ("use client")
│   └── trust-strip.tsx           # Animated sport marquee
│
├── lib/
│   ├── utils.ts                  # cn() — clsx + tailwind-merge
│   ├── ai.ts                     # Google Gemini provider — 5 generation functions
│   ├── storage.ts                # Storage abstraction — picks Supabase (prod) or file (local dev)
│   ├── resend.ts                 # Resend client setup
│   ├── stripe.ts                 # Stripe client (lazy Proxy pattern)
│   ├── stripe-billing.ts         # Checkout, Portal, Subscription lookup
│   ├── supabase/
│   │   ├── client.ts             # Browser client (for client components)
│   │   ├── server.ts             # Server client (for Server Actions + route handlers)
│   │   └── middleware.ts         # Middleware helper for auth session refresh
│   └── actions/
│       ├── admin.ts              # Server Actions: waitlist management + user/plan/status updates & audit logs
│       ├── ai.ts                 # Server Actions: generateBios, generatePitch, generateCaptionsAction, optimizeProfileAction, generateRateGuidanceAction
│       ├── ai-memory.ts          # Server Actions: getAiMemory, recordAiEvent, recordToolEvent (Lock-in System)
│       ├── ai-usage.ts           # Server Actions: getAiQuota, recordAiUsage, getPlan
│       ├── ai-vault.ts           # Server Actions: saveAssetToVault, getSavedAssets, getSavedAssetsCount, toggleStarAsset, deleteAsset, updateAssetContent
│       ├── analytics.ts          # Server Actions: trackView, trackLinkClick, getAnalytics
│       ├── auth.ts               # Server Actions: signUp, signIn, signOut, signInWithGoogle
│       ├── billing.ts            # Server Actions: createCheckoutSessionAction, createPortalSessionAction, getSubscriptionStatus
│       ├── brand.ts              # Server Actions: createBrandAccount, searchAthletes, saveAthlete, getCampaignBriefs
│       ├── compliance.ts         # Server Actions: discloseDeal, getMyDeals, updateDealStatus (Compliance OS)
│       ├── discovery.ts          # Server Actions: searchPublicAthletes, getDiscoverySports (public, no auth)
│       ├── emails.ts             # Email functions: sendConfirmationEmail, sendWelcomeEmail, sendWeeklyBriefing
│       ├── first-500-pro.ts      # Server Actions: assignFirst500ProBenefit, checkProExpiry
│       ├── inquiries.ts          # Server Actions: submitInquiry, getAthleteInquiries, updateInquiryStatus
│       ├── memberships.ts        # Server Actions: createTier, getTiers, createContentPost, createSubscriptionCheckout
│       ├── memberships-client.ts # Server Action: getTierForSubscription (for fan subscribe page)
│       ├── profile.ts            # Server Actions: getMyProfile, checkUsername, updateProfile, getPublicProfile
│       ├── quick-ai.ts           # Server Actions: quickAiAction (One-click signal actions)
│       ├── stripe.ts             # Server Actions: createStripeConnectLink, getStripeDashboardLink
│       ├── stripe-status.ts      # Server Actions: getStripeStatus
│       ├── teams.ts              # Server Actions: createTeam, getMyTeams, addTeamMember, getTeamAnalytics
│       ├── tips.ts               # Server Actions: getTips, getTipEarnings, getPayoutBalance
│       └── waitlist.ts           # Server Actions: joinWaitlist, joinNewsletter, subscribeNewsletterAction
│
├── data/                         # Gitignored — waitlist.json + newsletter.json (local-dev fallback only)
│
├── docs/                         # Living documentation (this folder)
│
├── public/                       # Static assets — generated by scripts/gen-og.js
│   ├── apple-icon.png            # 180x180 iOS home-screen icon
│   ├── og-image.png              # 1200x630 Open Graph card (Session 8)
│   └── twitter-image.png         # 1200x675 Twitter summary_large_image
│
├── scripts/
│   └── gen-og.js                 # Renders SVG → PNG social-share images via sharp
│
├── supabase/
│   ├── schema.sql                # Database schema — run in Supabase SQL Editor
│   └── migrations/
│       ├── 20260608_phase2_athlete_fields.sql
│       ├── 20260609_avatars_storage.sql
│       ├── 20260609_stripe_connect.sql
│       ├── 20260612_ai_usage.sql         # AI usage tracking table + RLS
│       ├── 20260612_phase6_plan_column.sql  # Subscription plan column on profiles
│       ├── 20260612_phase6_stripe_subscription.sql  # stripe_subscription_id column on profiles
│       ├── 20260612_rls_insert_profile.sql  # INSERT RLS policy for profiles (upsert fallback)
│       ├── 20260615_audit_log.sql        # Audit log schema + admin RLS policies
│       ├── 20260615_admin_hardening.sql  # Explicit DENY triggers, hardened is_admin(), rate-limit index
│       ├── 20260615_analytics_foundation.sql  # Analytics tables, indexes, RLS, 90-day cleanup helper
│       ├── 20260616_analytics.sql  # Analytics table/index/RLS migration aligned with schema.sql
│       ├── 20260617_first_500_pro_benefit.sql  # waitlist_position + pro_expires_at columns + indexes
│       ├── 20260617_tips.sql  # Tips table
│       ├── 20260617_fix_profile_rls_roles.sql  # RLS role fix
│       └── 20260619_email_confirmation.sql  # Email confirmation columns + index
│       ├── 20260702_lock_in_system.sql  # Lock-in system: athlete_ai_memory + ai_events tables
│       ├── 20260702_nil_value_engine.sql  # NIL Value Engine tables
│       └── 20260702_ai_asset_vault.sql  # AI Asset Vault: ai_saved_assets table + RLS
│
├── AGENTS.md                     # Rules for AI agents — ALWAYS READ FIRST
├── README.md                     # Public project intro
├── NIL.md                        # Original product brief (do not edit)
├── middleware.ts                  # Next.js middleware — refreshes Supabase session on every request
│
├── tailwind.config.ts            # Theme tokens · custom keyframes · animations
├── postcss.config.mjs            # Tailwind + autoprefixer
├── next.config.mjs               # Next.js config (strict mode on)
├── tsconfig.json                 # Strict TS · @/* path alias to repo root
├── .eslintrc.json                # extends next/core-web-vitals
├── next-env.d.ts                 # Next.js TS shim
├── .gitignore                    # node_modules, .next, .env*, data/
├── .env.example                  # Environment variable template
├── package.json
└── package-lock.json
```

---

## Render Flow

```
app/layout.tsx
└── <html className="dark"><body>
    ├── <SmoothScroll>                  ← Lenis raf loop + anchor link interception
    │   └── app/page.tsx
    │       └── <main>
    │           ├── <AnnouncementBar />  ← top trust strip
    │           ├── <Navbar />           ← sticky, scroll-blur
    │           ├── <Hero />
    │           │   └── <Tilt><AthleteCard /></Tilt>
    │           ├── <TrustStrip />       ← animated sport marquee
    │           ├── <Problem />          ← reveal + spotlight cards
    │           ├── <Solution />         ← reveal + tilt preview card
    │           ├── <Features />         ← 9-tile bento + spotlight
    │           ├── <HowItWorks />       ← 4-step + spotlight
    │           ├── <AIFeatures />       ← tool grid + sample pitch
    │           ├── <Monetization />     ← streams + dashboard mockup + animated counter/chart
    │           ├── <Pricing />          ← 3-tier + spotlight
    │           ├── <FAQ />              ← accordion (client)
    │           ├── <FinalCTA />         ← waitlist (client) + animated submission
    │           └── <Footer />           ← cinematic parallax wordmark
    │
    └── middleware.ts                    ← refreshes Supabase session on every request
```

---

## Animation Pipeline

Three layers stack to give the site its motion personality:

### 1. Smooth scroll — `components/smooth-scroll.tsx`
Lenis intercepts native scroll, applies easing (`(t) => 1 - 2^(-10t)` ish), and animates the page transform on its own `requestAnimationFrame` loop. Also hooks `a[href^="#"]` clicks to call `lenis.scrollTo(el, { offset: -60, duration: 1.4 })`.

CSS in `globals.css` handles `html.lenis` and `html.lenis-smooth` to prevent native `scroll-behavior: smooth` from conflicting.

### 2. Scroll-triggered reveals — `components/motion/reveal.tsx`
Framer Motion's `whileInView` with custom variants. Three exports:

| Component | Use |
|-----------|-----|
| `<Reveal>` | Single element fade+blur+rise on enter viewport. Supports `delay`, `y`, `amount`. |
| `<RevealStagger>` | Parent that orchestrates child stagger via `staggerChildren`. |
| `<RevealItem>` | Child of `<RevealStagger>` — inherits the parent's stagger timing. |

All respect `prefers-reduced-motion` and fall back to non-animated render.

### 3. Cursor-driven interactions
| Primitive | Mechanic |
|-----------|----------|
| `<Tilt>` | 3D perspective rotation via `useMotionValue` → `useSpring` → `useTransform`. Includes optional sheen overlay (`useMotionTemplate`). |
| `<Magnetic>` | Cursor pulls element with spring physics (configurable `strength`). |
| `<Spotlight>` | Inside cards — radial gradient follows cursor (`useMotionTemplate`). |
| `<Counter>` | Number counts up when in view via spring on a `MotionValue`. |

---

## State Management

None beyond local `useState` in client components:

- `components/faq.tsx` — `open: number | null` for accordion
- `components/final-cta.tsx` — `email`, `submitted` for waitlist form (uses `useFormState`)
- `components/navbar.tsx` — `scrolled`, `open` for scroll-blur + mobile menu
- `components/admin/waitlist-table.tsx` — `entries`, `search` for table filtering

Auth state is managed by Supabase Auth via cookies (server-side session).

---

## Data Flow

**Landing page:** Static HTML with sprinkled interactivity. No data fetching on the page itself.

**Waitlist form:** `FinalCTA` → `useFormState(joinWaitlist)` → Server Action → `getStorage()` → Supabase Postgres (prod) or file (local dev).

**Live counter:** `LiveWaitlistCount` → `GET /api/waitlist` → `getStorage().getCount()` → returns `{ waitlist, newsletter, mode }`.

**Admin dashboard:** Server Components & Actions (e.g. `listUsers`, `viewUser`, `getWaitlistEntries`) → Supabase Postgres under authenticated user session (RLS enforced, no service role client-side) → renders admin components. Also logs admin actions to `audit_log` via `logAdminAction`.

**Admin security layer:**
- `sanitizeSearch()` strips control chars, null bytes, and unsafe characters before any ILIKE query.
- `checkAdminRateLimit()` counts recent audit log entries for the same admin+action within a rolling 1-hour window; rejects if ≥ 50.
- `updateUserPlan()` validates the plan value against a strict allowlist (`free`, `pro`, `elite`).
- `audit_log` immutability is enforced at three levels: RLS DENY policies for UPDATE/DELETE, a `BEFORE` trigger that raises an exception (catches service_role too), and the absence of any permissive UPDATE/DELETE policy.

**AI Bio Builder:** `AIBioBuilder` (client) → `generateBios()` (Server Action) → Zod validation → `getAiQuota()` (check) → `generateBioVariations()` (Gemini API) → `recordAiUsage()` (Supabase) → returns 3 bios + updated quota → client renders results → "Apply to bio" → `updateProfile()` (Server Action) → Supabase update.

---

## Analytics & Privacy

The platform tracks public-card performance while prioritizing user privacy and system efficiency.

### Data Model
- **Raw Events:** `page_views` stores public-card views; `link_clicks` stores outbound link and highlight clicks.
- **Aggregation:** `getAnalytics()` aggregates server-side into totals, unique visitors, referrers, countries, views-by-day, and top links. No rollup table is required for the MVP dashboard.

### Tracking Flow
- **Public card:** `components/public-card.tsx` calls `trackView(profile.id)` on mount and `trackLinkClick(profile.id, label, url)` on link/highlight clicks.
- **Dashboard:** `components/dashboard/analytics-panel.tsx` calls `getAnalytics(athleteId, range)` for 7d, 30d, and 90d views.
- **Server action:** `lib/actions/analytics.ts` uses the Supabase service role for writes/reads, never exposes the service key client-side.

### PII Protection
- **IP Hashing:** IP addresses are never stored in plain text. Server actions hash the client IP with SHA-256 plus `ANALYTICS_IP_HASH_SECRET` before inserting into `viewer_ip_hash`.
- **Header capture:** Referrer and user-agent are captured from request headers for technical analysis, not identity resolution.
- **Geo:** `country` and `city` columns exist for future enrichment but are not populated in the MVP implementation.

### Retention Policy
- **Raw Logs:** Can be pruned after **90 days** via `public.cleanup_raw_analytics()` when a scheduler or manual job is added.
- **Rollups:** Not stored yet; analytics are computed from raw events on demand for the MVP.

### Access Control (RLS)
- **Service role:** Full access for server-side tracking and dashboard reads.
- **Athletes:** Can only `SELECT` analytics data belonging to their own `athlete_id`.
- **Anonymous:** Can `INSERT` new events but cannot read analytics data.

---

## Auth Flow

```
1. User signs up (email + password or Google OAuth)
2. Supabase Auth creates user in auth.users
3. Trigger auto-creates profile in profiles table
4. Email confirmation link sent via Resend
5. User clicks link → /auth/confirm → verifies token
6. Redirected to /auth/welcome
7. User signs in → session cookie set
8. Middleware refreshes session on every request; intercepts /admin/* paths and returns 403 if profiles.role != 'admin'
9. /admin page shows dashboard for authenticated and authorized admin users
```

---

## Build & Deploy

| Stage | Command | Output |
|-------|---------|--------|
| Dev | `npm run dev` | `http://localhost:3000` w/ hot reload |
| Lint | `npm run lint` | ESLint via `next lint` |
| Build | `npm run build` | `.next/` optimized production bundle |
| Serve | `npm start` | Production server on `:3000` |

**Deploy:** Vercel auto-deploys on push to `main`. See [DEPLOYMENT.md](./DEPLOYMENT.md).

**Bundle size baseline (last verified 2026-06-06):**
- Home page: ~60.5 kB
- First Load JS: ~148 kB
- Fully static (no API routes)

---

## TypeScript & Path Aliases

- Strict mode on
- `@/*` resolves to repo root (so `@/components/foo`, `@/lib/utils`)
- All components have prop interfaces inlined (no shared `types/` folder yet)

---

## Linting

ESLint via `next/core-web-vitals`. No custom rules currently. Run `npm run lint` before pushing.

---

## Testing

### Playwright Headless Browser Tests

| File | Purpose | Tests |
|------|---------|-------|
| `e2e/full-audit.spec.ts` | Comprehensive production audit | 106+ tests across 20 categories |
| `e2e/landing.spec.ts` | Basic landing page smoke tests | 3 tests |
| `playwright.prod.ts` | Production config (targets live Vercel URL) | — |
| `playwright.config.js` | Local dev config (auto-starts dev server) | — |

**Run against production:**
```powershell
npx playwright test e2e/full-audit.spec.ts --config=playwright.prod.ts
```

**Run against local dev:**
```powershell
npx playwright test e2e/full-audit.spec.ts
```

Test categories: Landing Page, Navigation, Public Athlete Card, API Endpoints, SEO & Meta Tags, Performance, Accessibility, Mobile Responsiveness, Security Headers, Error Handling, Dashboard Navigation, Profile Editor, Analytics Panel, NIL Dashboard, AI Toolkit, Billing Panel, Settings & Notifications, Team Features, Mobile Navigation, Error States & Edge Cases.

See `docs/QA_TESTING.md` for the full test matrix and latest results.

---

Last updated: 2026-07-08 (Session 97)
