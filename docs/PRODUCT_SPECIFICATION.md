# PRODUCT_SPECIFICATION.md — AthleteOS Product Specification

> **Author:** AthleteOS Team
> **Version:** 1.0
> **Date:** 2026-07-09
> **Status:** Active Development (Phase 25 — Production Deployment)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Positioning](#2-product-vision--positioning)
3. [Target Users & Personas](#3-target-users--personas)
4. [Six Connected Layers](#4-six-connected-layers)
5. [Feature Specification](#5-feature-specification)
6. [Technical Architecture](#6-technical-architecture)
7. [Database Schema](#7-database-schema)
8. [API & Server Actions](#8-api--server-actions)
9. [Design System](#9-design-system)
10. [AI Strategy & Implementation](#10-ai-strategy--implementation)
11. [Monetization & Billing](#11-monetization--billing)
12. [Security & Compliance](#12-security--compliance)
13. [Performance Requirements](#13-performance-requirements)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment & Infrastructure](#15-deployment--infrastructure)
16. [Analytics & Monitoring](#16-analytics--monitoring)
17. [Roadmap & Milestones](#17-roadmap--milestones)
18. [Open Questions & Risks](#18-open-questions--risks)
19. [Appendix](#19-appendix)

---

## 1. Executive Summary

**AthleteOS** is a premium dark-themed NIL (Name, Image, Likeness) business operating system for student-athletes. It provides a public athlete identity card, built-in monetization rails, AI-assisted content generation, analytics, and admin oversight — all from a single platform.

### Key Value Propositions

- **One card, one link, your entire NIL business** — athletes get a premium public profile they can share everywhere
- **Monetize from day one** — tips, memberships, bookings, paid shoutouts via Stripe Connect
- **AI Copilot** — 5 AI tools (Bio Builder, Pitch Writer, Caption Generator, Profile Optimizer, Rate Helper) with shared quota pool
- **Business-grade analytics** — page views, link clicks, referrers, geo data, conversion tracking
- **God Mode admin** — full platform control with 8 admin modules
- **Mobile-first** — native-feel interactions, bottom navigation, pull-to-refresh, haptic feedback

### Current Status

| Metric | Value |
|--------|-------|
| Phases Completed | 24/25 |
| Components | 100+ |
| Server Actions | 37+ |
| Database Tables | 19+ |
| Migrations | 34 |
| Playwright Tests | 39 (production) |
| Landing Page Sections | 14 |
| AI Tools | 5 (+ Asset Vault) |
| Admin Modules | 8 |

---

## 2. Product Vision & Positioning

### Mission Statement

> Build the default business identity for ambitious athletes who want to turn attention into income.

### Positioning

> "Your NIL identity, monetization, and AI toolkit — all in one card."

### What We Are

- The athlete's operating system — the layer that makes them look professional, get discovered, and get paid
- A structured AI assistant (task-based, capped, monetized — not an open-ended chatbot)
- A revenue platform (tips, memberships, bookings, paid interactions)
- An analytics dashboard that makes athletes feel like a real business

### What We Are NOT

- A generic link-in-bio service (Linktree is too consumer / non-pro)
- A fan-only Patreon-style platform
- A brand-only marketplace
- An agency

### Brand Identity

| Item | Value |
|------|-------|
| Name | **AthleteOS** |
| Domain | `athleteos.app` (placeholder) |
| Tagline | One card. One link. Your entire NIL business. |
| Accent | `#C6FF3D` (electric lime) |
| Personality | Premium, confident, athlete-first, Gen Z |
| Logo | Lightning-bolt-style chart mark on lime square |

### Tone of Voice

- Bold, modern, premium, startup-grade
- Confident, not cheesy
- Sports energy + SaaS polish
- Investor-friendly clarity
- Gen Z native — not corporate

**Forbidden phrases:** "unlock your potential," "all-in-one solution," "revolutionize your journey," "empower your future," "unleash"

**Preferred verbs:** build, claim, share, launch, ship, plug in, turn on, get paid, get discovered, get drafted into the brand economy

---

## 3. Target Users & Personas

### Three Customer Types

| Customer | How They Pay | Build Phase |
|----------|-------------|-------------|
| **Athletes** | Brand tools, AI help, customization, analytics, monetization utilities | Phase 1 — supply side, identity layer |
| **Fans / Supporters** | Subscriptions, support tiers, exclusive content, shoutouts, digital access | Phase 2 — after athlete adoption |
| **Brands / Teams / Schools** | Discovery, verified profiles, campaign tools, bulk onboarding, data access | Phase 3 — after quality athlete profiles exist |

### Primary Personas

#### Persona 1: The Ambitious College Athlete
- **Age:** 18-22
- **Goal:** Build personal brand, attract NIL deals, look professional
- **Pain Points:** Scattered online presence, no consolidated monetization, confusing NIL landscape
- **Behavior:** Mobile-first, Instagram/TikTok native, willing to pay for premium tools
- **Conversion Path:** Landing page → Onboarding → Free card → Pro upgrade

#### Persona 2: The Small-School Athlete
- **Age:** 18-24
- **Goal:** Get discovered, maximize limited NIL opportunities
- **Pain Points:** Low visibility, no agent, limited resources
- **Behavior:** Highly engaged niche audience, values free tools
- **Conversion Path:** Discovery portal → Free card → AI tools → Monetization

#### Persona 3: The Brand/Sponsor
- **Goal:** Find authentic athlete partnerships, manage campaigns
- **Pain Points:** Fragmented athlete discovery, manual outreach, no verified data
- **Behavior:** Search-driven, values metrics and verification
- **Conversion Path:** Discovery portal → Saved athletes → Campaign briefs → Inquiries

### Go-To-Market Sequence

1. **Athletes first** (supply + identity)
2. **Fans second** (monetization)
3. **Brands third** (marketplace expansion)

**Rule:** Never start with a marketplace. Start with a useful single-player product that already helps one athlete make money or look sponsor-ready.

---

## 4. Six Connected Layers

| Layer | What It Does | Why It Matters |
|-------|-------------|----------------|
| **Identity** | Public athlete card/profile, QR share, links, stats, media, contact, verified badge | Gives the athlete a polished home page and makes the product instantly understandable |
| **Monetization** | Tips, memberships, bookings, paid shoutouts, affiliate links, digital offers | Creates revenue on day one instead of waiting for brand deals |
| **AI Copilot** | Bio writer, pitch writer, caption generator, rate guidance, profile optimizer | Saves athletes time and turns confusion into action |
| **Growth** | Analytics, conversion tracking, CTA testing, social performance prompts | Makes Pro feel like a business tool, not just a profile page |
| **Marketplace** (later) | Brand discovery, sponsor briefs, verified inbound leads, campaign matching | Expands ARPU after athlete adoption exists |
| **Control** | God Mode admin, moderation, payouts, abuse detection, plan controls, usage metering | Protects margins and keeps the whole machine under your control |

---

## 5. Feature Specification

### 5.1 Landing Page

**Route:** `/`
**Component:** `app/page.tsx` (composes 14 section components)

| Section | Component | Purpose |
|---------|-----------|---------|
| Announcement Bar | `announcement-bar.tsx` | Beta signal + "Claim your spot" link |
| Navbar | `navbar.tsx` | Sticky nav, scroll blur, mobile hamburger |
| Hero | `hero.tsx` | Animated gradient bg, typing headline, social proof, glow CTA, athlete card mockup |
| Trust Strip | `trust-strip.tsx` | Animated sport marquee |
| Problem | `problem.tsx` | 4-cell pain grid with spotlight cards |
| Solution | `solution.tsx` | Left copy + live profile preview |
| Features | `features.tsx` | 9-tile bento grid |
| How It Works | `how-it-works.tsx` | 4-step numbered process |
| AI Features | `ai-features.tsx` | Tool grid + sample pitch |
| Monetization | `monetization.tsx` | 6 revenue streams + dashboard mockup + animated counter/chart |
| Pricing | `pricing.tsx` | 3-tier teaser (Free, Pro, Team) |
| FAQ | `faq.tsx` | Accordion with 7 questions |
| Final CTA | `final-cta.tsx` | Waitlist email capture |
| Footer | `footer.tsx` | Parallax wordmark, newsletter, social links |

**Landing Page Goals (in order):**
1. Make the product instantly understandable
2. Drive waitlist signups
3. Look investor-ready and brand-ready
4. Set the bar for what an athlete platform feels like

### 5.2 Authentication System

**Routes:**
- `/auth/sign-up` — Email/password sign-up + Google OAuth
- `/auth/sign-in` — Email/password sign-in + Google OAuth
- `/auth/callback` — OAuth callback handler
- `/auth/confirm` — Email confirmation via token
- `/auth/error` — Auth error page with resend form
- `/auth/welcome` — Post-confirmation welcome page
- `/auth/forgot-password` — Forgot password page
- `/auth/reset-password` — Reset password page
- `/auth/unconfirmed` — Unconfirmed email redirect

**Providers:**
- Email/Password (Supabase Auth)
- Google OAuth

**Custom Email Confirmation:**
- Bypasses broken Supabase SMTP
- Uses Resend API directly
- UUID token stored in `profiles.confirmation_token` with 24h expiry
- `/api/auth/confirm-email` endpoint validates token

### 5.3 Onboarding Wizard

**Route:** `/onboarding`
**Component:** `app/onboarding/page.tsx`

**Steps:**
1. Username claim with availability check
2. Profile fields (name, sport, school, position, bio)
3. Avatar upload (Supabase Storage)
4. Live card preview

**Features:**
- Step progress indicator
- Smooth page transitions
- Real-time field validation
- Live preview of athlete card
- Published by default on completion

### 5.4 Public Athlete Card

**Route:** `/[username]`
**Component:** `components/profile-card.tsx`

**Features:**
- 3D flip animation (front/back faces)
- Photo carousel with crossfade transitions
- Rotating glow border via conic-gradient
- Front: Avatar, name, verified badge, sport/position/school, NIL Score badge, views/followers/stats
- Back: Bio, expandable links, highlight videos, social icons, membership tiers, Contact/Inquiry/Tip buttons
- QR code share modal
- Copy link / native share
- NIL Score animated SVG radial gauge
- SEO-optimized with JSON-LD Person schema

**Data Flow:**
```
Server Component (app/[username]/page.tsx)
  → getPublicProfile(username)
  → ProfileCard component
  → trackView(athleteId) on mount
```

### 5.5 Athlete Dashboard

**Route:** `/dashboard`
**Layout:** `app/dashboard/layout.tsx` (Sidebar + Header + BottomNav)

**Dashboard Sections:**

| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | `dashboard-content.tsx` | Overview with quick stats, profile completion, tip earnings, inquiry inbox |
| `/dashboard/profile` | `profile-editor.tsx` | 8-tabbed editor (Bio, Stats, Links, Social, Highlights, Theme, Tiers, Content) |
| `/dashboard/ai` | `ai-toolkit.tsx` | 5 AI tools + Asset Vault with shared quota |
| `/dashboard/analytics` | `analytics-panel.tsx` | Views, clicks, referrers, geo, views-by-day chart |
| `/dashboard/billing` | `billing-panel.tsx` | Subscription management, upgrade, usage meter |
| `/dashboard/compliance` | `compliance-client.tsx` | NIL deal disclosure, CSV export |
| `/dashboard/nil` | `nil-client.tsx` | NIL Value Engine cockpit |
| `/dashboard/settings` | `settings-panel.tsx` | 7 collapsible sections (Account, Appearance, Notifications, Security, Data, Danger Zone) |
| `/dashboard/notifications` | — | Notification center |

**Navigation:**
- Desktop: Collapsible sidebar (240px → 68px) with section grouping
- Mobile: Bottom tab bar (5 tabs: Home, AI, Analytics, Profile, More) with haptic feedback
- Header: Breadcrumbs, Cmd+K search, notification bell, user dropdown

### 5.6 AI Toolkit

**Route:** `/dashboard/ai`
**Component:** `components/dashboard/ai-toolkit.tsx`

**5 AI Tools:**

| Tool | Input | Output | Component |
|------|-------|--------|-----------|
| Bio Builder | Sport, school, position, tone | 3 polished bio variations | `ai-bio-builder.tsx` |
| Pitch Writer | Brand name, audience size, engagement, goal | Subject line + 3-paragraph pitch | `ai-pitch-writer.tsx` |
| Caption Generator | Post context (win/sponsorship/training) + tone | 3 captions with hashtags | `ai-caption-generator.tsx` |
| Profile Optimizer | Current card data | Scored critique + optimized bio + suggestions | `ai-profile-optimizer.tsx` |
| Rate Helper | Audience size, engagement, niche, past deals | Structured pricing guidance with dollar ranges | `ai-rate-helper.tsx` |

**6th Tab: AI Asset Vault**
- Save, browse, filter, star, edit, delete AI-generated outputs
- Filter tabs: All/Bio/Pitch/Caption/Optimize/Rate
- Inline editing, copy-to-clipboard, star toggle

**Quota System:**
- Shared pool across all tools
- Free: 5 actions/month
- Pro: 300 actions/month
- Elite: 500 actions/month
- Display: "X of 5 free actions left this month"

**Streaming:**
- True SSE streaming via Xiaomi MiMo API
- Token-by-token delivery
- Post-stream parsing into structured arrays

### 5.7 NIL Value Engine

**Route:** `/dashboard/nil`
**Component:** `components/dashboard/nil/`

**Features:**
- Data-driven scoring based on real performance stats (views, clicks, tips, social followers)
- Suggested rate ranges per tier (Post, Appearance, Campaign)
- Interactive deal evaluator (Pro/Elite gated)
- AI-powered valuation breakdown
- Social accounts editor for linking handles and audience counts
- Animated SVG radial gauge for NIL Score

**Data Model:**
- `nil_value_metrics` table — stores computed scores
- `social_accounts` table — OAuth-connected and manual social handles
- `nil_deals` table — deal evaluation history

### 5.8 Monetization System

#### Tips (Stripe Connect)

**Component:** `components/tip-button.tsx`
**Server Action:** `lib/actions/stripe.ts`

- Stripe Connect Express accounts for athletes
- 5% platform fee on all tips
- Preset amounts: $5, $10, $25, $50 + custom
- Glass morphism bottom sheet modal
- Tip notification email via Resend
- Idempotency guard on webhook processing

#### Subscriptions (Stripe Billing)

**Component:** `components/dashboard/billing-panel.tsx`
**Server Action:** `lib/actions/billing.ts`

| Tier | Price | AI Actions/Month |
|------|-------|-----------------|
| Free | $0 | 5 |
| Pro Athlete | $14/mo | 300 |
| Elite Athlete | $29/mo | 500 |
| Team/Collective | Custom | Pooled quotas |

**Features:**
- Stripe Checkout for subscription creation
- Customer Portal for management
- Graceful downgrade via `cancel_at_period_end`
- Success banner with retry polling
- Payment failure email notification
- Live Stripe tier derivation from price ID

#### Fan Memberships

**Component:** `components/dashboard/membership-tiers.tsx`
**Server Action:** `lib/actions/memberships.ts`

- Tier management (create, delete, pricing)
- Exclusive content posts (publish/unpublish, tier-gated)
- Fan subscription checkout via Stripe
- Tier-gated content display on public card

### 5.9 Analytics

**Component:** `components/dashboard/analytics-panel.tsx`
**Server Action:** `lib/actions/analytics.ts`

**Tracked Events:**
- Page views (`page_views` table) — with IP hashing for privacy
- Link clicks (`link_clicks` table) — per link/highlight

**Dashboard Features:**
- Total views, unique visitors, link clicks
- Views-by-day bar chart
- Top referrers, top links, top countries
- 7d/30d/90d range controls
- Date range presets (7d, 30d, 90d, All)
- Export dropdown (CSV, JSON)

**Privacy:**
- IP addresses hashed with SHA-256 + salt
- No raw IP storage
- 90-day raw log retention
- Analytics pruning cron (Sundays 3AM UTC)

### 5.10 Compliance OS

**Route:** `/dashboard/compliance`
**Component:** `components/dashboard/compliance-client.tsx`

**Features:**
- NIL deal disclosure system (company, value, compensation type, status)
- CSV export of disclosed deals ledger
- Admin audit for clearing/rejecting deals
- Deal status tracking (pending/cleared/rejected)

### 5.11 Brand-Side Tools

**Routes:**
- `/brands` — Brand landing page
- `/brands/setup` — Brand account creation
- `/brands/dashboard` — Saved athletes, campaigns
- `/brands/discover` — Athlete discovery with search

**Features:**
- Brand account creation and management
- Athlete discovery with search (authenticated brand dashboard)
- Campaign brief creation
- Inbound inquiry system (athlete inbox with status tracking)

### 5.12 Public Discovery Portal

**Route:** `/discover`
**Component:** `app/discover/client.tsx`

**Features:**
- Public (no auth required)
- Search by name, sport, school, position, minimum follower count
- Sport dropdown populated from live database
- Responsive card grid (1/2/3/4 columns)
- Each card: avatar, verified badge, plan badge, sport/school/position, bio, follower count
- Pagination with page buttons
- SEO-indexed with OG tags and sitemap entry

### 5.13 Team Tier

**Routes:**
- `/teams` — Teams landing page
- `/teams/setup` — Team creation
- `/teams/[teamId]` — Team dashboard

**Features:**
- Multi-athlete team accounts
- Team member management (add, remove, invite)
- Roster analytics dashboard
- Team pages at `athleteos.app/team/[team-id]`

### 5.14 God Mode Admin

**Route:** `/admin`
**Component:** `components/admin/admin-shell.tsx`

**8 Admin Modules:**

| Module | Component | Purpose |
|--------|-----------|---------|
| Dashboard | `admin-shell.tsx` | Live metrics (15s auto-refresh), recent tips/signups feeds |
| Users | `UserManagement.tsx` | Search, pagination, detail modal, admin actions (suspend, verify, plan override) |
| Waitlist | `waitlist-table.tsx` | Searchable table with CSV export |
| Audit Log | `AuditLogViewer.tsx` | Paginated log with filtering by action type and date |
| Usage | `UsageMonitor.tsx` | AI usage dashboard — per-plan quota, top users |
| Compliance | `ComplianceQueue.tsx` | NIL deal disclosure review queue |
| Financials | `FinancialsMonitor.tsx` | Platform revenue, tip volume, Stripe Connect status |
| Abuse | `AbuseDashboard.tsx` | Rate limit monitoring, flagged accounts |
| Settings | `PlatformSettings.tsx` | Feature flags, system toggles, maintenance mode |

**Security Hardening:**
- RLS lockdown on all tables
- Admin email check via `lib/admin.ts`
- Rate limiting (50 actions/hour per admin)
- Input sanitization on search queries
- Audit log immutability (3 levels: RLS DENY, BEFORE trigger, no permissive policy)

### 5.15 Email System

**Provider:** Resend API

| Email | Trigger | Content |
|-------|---------|---------|
| Confirmation | Sign-up | Verification link with 24h expiry |
| Welcome | Onboarding completion | Card URL, 3 quick-start tips, AI toolkit teaser |
| Card Published | First publish | Public card URL, QR code, sharing tips |
| New Inquiry | Brand sends inquiry | Brand name, message preview, CTA to respond |
| Tip Received | Athlete receives tip | Amount, supporter name, CTA |
| Weekly Briefing | Cron (Monday 8AM UTC) | Profile activity summary |
| Payment Failed | Stripe webhook | Actionable recovery instructions |

**Infrastructure:**
- Shared email layout component (`emailLayout()`)
- Email preference opt-out column on profiles
- Unsubscribe link in every email footer

### 5.16 SEO & Social Sharing

**Features:**
- Dynamic OG images via `@vercel/og` (edge runtime)
- JSON-LD Person schema on public cards
- `sameAs` links for social platforms
- Canonical URLs
- Dynamic `<title>` and `<meta description>` per athlete
- Dynamic sitemap including all published cards
- robots.txt generation

**Static Assets:**
- `og-image.png` (1200x630) — Facebook, LinkedIn, Slack
- `twitter-image.png` (1200x675) — Twitter/X
- `apple-icon.png` (180x180) — iOS home screen
- `icon.svg` — Browser favicon

### 5.17 Mobile Experience

**Features:**
- Bottom tab navigation (5 tabs) with haptic feedback
- Pull-to-refresh on dashboard overview
- Swipe cards for metrics carousel
- Bottom sheet for mobile menus
- Safe area insets for iPhone notch/Dynamic Island
- `viewport-fit: "cover"` for edge-to-edge
- `-webkit-tap-highlight-color: transparent`
- `maximumScale: 1` to prevent zoom on input focus
- Loading skeletons with shimmer animation

### 5.18 GDPR/CCPA Compliance

**Features:**
- Cookie consent banner with Accept/Decline
- PostHog opt-out on decline
- Data export (`exportUserData()` — profile, tips, inquiries, AI usage, analytics)
- Account deletion (`deleteAccount()` — deletes across 16+ tables)
- Persisted in localStorage (`athleteos_cookie_consent`)

### 5.19 Lock-In System (AI Memory & Telemetry)

**Features:**
- Silent behavioral telemetry recording tool usage preferences
- AI prompts adapt to athlete's preferred tone, length, and brand categories
- Weekly email briefings via Resend
- Contextual smart AI actions on dashboard (traffic drops, zero tips, missing bio)
- Compounding value milestones (Day 7/30/90 feature unlocks):
  - Day 7: Personalized Pitch Templates
  - Day 30: Pricing Helper PDF Export
  - Day 90: Elite Card Custom Layout

### 5.20 QR Sharing

**Component:** `components/dashboard/qr-share-modal.tsx`

**Features:**
- Glassmorphic modal with backdrop blur
- QR code generation via `qrcode` package on canvas
- Copy Link button
- Download PNG button
- Consistent with dashboard UI

---

## 6. Technical Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 14.2.15 (App Router) |
| Language | TypeScript | 5 (strict mode) |
| Styling | Tailwind CSS | 3.4 |
| Animation | Framer Motion | 11.x |
| Scroll | Lenis | 1.1.x |
| Icons | Lucide React | — |
| Database | Supabase Postgres | — |
| Auth | Supabase Auth | — |
| Email | Resend | — |
| Payments | Stripe | — |
| AI | Xiaomi MiMo (SSE streaming) | — |
| Error Monitoring | Sentry | — |
| Analytics | PostHog | — |
| Testing | Playwright + Jest | — |
| Deployment | Vercel | — |

### Directory Structure

```
AthleteOS/
├── app/                          # Next.js 14 App Router
│   ├── admin/                    # God Mode admin dashboard
│   ├── api/                      # API routes (auth, cron, stripe, waitlist)
│   ├── auth/                     # Authentication pages
│   ├── brands/                   # Brand-side tools
│   ├── dashboard/                # Athlete dashboard
│   ├── discover/                 # Public discovery portal
│   ├── fan/                      # Fan subscription pages
│   ├── onboarding/               # Multi-step onboarding wizard
│   ├── stripe/                   # Stripe status page
│   ├── teams/                    # Team tier pages
│   ├── [username]/               # Public athlete card (dynamic)
│   ├── globals.css               # Design tokens + utilities
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page composition
│
├── components/                   # All React components
│   ├── admin/                    # Admin dashboard components
│   ├── dashboard/                # Dashboard components
│   ├── layout/                   # Layout components (sidebar, header, bottom-nav)
│   ├── motion/                   # Animation primitives
│   ├── mobile/                   # Mobile-native UX components
│   ├── ui/                       # UI primitives (skeletons)
│   ├── onboarding/               # Onboarding components
│   └── providers/                # Context providers
│
├── lib/                          # Utilities and business logic
│   ├── actions/                  # Server Actions (37+ files)
│   ├── hooks/                    # Custom React hooks
│   ├── supabase/                 # Supabase client setup
│   ├── ai.ts                     # AI provider abstraction
│   ├── stripe.ts                 # Stripe client
│   ├── stripe-billing.ts         # Billing helpers
│   ├── resend.ts                 # Resend client
│   ├── storage.ts                # Storage abstraction
│   └── utils.ts                  # cn() helper
│
├── e2e/                          # Playwright test suites
├── __tests__/                    # Jest unit tests
├── supabase/                     # Database schema + migrations
├── docs/                         # Living documentation
├── public/                       # Static assets
└── scripts/                      # Build scripts
```

### Render Flow

```
app/layout.tsx
└── <html className="dark"><body>
    ├── <SmoothScroll>                  ← Lenis raf loop
    │   └── app/page.tsx
    │       └── <main>
    │           ├── <AnnouncementBar />
    │           ├── <Navbar />
    │           ├── <Hero />
    │           ├── <TrustStrip />
    │           ├── <Problem />
    │           ├── <Solution />
    │           ├── <Features />
    │           ├── <HowItWorks />
    │           ├── <AIFeatures />
    │           ├── <Monetization />
    │           ├── <Pricing />
    │           ├── <FAQ />
    │           ├── <FinalCTA />
    │           └── <Footer />
    │
    └── middleware.ts                    ← Session refresh + admin check
```

### Animation Pipeline

Three layers stack to give the site its motion personality:

1. **Smooth scroll** — Lenis intercepts native scroll, applies easing, animates page transform
2. **Scroll-triggered reveals** — Framer Motion `whileInView` with custom variants (Reveal, RevealStagger, RevealItem)
3. **Cursor-driven interactions** — Tilt (3D perspective), Magnetic (spring physics), Spotlight (radial glow), Counter (animated numbers)

### State Management

- No global state management (Redux, Zustand, etc.)
- Local `useState` in client components
- Auth state managed by Supabase Auth via cookies (server-side session)
- Profile state lifted to `DashboardContent` for cross-component sync

---

## 7. Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Extends Supabase Auth users with NIL-specific fields |
| `waitlist` | Email signups with source tracking |
| `newsletter` | Newsletter subscribers |
| `rate_limits` | Rate limiting entries |
| `page_views` | Public-card view events with hashed viewer IP |
| `link_clicks` | Outbound link/highlight click events |
| `ai_usage` | AI action tracking per user per month |
| `ai_saved_assets` | Saved AI-generated outputs (Asset Vault) |
| `audit_log` | Admin action audit trail |
| `membership_tiers` | Fan subscription tiers |
| `fan_subscriptions` | Fan subscription records |
| `content_posts` | Exclusive content for fan subscriptions |
| `tips` | Tip transactions via Stripe Connect |
| `brand_accounts` | Brand/sponsor accounts |
| `campaign_briefs` | Brand campaign briefs |
| `inquiries` | Inbound brand inquiries to athletes |
| `saved_athletes` | Brand's saved athlete list |
| `team_accounts` | Multi-athlete team accounts |
| `team_members` | Team member associations |
| `team_invites` | Team invitation records |
| `social_accounts` | OAuth-connected social handles |
| `nil_value_metrics` | NIL value scoring data |
| `nil_deals` | Deal evaluation history |
| `athlete_ai_memory` | AI behavioral telemetry |
| `ai_events` | AI usage event log |

### Key Columns on `profiles`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | FK to auth.users |
| `username` | TEXT | Unique handle for public card |
| `full_name` | TEXT | Display name |
| `sport` | TEXT | Primary sport |
| `school` | TEXT | School/university |
| `position` | TEXT | Position/role |
| `bio` | TEXT | Athlete bio |
| `avatar_url` | TEXT | Profile photo URL |
| `cover_url` | TEXT | Cover image URL |
| `plan` | TEXT | Subscription tier (free/pro/elite) |
| `profile_published` | BOOLEAN | Public card visibility |
| `onboarding_completed` | BOOLEAN | Onboarding status |
| `theme_accent` | TEXT | Card accent color |
| `theme_layout` | TEXT | Card layout style |
| `nil_score` | NUMERIC | Computed NIL value score |
| `email_confirmed` | BOOLEAN | Email verification status |
| `confirmation_token` | TEXT | Email confirmation token |
| `confirmation_expires` | TIMESTAMP | Token expiry |
| `stripe_customer_id` | TEXT | Stripe customer ID |
| `stripe_account_id` | TEXT | Stripe Connect account ID |
| `stripe_subscription_id` | TEXT | Stripe subscription ID |
| `pro_expires_at` | TIMESTAMP | Pro trial expiry |
| `waitlist_position` | INTEGER | Waitlist queue position |
| `email_preferences` | JSONB | Email notification preferences |

### Migrations

34 migration files spanning June 8 - July 7, 2026, covering:
- Phase 2 athlete fields
- Avatars storage
- Stripe Connect
- AI usage tracking
- Plan column
- RLS policies
- Admin hardening
- Analytics foundation
- Tips
- Email confirmation
- Lock-in system
- NIL Value Engine
- AI Asset Vault
- Social OAuth
- Referrals
- Card digest
- Team roles

---

## 8. API & Server Actions

### Server Actions (37+ files)

| File | Key Functions |
|------|--------------|
| `auth.ts` | `signUp`, `signIn`, `signInWithGoogle`, `signOut`, `resendConfirmationEmail`, `getCurrentUser` |
| `profile.ts` | `getMyProfile`, `checkUsername`, `updateProfile`, `getPublicProfile` |
| `ai.ts` | `generateBios`, `generatePitch`, `generateCaptionsAction`, `optimizeProfileAction`, `generateRateGuidanceAction` |
| `ai-usage.ts` | `getAiQuota`, `recordAiUsage`, `getPlan` |
| `ai-vault.ts` | `saveAssetToVault`, `getSavedAssets`, `toggleStarAsset`, `deleteAsset`, `updateAssetContent` |
| `ai-memory.ts` | `getAiMemory`, `recordAiEvent`, `recordToolEvent` |
| `billing.ts` | `createCheckoutSessionAction`, `createPortalSessionAction`, `getSubscriptionStatus` |
| `stripe.ts` | `createStripeConnectLink`, `getStripeDashboardLink` |
| `tips.ts` | `getTips`, `getTipEarnings`, `getPayoutBalance` |
| `analytics.ts` | `trackView`, `trackLinkClick`, `getAnalytics` |
| `admin.ts` | `listUsers`, `getAuditLogs`, `updateUserPlan`, `toggleUserStatus`, `logAdminAction` |
| `waitlist.ts` | `joinWaitlist`, `joinNewsletter`, `subscribeNewsletterAction` |
| `emails.ts` | `sendConfirmationEmail`, `sendWelcomeEmail`, `sendWeeklyBriefing` |
| `brand.ts` | `createBrandAccount`, `searchAthletes`, `saveAthlete`, `getCampaignBriefs` |
| `discovery.ts` | `searchPublicAthletes`, `getDiscoverySports` |
| `compliance.ts` | `discloseDeal`, `getMyDeals`, `updateDealStatus` |
| `inquiries.ts` | `submitInquiry`, `getAthleteInquiries`, `updateInquiryStatus` |
| `memberships.ts` | `createTier`, `getTiers`, `createContentPost`, `createSubscriptionCheckout` |
| `teams.ts` | `createTeam`, `getMyTeams`, `addTeamMember`, `getTeamAnalytics` |
| `quick-ai.ts` | `quickAiAction` (one-click signal actions) |
| `gdpr.ts` | `exportUserData`, `deleteAccount` |
| `referrals.ts` | Referral tracking |

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/waitlist` | GET | Waitlist/newsletter counts |
| `/api/stripe/webhook` | POST | Stripe webhook handler |
| `/api/stripe/diagnose` | GET | Stripe integration diagnostics |
| `/api/auth/confirm-email` | GET | Email confirmation endpoint |
| `/api/confirm-waitlist` | GET | Waitlist email confirmation |
| `/api/cron/weekly-briefing` | GET | Weekly briefing email cron |
| `/api/cron/prune-analytics` | GET | Analytics pruning cron |
| `/api/social/instagram/connect` | GET | Instagram OAuth flow |
| `/api/social/instagram/callback` | GET | Instagram OAuth callback |
| `/api/social/tiktok/connect` | GET | TikTok OAuth flow |
| `/api/social/tiktok/callback` | GET | TikTok OAuth callback |
| `/api/social/refresh` | GET | Refresh social follower counts |
| `/api/admin/*` | Various | Admin catch-all route |

---

## 9. Design System

### Color Tokens

| Token | Hex | Role |
|-------|-----|------|
| `bg.DEFAULT` | `#0A0A0B` | Page background |
| `bg.elev` | `#101012` | Elevated surfaces |
| `bg.card` | `#121216` | Card backgrounds |
| `line` | `#1C1C22` | Default border / divider |
| `ink.DEFAULT` | `#F5F5F7` | Primary text |
| `ink.muted` | `#9A9AA3` | Secondary text |
| `ink.dim` | `#6B6B74` | Tertiary text |
| `accent.DEFAULT` | `#C6FF3D` | Single accent — electric lime |
| `accent.soft` | `#E4FF8A` | Hover state |
| `accent.deep` | `#9BD400` | Pressed state |

**Rule:** Never introduce a second accent color. The lime is the entire visual identity.

### Typography

- **Font:** Inter (Google Fonts, self-hosted via `next/font`)
- **Display XL:** `clamp(3rem, 8vw, 6rem)` — Hero headline only
- **Display LG:** `clamp(2.25rem, 5vw, 4rem)` — Section headlines
- **Display MD:** `clamp(1.75rem, 3.5vw, 2.75rem)` — Smaller headers

### Component Patterns

- **Buttons:** `.btn-primary` (filled lime pill), `.btn-ghost` (bordered transparent pill)
- **Cards:** `.glow-card` (subtle white wash + border)
- **Glass:** `.glass` (subtle white wash + blur), `.glass-strong` (heavier)
- **Chips:** `.chip` (small rounded pill with border)
- **Eyebrow:** `.eyebrow` (small lime uppercase tracked label)

### Animation Tokens

| Name | Behavior | Duration |
|------|----------|----------|
| `fade-up` | Opacity 0→1 + Y 12→0 | — |
| `marquee` | TranslateX 0 → -50% | — |
| `pulse-soft` | Opacity 0.6 ↔ 1 | 2.4s |
| `orb-1` | Slow drift + scale | 18s |
| `orb-2` | Different drift path | 22s |
| `float-y` | Y -8 ↔ 0 | 5s |
| `draw` | stroke-dashoffset 500→0 | 2.5s |

### Accessibility

- Skip-to-content link
- Global focus ring (`:focus-visible { outline: 2px solid #C6FF3D }`)
- `prefers-reduced-motion` support throughout
- WCAG AA/AAA color contrast ratios
- Proper heading hierarchy (single h1, h2 per section)
- ARIA labels on all interactive elements
- Landmarks (`<header>`, `<main>`, `<footer>`, `<nav>`)

---

## 10. AI Strategy & Implementation

### Philosophy

AI is **task-based, capped, and monetized** — not an open-ended chatbot. Every AI action costs a quota point. AI is a **conversion trigger**, not a cost center.

### Provider

- **Xiaomi MiMo** (via API) with true SSE streaming
- Provider abstraction in `lib/ai.ts` allows future swaps
- Model configurable via `GEMINI_MODEL` env var

### Tools

1. **Bio Builder** — Turns raw athlete info into polished NIL-ready profiles
2. **Sponsor Pitch Writer** — Drafts outreach messages customized to sport, niche, audience, goals
3. **Caption Generator** — Short post copy for launches, wins, partnerships, CTAs
4. **Profile Optimizer** — Suggests better hooks, CTA placement, monetization blocks
5. **Rate/Readiness Helper** — Structured guidance on pricing logic and sponsor readiness

### Quota Structure

| Plan | AI Actions/Month |
|------|-----------------|
| Free | 5 |
| Pro | 300 + better templates |
| Elite | 500 + priority processing |
| Team/Agency | Pooled quotas, admin workflows |

### Lock-In System

- Behavioral telemetry records tool usage preferences
- AI prompts adapt to athlete's preferred tone, length, and brand categories
- Weekly email briefings with profile activity summary
- Contextual smart AI actions (traffic drops, zero tips, missing bio)
- Compounding value milestones (Day 7/30/90 feature unlocks)

---

## 11. Monetization & Billing

### Revenue Sources

1. Athlete subscription revenue
2. Fan/supporter membership revenue
3. Transaction fees on bookings, shoutouts, and paid interactions
4. Upsells for premium themes, verified badges, custom domains, exports, analytics
5. Later B2B revenue from teams, collectives, schools, brand tools

### Pricing Ladder

| Tier | Price | What's Included |
|------|-------|-----------------|
| **Free** | $0 | One card, limited links, limited AI (5/mo), basic support |
| **Pro Athlete** | $14/mo | More customization, analytics, better monetization blocks, more AI (300/mo) |
| **Elite Athlete** | $29/mo | Everything in Pro + advanced sponsor kit, custom branding, priority review |
| **Team/Collective** | Custom | Bulk onboarding, admin dashboard, shared branding, exports, usage oversight |

### Revenue Split

Athletes keep **92%+** after Stripe fees on monetization features.

### Stripe Integration

- **Stripe Connect Express** for athlete tips (5% platform fee)
- **Stripe Billing** for subscriptions (Checkout + Customer Portal + Webhooks)
- **Webhook events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- **API version:** `2024-11-20.acacia`

### Platform Constants

```typescript
PLATFORM_FEE_PERCENT = 5
MINIMUM_PAYOUT_CENTS = 2500
MINIMUM_TIP_CENTS = 500
```

---

## 12. Security & Compliance

### Authentication

- Email/password + Google OAuth via Supabase Auth
- Custom email confirmation via Resend (bypasses broken Supabase SMTP)
- Session refresh via Next.js middleware on every request

### Authorization

- Admin email check via `lib/admin.ts` (hardcoded list)
- RLS policies on all database tables
- Service role key only used server-side

### Data Protection

- IP addresses hashed with SHA-256 + salt (never stored in plain text)
- CSP headers with allowlists for Supabase, Stripe, Google Fonts
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restricting camera, microphone, geolocation

### Admin Security

- Rate limiting (50 actions/hour per admin)
- Input sanitization on search queries
- Audit log immutability (3 levels: RLS DENY, BEFORE trigger, no permissive policy)
- Plan value validation against strict allowlist

### GDPR/CCPA

- Cookie consent banner with Accept/Decline
- Data export (profile, tips, inquiries, AI usage, analytics)
- Account deletion (deletes across 16+ tables)
- PostHog opt-out on cookie decline

### COPPA Considerations

- High school athletes may be minors
- Age verification not yet implemented
- Parental consent flow not yet built

---

## 13. Performance Requirements

### Targets

| Metric | Target | Current |
|--------|--------|---------|
| Home page route size | < 80 kB | 60.5 kB |
| First Load JS | < 200 kB | 148 kB |
| Lighthouse Performance (mobile) | > 90 | TBD |
| Lighthouse Accessibility | > 95 | TBD |
| Lighthouse SEO | > 95 | TBD |
| LCP | < 1.5s | TBD |
| Public card load time | < 1.5s | TBD |
| Dashboard load time | < 2s | TBD |

### Optimizations Implemented

- AI toolkit lazy-loaded via `React.lazy` + `Suspense` (66% page size reduction)
- QR modal lazy-loaded
- Next/Image with `sizes` and `priority` props
- Sentry for error monitoring
- PostHog for product analytics

---

## 14. Testing Strategy

### Playwright Headless Browser Tests

**Config:** `playwright.prod.ts` (targets live Vercel URL)

**Test Categories (20):**
1. Landing Page (6 tests)
2. Navigation (7 tests)
3. Public Athlete Card (2 tests)
4. API Endpoints (2 tests)
5. SEO & Meta Tags (6 tests)
6. Performance (3 tests)
7. Accessibility (5 tests)
8. Mobile Responsiveness (3 tests)
9. Security Headers (2 tests)
10. Error Handling (2 tests)
11. Dashboard Navigation (4 tests)
12. Profile Editor (5 tests)
13. Analytics Panel (3 tests)
14. NIL Dashboard (3 tests)
15. AI Toolkit (3 tests)
16. Billing Panel (3 tests)
17. Settings & Notifications (4 tests)
18. Team Features (8 tests)
19. Mobile Navigation (9 tests)
20. Error States & Edge Cases (12 tests)

**Run Command:**
```powershell
npx playwright test e2e/full-audit.spec.ts --config=playwright.prod.ts
```

### Jest Unit Tests

**Config:** `jest.config.js`

### Test Coverage

- 39 production tests (expanding to 100+)
- 10 test categories
- All tests passing against live production

---

## 15. Deployment & Infrastructure

### Deployment Pipeline

| Stage | Command | Output |
|-------|---------|--------|
| Dev | `npm run dev` | `http://localhost:3000` |
| Lint | `npm run lint` | ESLint via `next lint` |
| Build | `npm run build` | `.next/` optimized bundle |
| Test | `npx playwright test` | Test results |
| Deploy | `git push` | Vercel auto-deploys |

### Infrastructure

| Service | Purpose | Details |
|---------|---------|---------|
| Vercel | Hosting + CI/CD | Auto-deploys on push to `main` |
| Supabase | Database + Auth | Postgres + Auth + RLS |
| Resend | Transactional email | 100 emails/day free tier |
| Stripe | Payments | Connect + Billing |
| Sentry | Error monitoring | Client/server/edge |
| PostHog | Product analytics | Autocapture + pageviews |

### Environment Variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard |
| `RESEND_API_KEY` | Resend Dashboard |
| `NEXT_PUBLIC_SITE_URL` | `https://athlete-os-vert.vercel.app` |
| `STRIPE_SECRET_KEY` | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard |
| `STRIPE_PRICE_ID_PRO` | Stripe Dashboard |
| `STRIPE_PRICE_ID_ELITE` | Stripe Dashboard |
| `GEMINI_API_KEY` | Google AI Studio |
| `GEMINI_MODEL` | `gemini-2.0-flash` |
| `ANALYTICS_IP_HASH_SECRET` | Generated secret |
| `SENTRY_DSN` | Sentry Dashboard |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog Dashboard |

### Production URL

`https://athlete-os-vert.vercel.app`

---

## 16. Analytics & Monitoring

### Product Analytics (PostHog)

- Autocapture (clicks, inputs, pageviews)
- Custom events (AI tool usage, profile edits, upgrades)
- User identification
- Session recording (optional)

### Error Monitoring (Sentry)

- Client-side error capture
- Server-side error capture
- Edge runtime error capture
- Source maps hidden in production
- Tunnel route `/api/sentry` to bypass ad blockers

### Platform Analytics

- Page views per athlete card
- Link clicks per link/highlight
- Unique visitors (IP hash dedup)
- Referrer tracking
- Geographic distribution
- Views-by-day charts

### Admin Monitoring

- 15-second auto-refresh on admin dashboard
- Live metrics: Active Users, Published Cards, Tips Today, Page Views
- Recent Tips feed with amounts and timestamps
- Recent Signups feed with names and times

---

## 17. Roadmap & Milestones

### Completed Phases (24/25)

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Marketing landing page | DONE |
| 1 | Waitlist + Auth | DONE |
| 2 | Athlete onboarding | DONE |
| 3 | Public athlete card | DONE |
| 4 | First monetization (Stripe Connect tips) | DONE |
| 5 | AI tools (5 tools + quota) | DONE |
| 6 | Subscription/paywall + usage metering | DONE |
| 7 | God Mode admin (8 modules) | DONE |
| 8 | Analytics + refinement | DONE |
| 9 | Fan memberships | DONE |
| 10 | Brand-side tools | DONE |
| 11 | Team tier | DONE |
| 12 | AI Asset Vault + Gamified Milestones | DONE |
| 13 | Email system | DONE |
| 14 | SEO + social sharing | DONE |
| 15 | Mobile polish | DONE |
| 16 | Performance optimization | DONE |
| 17 | Stripe hardening | DONE |
| 18 | Sentry error monitoring | DONE |
| 19 | PostHog analytics | DONE |
| 20 | GDPR/CCPA compliance | DONE |
| 21 | Landing page A/B testing | DONE |
| 22 | Cover image upload | DONE |
| 23 | Admin real-time dashboard | DONE |
| 24 | UI polish | DONE |
| 25 | Production deployment | NEXT |

### Phase 25 — Production Deployment

**Pre-launch:**
- [ ] Run full Playwright test suite against production
- [ ] Verify all environment variables in Vercel production
- [ ] Test Stripe webhook endpoints in live mode
- [ ] Confirm Resend email delivery in production
- [ ] Check Sentry error monitoring in production

**Deployment:**
- [ ] Deploy to Vercel production
- [ ] Verify custom domain configuration
- [ ] Test public card load times (<1.5s LCP)
- [ ] Test dashboard responsiveness on mobile

**User Acceptance Testing:**
- [ ] Complete sign-up flow as new athlete
- [ ] Create and publish athlete card
- [ ] Test AI toolkit (bio, pitch, caption, optimize, rate)
- [ ] Test Stripe Connect tip flow
- [ ] Test billing upgrade flow
- [ ] Test analytics data population
- [ ] Test notification delivery
- [ ] Verify email notifications

---

## 18. Open Questions & Risks

### Open Questions

1. Are HS athletes (under 18) in scope at launch, or college only?
2. Verification: how strict for the "verified athlete" badge? School email? Roster check?
3. International athletes — Stripe Connect availability varies by country
4. Team tier pricing model — per-seat or flat?
5. Marketplace direction — should brands also have an account, or stay anonymous inquirers?

### Risks

| Risk | Mitigation |
|------|-----------|
| Building too much before getting athlete usage | Ship the card fast, then iterate |
| Making AI expensive without enough monetization | Meter AI strictly, monetize from day one |
| Starting with a marketplace before supply exists | Single-player product first |
| Weak onboarding that fails to make athlete look good fast | Concierge onboarding for early users |
| No proof of revenue for the user (kills retention) | Track and show earnings from day one |
| COPPA compliance for minor athletes | Age verification and parental consent flows |
| Stripe Connect international availability | Country-specific onboarding flows |

---

## 19. Appendix

### Related Documents

| Document | Purpose |
|----------|---------|
| `VISION.md` | Master strategic blueprint |
| `CONTEXT.md` | Product/brand context |
| `ARCHITECTURE.md` | System architecture |
| `DESIGN_SYSTEM.md` | Visual tokens & motion |
| `COMPONENTS.md` | Component reference |
| `COPY.md` | Verbatim landing page copy |
| `CHANGELOG.md` | Session-by-session history |
| `ROADMAP.md` | Implementation phases |
| `DECISIONS.md` | Architecture decision records |
| `DEPLOYMENT.md` | Deploy workflow |
| `CREDENTIALS.md` | API keys, tokens, URLs |
| `DATABASE.md` | Database documentation |
| `QA_TESTING.md` | QA test plan |

### Operating Rules

1. Keep scope brutally narrow at first
2. Every feature must answer: "Does this help an athlete make money, look more professional, or save meaningful time?"
3. Treat AI usage like inventory — meter it and gate it
4. Build billing, moderation, and usage visibility into God Mode from the beginning
5. Focus on conversion metrics: profile completion, CTA clicks, upgrade rate, revenue per athlete, activation time

---

**Last updated:** 2026-07-09
**Maintained by:** AthleteOS Team
