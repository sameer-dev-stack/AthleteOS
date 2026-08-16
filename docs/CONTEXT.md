# CONTEXT.md — Master Project Context

> Read this if you need to understand the *why* behind the product, brand, and design choices.
> **Strategic blueprint:** See [VISION.md](./VISION.md) for the full product thesis, build order, and operating rules.
> If you only have time for one doc, read VISION.md first, then this one.

---

## Mission

Build the **default business identity for ambitious athletes who want to turn attention into income**.

Athletes today juggle Instagram bios, TikTok link-trees, Hudl highlights, DM-based deal flow, and zero consolidated monetization. AthleteOS replaces all of that with one premium athlete card + built-in revenue tools + structured AI assistants, so the athlete can act like a real personal brand and business.

---

## Product Concept

The product is positioned as the **business OS for athletes** — not just a digital card, not just a link-in-bio, and not just a marketplace.

The card is the front-end identity layer. The real value is the system behind it.

### Six Connected Layers

| Layer | What it does | Why it matters |
|-------|-------------|----------------|
| **Identity** | Public athlete card/profile, QR share, links, stats, media, contact, verified badge | Gives the athlete a polished home page and makes the product instantly understandable |
| **Monetization** | Tips, memberships, bookings, paid shoutouts, affiliate links, digital offers | Creates revenue on day one instead of waiting for brand deals |
| **AI Copilot** | Bio writer, pitch writer, caption generator, rate guidance, profile optimizer | Saves athletes time and turns confusion into action |
| **Growth** | Analytics, conversion tracking, CTA testing, social performance prompts | Makes Pro feel like a business tool, not just a profile page |
| **Marketplace** (later) | Brand discovery, sponsor briefs, verified inbound leads, campaign matching | Expands ARPU after athlete adoption exists |
| **Control** | God Mode admin, moderation, payouts, abuse detection, plan controls, usage metering | Protects margins and keeps the whole machine under your control |

---

## Three Customer Types

| Customer | How they pay | When to build |
|----------|-------------|---------------|
| **Athletes** | Brand tools, AI help, customization, analytics, monetization utilities | **Phase 1** — supply side, identity layer |
| **Fans / Supporters** | Tips (platform-collected), shoutouts, digital access | **Phase 2** — after athlete adoption |
| **Brands / Teams / Schools** | Discovery, verified profiles, campaign tools, bulk onboarding, data access | **Phase 3** — after quality athlete profiles exist |

**Sequence matters:** Athletes first (supply + identity), then fans (monetization), then brands (marketplace expansion). Never start with a marketplace.

---

## Positioning

> *"Your NIL identity, monetization, and AI toolkit — all in one card."*

Landing page tagline:
> **One card. One link. Your entire NIL business.**

We are **not**:
- A generic link-in-bio service (Linktree is too consumer / non-pro)
- A fan-only Patreon-style platform
- A brand-only marketplace
- An agency

We **are**: the athlete's operating system — the layer that makes them look professional, get discovered, and get paid, with structured AI doing the writing in the background.

**Core promise:**
An athlete signs up once, gets a premium public identity page, gets guided toward revenue opportunities, and upgrades when they need more reach, more AI help, or more monetization tools.

---

## Tone of Voice

- Bold, modern, premium, startup-grade
- Confident, not cheesy
- Sports energy + SaaS polish
- Investor-friendly clarity
- Gen Z native — not corporate

**Forbidden phrases:** "unlock your potential," "all-in-one solution," "revolutionize your journey," "empower your future," "unleash."

**Preferred verbs:** build, claim, share, launch, ship, plug in, turn on, get paid, get discovered, get drafted into the brand economy.

---

## Visual Direction

- **Dark, minimal, premium sports-tech** aesthetic
- High contrast, strong type, clean grid
- One accent color only: **electric lime `#C6FF3D`**
- No purple AI gradients
- Avoid generic SaaS templating (no 3-column-cards-for-everything)
- Mockups feel like real product, not stock illustrations
- Mobile-first

---

## Brand

| Item | Value |
|------|-------|
| Name | **AthleteOS** |
| Domain (canonical) | `nilcard.app` |
| Domain (Vercel deploy) | `athlete-os-vert.vercel.app` |
| Tagline | One card. One link. Your entire NIL business. |
| Accent | `#C6FF3D` (electric lime) |
| Personality | Premium, confident, athlete-first, gen Z |
| Logo | Lightning-bolt-style chart mark on lime square (see `components/logo.tsx`) |

---

## Business Model

### Revenue Sources
- Athlete subscription revenue
- Fan/supporter membership revenue
- Transaction fees on bookings, shoutouts, and paid interactions
- Upsells for premium themes, verified badges, custom domains, exports, analytics
- Later B2B revenue from teams, collectives, schools, brand tools

### Pricing Ladder

| Tier | Price (placeholder) | What it includes |
|------|--------------------|------------------|
| **Free** | $0 | One card, limited links, limited AI (5–10/mo), basic support |
| **Pro Athlete** | $14/mo | More customization, analytics, better monetization blocks, more AI (100–300/mo) |
| **Elite Athlete** | $29/mo | Everything in Pro + advanced sponsor kit, custom branding, priority review |
| **Team/Collective** | Custom | Bulk onboarding, admin dashboard, shared branding, exports, usage oversight |

**Revenue split:** Athletes keep 92%+ after Stripe fees on monetization features.

**Psychology:** Free gets them in. Pro feels like a business upgrade. Elite feels like ambition/status. Team becomes the bigger-ticket offer.

---

## AI Strategy

AI is **task-based, capped, and monetized** — not an open-ended chatbot. See [VISION.md](./VISION.md) for the full AI strategy.

### MVP AI Features (build order)
1. **AI Bio Builder** — turns raw athlete info into a polished NIL-ready profile
2. **Sponsor Pitch Writer** — drafts outreach messages customized to sport, niche, audience, goals
3. **Caption Generator** — short post copy for launches, wins, partnerships, CTAs
4. **Profile Optimizer** — suggests better hooks, CTA placement, monetization blocks, cleaner copy
5. **Rate/Readiness Helper** — structured guidance on pricing logic and sponsor readiness (with disclaimers)

### Metering
| Plan | AI Actions/Month |
|------|-----------------|
| Free | 5–10 |
| Pro | 100–300 + better templates |
| Team/Agency | Pooled quotas, admin workflows, exports, managed analytics |

AI is a **conversion trigger**, not a cost center.

---

## Landing Page Goals (in order)

1. Make the product instantly understandable
2. Drive waitlist signups
3. Look investor-ready and brand-ready
4. Set the bar for what an athlete platform feels like

Primary CTA: **Get started** (`/onboarding`)
Secondary CTA: **See how it works** (scroll to How It Works section)

---

## What's Built So Far

### Core Platform (Phases 0–12)
- Full landing page (14 sections) — see [ARCHITECTURE.md](./ARCHITECTURE.md)
- Premium dark theme with custom Tailwind tokens
- Lenis smooth scroll + Framer Motion animation system
- 3D mouse-tracking athlete card mockup
- Scroll-triggered reveals, magnetic CTAs, spotlight cards, animated counters
- Custom cinematic footer with parallax wordmark
- Supabase Postgres database with 19+ tables (profiles, waitlist, newsletter, ai_usage, ai_saved_assets, page_views, link_clicks, audit_log, tips, brand_accounts, campaign_briefs, inquiries, saved_athletes, team_accounts, team_members, team_invites, social_accounts, nil_value_metrics, nil_deals, athlete_ai_memory, ai_events)
- Auth system (email/password + Google OAuth) with sign-in, sign-up, callback routes
- Custom email confirmation via Resend API (bypasses broken Supabase SMTP)
- Multi-step onboarding wizard (username claim, profile fields, avatar upload)
- Public athlete card at `/[username]` with 3D flip animation, photo carousel, rotating glow border
- Dashboard with sidebar navigation (Overview, Profile Editor, AI Toolkit, Analytics, Billing, Compliance, NIL Value Engine)
- Profile editor with 8 tabbed sections (Bio, Stats, Links, Social, Highlights, Theme, Tiers, Content)
- Profile completion score with progress bar
- AI toolkit with 5 tools (Bio Builder, Pitch Writer, Caption Generator, Profile Optimizer, Rate Helper) using Xiaomi MiMo with true SSE streaming
- AI Asset Vault — save, browse, filter, star, edit, and delete AI-generated outputs
- Shared AI quota pool (Free=5, Pro=300, Elite=500 per month)
- Stripe Billing integration (Checkout, Customer Portal, webhooks with error-checked plan updates, revalidatePath, diagnostic endpoint)
- Stripe Connect for athlete tips (Express accounts, 5% platform fee)
- Analytics tracking (page views, link clicks) with IP hashing for privacy
- Dashboard analytics panel (views, clicks, referrers, geo, views-by-day chart)
- Admin dashboard (God Mode) with 8 modules: user management, waitlist table, audit log, usage monitoring, content moderation, payout management, abuse detection, settings
- Admin security hardening (RLS lockdown, rate limiting, input sanitization, audit log immutability at 3 levels)
- Waitlist confirmation email flow via Resend
- Error boundaries and loading skeletons for dashboard and public profiles

### NIL Value Engine
- Data-driven scoring based on real performance stats (views, clicks, tips, social followers)
- Suggested rate ranges per tier (Post, Appearance, Campaign)
- Interactive deal evaluator (Pro/Elite gated)
- AI-powered valuation breakdown
- Social accounts editor for linking handles and audience counts

### Lock-In System (AI Memory & Telemetry)
- Silent behavioral telemetry recording tool usage preferences
- AI prompts adapt to athlete's preferred tone, length, and brand categories
- Weekly email briefings via Resend (Monday 8AM UTC cron)
- Contextual smart AI actions on dashboard (traffic drops, zero tips, missing bio)
- Compounding value milestones (Day 7/30/90 feature unlocks)

### Compliance OS
- NIL deal disclosure system (company, value, compensation type, status)
- CSV export of disclosed deals ledger
- Admin audit for clearing/rejecting deals

### Fan Monetization (CUT pre-MVP — see ADR-043)
- ~~Membership tier management (create, delete, pricing)~~ — REMOVED 2026-08-05
- ~~Exclusive content post system (publish/unpublish, tier-gated)~~ — REMOVED 2026-08-05
- ~~Fan subscription checkout via Stripe~~ — REMOVED 2026-08-05
- Active fan monetization is one-tap tips via Stripe Checkout (platform-collected, 5% fee)

### Brand-Side Tools
- Brand account creation and management
- Athlete discovery with search (authenticated brand dashboard)
- Campaign brief creation
- Inbound inquiry system (athlete inbox with status tracking)

### Brand Discovery Engine (Public)
- Public athlete discovery portal at `/discover` (no auth required)
- Search by name, sport, school, position, and minimum follower count
- Sport dropdown populated from live database
- Responsive card grid with avatar, verified badge, plan badge, sport/school/position, bio, follower count
- SEO-indexed with OG tags and sitemap entry
- "Discover" link in main navbar and footer

### Team Tier
- Multi-athlete team accounts
- Team member management (add, remove, invite)
- Roster analytics dashboard

### QR Sharing & AI Streaming
- QR code share modal (glassmorphic, copy link, download PNG)
- True SSE streaming for AI tools (token-by-token delivery)
- Analytics pruning cron (Sundays 3AM UTC, 90-day retention)

### Testing & Quality
- Playwright headless browser test suite — 39 tests, 10 categories, all passing against live production
- Production Playwright config targeting `https://athlete-os-vert.vercel.app`
- Jest unit testing infrastructure
- Comprehensive QA test plan (see `docs/QA_TESTING.md`)

---

## What's Not Built Yet

- **OG image generation** for public cards (`@vercel/og` — broken on Windows, using static PNGs)
- **Sport-specific stat templates** (basketball, football, soccer, etc.)
- **Cover image upload** for public card
- **Conversion funnel analytics** (visit → action → revenue)
- **CTA performance testing** (A/B testing)
- **Sentry integration** (error monitoring)
- **PostHog integration** (product analytics)
- **GDPR/CCPA/COPPA compliance** (some HS recruits are minors)
- **Custom domain** — `nilcard.app` live (canonical); `athleteos.app` is a DIFFERENT product, do not use
- **Lighthouse performance audit** (target: >90 mobile)

See [ROADMAP.md](./ROADMAP.md) and [VISION.md](./VISION.md) for the full build plan.

---

## Operating Rules

1. **Keep scope brutally narrow at first.**
2. **Every feature must answer:** "Does this help an athlete make money, look more professional, or save meaningful time?"
3. **Treat AI usage like inventory** — meter it and gate it.
4. **Build billing, moderation, and usage visibility into God Mode from the beginning.**
5. **Focus on conversion metrics:** profile completion, CTA clicks, upgrade rate, revenue per athlete, activation time.

---

## Reference Documents

- **Master strategic blueprint:** [VISION.md](./VISION.md)
- **Original product brief:** `../NIL.md` (root of repo)
- **Architecture detail:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Visual system detail:** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- **All page copy:** [COPY.md](./COPY.md)
- **Roadmap:** [ROADMAP.md](./ROADMAP.md)
- **Decisions:** [DECISIONS.md](./DECISIONS.md)
- **Credentials & keys:** [CREDENTIALS.md](./CREDENTIALS.md)

---

Last updated: 2026-07-02 (Session 66)
