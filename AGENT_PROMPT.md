# AthleteOS — Complete AI Agent Brief

You are working on **AthleteOS** — a premium dark-themed NIL (Name, Image, Likeness) business operating system for student-athletes. This is a startup-grade product, not a prototype.

---

## What This Product Is

AthleteOS is the business operating system for athletes. Not a digital card. Not a link-in-bio. Not a marketplace. The card is the front-end identity layer. The real value is the system behind it: brand positioning, monetization rails, AI-assisted execution, analytics, sponsor readiness, and admin oversight.

**Core promise:** An athlete signs up once, gets a premium public identity page, gets guided toward revenue opportunities, and upgrades when they need more reach, more AI help, or more monetization tools.

---

## Stack

- **Framework:** Next.js 14 App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS (dark only)
- **Database:** Supabase (Postgres + Auth + RLS)
- **Email:** Resend
- **Billing:** Stripe (Checkout + Customer Portal + Connect for tips)
- **AI:** Google Gemini (metered per plan)
- **Animation:** Framer Motion + Lenis smooth scroll
- **Deployment:** Vercel
- **Repo:** https://github.com/sameer-dev-stack/AthleteOS
- **Live:** https://athlete-os-vert.vercel.app

---

## Design Rules (NEVER BREAK THESE)

1. **Single accent color:** `#C6FF3D` electric lime. NEVER add a second accent color. The lime IS the entire visual identity.
2. **Dark mode only.** No light theme. No theme toggle. Background is `#0A0A0B`.
3. **No emojis** in code or copy unless explicitly requested by the user.
4. **Premium dark aesthetic** — high contrast, strong type, clean grid. Not generic SaaS.

### Color Tokens
| Token | Hex | Use |
|-------|-----|-----|
| `bg` | `#0A0A0B` | Page background |
| `bg.elev` | `#101012` | Elevated surfaces |
| `bg.card` | `#121216` | Card backgrounds |
| `line` | `#1C1C22` | Borders / dividers |
| `ink` | `#F5F5F7` | Primary text |
| `ink.muted` | `#9A9AA3` | Secondary text |
| `ink.dim` | `#6B6B74` | Tertiary text |
| `accent` | `#C6FF3D` | THE accent |
| `accent.soft` | `#E4FF8A` | Hover state |
| `accent.deep` | `#9BD400` | Pressed state |

### Typography
- Font: Inter (via next/font)
- Headlines: `.gradient-text` (white to gray vertical gradient)
- Body: `text-lg text-ink-muted` for paragraphs

### Containers
- `.container-tight` = max-width 1152px (body sections)
- `.container-wide` = max-width 1280px (hero, nav, footer)
- Section rhythm: `py-20 sm:py-28 lg:py-36`

---

## Code Rules (NEVER BREAK THESE)

1. **Server Components by default.** `"use client"` only when required (hooks, effects, event handlers, Framer Motion).
2. **Every DB write validated with Zod first.** No unvalidated inserts/updates.
3. **RLS enabled on every table**, scoped to `auth.uid()`.
4. **Use `getUser()` not `getSession()` in Server Components.** getSession can be stale.
5. **Never expose service role key client-side.** Only used in Server Actions and route handlers.
6. **No comments** unless they explain *why*, not *what*.
7. **Make the smallest possible code change.** Never rewrite existing functions unless told.
8. **Follow existing code conventions.** Check neighboring files for patterns before writing new code.

---

## Architecture

### File Structure
```
AthleteOS-main/
├── app/                          # Next.js 14 App Router
│   ├── admin/                    # God Mode admin dashboard
│   ├── api/                      # API routes (Stripe webhook, waitlist, auth)
│   ├── auth/                     # Auth pages (sign-in, sign-up, callback, etc.)
│   ├── brands/                   # Brand accounts, discovery, campaigns
│   ├── dashboard/                # Athlete dashboard
│   ├── fan/subscribe/[tierId]/   # Fan subscription page
│   ├── onboarding/               # Multi-step onboarding wizard
│   ├── stripe/status/            # Admin Stripe health status
│   ├── suspended/                # Suspended account page
│   ├── teams/                    # Team management
│   ├── [username]/               # Public athlete card (dynamic)
│   ├── globals.css               # Tailwind + custom utilities
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page (composes all sections)
│
├── components/
│   ├── admin/                    # Admin components (shell, tables, modals)
│   ├── dashboard/                # Dashboard components (editor, AI, billing, analytics)
│   ├── motion/                   # Animation primitives (Reveal, Magnetic, Tilt, etc.)
│   └── [section].tsx             # Landing page sections (hero, features, faq, etc.)
│
├── lib/
│   ├── actions/                  # Server Actions (auth, profile, ai, billing, admin, etc.)
│   ├── supabase/                 # Supabase client setup
│   └── *.ts                      # Utilities (stripe, resend, storage, etc.)
│
├── supabase/
│   ├── schema.sql                # Canonical database schema
│   └── migrations/               # SQL migrations
│
├── docs/                         # All documentation
│   ├── VISION.md                 # Master strategic blueprint
│   ├── ARCHITECTURE.md           # File structure + component map
│   ├── COMPONENTS.md             # Per-component reference
│   ├── DESIGN_SYSTEM.md          # Tokens, type, motion, patterns
│   ├── COPY.md                   # Verbatim landing page copy
│   ├── ROADMAP.md                # Product roadmap
│   ├── DECISIONS.md              # Architecture decision records
│   ├── CREDENTIALS.md            # API keys, URLs, accounts
│   └── CHANGELOG.md              # Session-by-session history
│
├── graphify-out/                 # Knowledge graph (generated)
│   ├── graph.html                # Interactive graph (open in browser)
│   ├── GRAPH_REPORT.md           # Highlights + god nodes + connections
│   └── graph.json                # Queryable graph data
│
├── AGENTS.md                     # Agent rules (this project)
├── tailwind.config.ts            # Tailwind configuration
├── next.config.mjs               # Next.js config
└── middleware.ts                  # Route protection (admin, suspended, unconfirmed)
```

### Key Components

**Landing Page:** Hero, announcement bar, stats, features, how-it-works, testimonials, pricing, FAQ, final CTA, footer. All in `components/*.tsx`, composed in `app/page.tsx`.

**Dashboard:** Profile editor (8 tabs: bio, stats, links, social, highlights, theme, tiers, content), AI toolkit (5 tools), billing panel, analytics panel, tip earnings, inquiry inbox. All in `components/dashboard/*.tsx`.

**Admin:** Shell with sidebar, user table, waitlist table, audit log, settings, usage monitor, abuse detection, payout management, content moderation. All in `components/admin/*.tsx`.

**Public Card:** Profile card at `/[username]` with avatar, stats, links, highlights, social icons, tip button, share controls. In `components/public-card.tsx` and `components/profile-card.tsx`.

### Server Actions (lib/actions/)
| File | Purpose |
|------|---------|
| `auth.ts` | signUp, signIn, signOut, Google OAuth, email confirmation |
| `profile.ts` | getMyProfile, updateProfile, getPublicProfile, updateTheme, checkUsername |
| `ai.ts` | generateBios, generatePitch, generateCaptions, optimizeProfile, getRateGuidance |
| `ai-usage.ts` | getAiQuota, recordAiUsage, getPlan |
| `billing.ts` | getSubscriptionStatus, createCheckoutSession, createPortalSession |
| `stripe.ts` | createTipSession, createConnectOnboarding, getPayoutBalance |
| `admin.ts` | listUsers, viewUser, updateUserPlan, toggleUserStatus, logAdminAction, getAuditLogs |
| `analytics.ts` | trackView, trackLinkClick, getAnalytics |
| `memberships.ts` | createTier, getTiers, createContentPost, createSubscriptionCheckout |
| `brand.ts` | createBrandAccount, searchAthletes, saveAthlete, createCampaignBrief |
| `inquiries.ts` | submitInquiry, getAthleteInquiries, updateInquiryStatus |
| `teams.ts` | createTeam, getMyTeams, addTeamMember, getTeamAnalytics |
| `emails.ts` | sendConfirmationEmail, sendWelcomeEmail |

### Database Tables
`profiles`, `waitlist`, `newsletter`, `rate_limits`, `ai_usage`, `page_views`, `link_clicks`, `audit_log`, `membership_tiers`, `fan_subscriptions`, `content_posts`, `tips`, `brand_accounts`, `campaign_briefs`, `inquiries`, `saved_athletes`, `team_accounts`, `team_members`, `team_invites`

---

## Business Model

### Pricing
| Tier | Price | AI Actions/Month |
|------|-------|-----------------|
| Free | $0 | 5-10 |
| Pro | $14/mo | 100-300 |
| Elite | $29/mo | 500 |

### Revenue Sources
- Athlete subscriptions
- Fan memberships
- Transaction fees (tips, bookings)
- Upsells (themes, analytics, custom domains)

### First 500 Pro Benefit
First 500 waitlist signups get 3 months of Pro free, then auto-downgrade.

---

## Knowledge Graph

A full knowledge graph exists at `graphify-out/`. It maps every file, function, and concept in the project.

### How to use it:
```
graphify query "how does auth connect to the database?"
graphify path "AI Toolkit" "Stripe"
graphify explain "createClient"
```

### God Nodes (most connected):
1. `createClient()` — 89 edges (backbone of everything)
2. `verifyAdmin()` — 18 edges
3. `getAiQuota()` — 14 edges
4. `Profile` — 14 edges
5. `recordAiUsage()` — 12 edges

### 63 Communities:
Landing Page, Analytics, Profile Management, AI Content, Memberships, Auth, Billing, Admin, Brands, Teams, and more.

### After code changes:
```
graphify extract . --update
```

---

## Roadmap Status

| Phase | Status | What |
|-------|--------|------|
| 0 | DONE | Landing page |
| 1 | DONE | Waitlist + Auth |
| 2 | DONE | Athlete onboarding |
| 3 | DONE | Public athlete card |
| 4 | TESTING | Stripe Connect tips |
| 5 | DONE | AI tools (5 tools, metered) |
| 6 | TESTING | Subscription/paywall |
| 7 | DONE | God Mode admin |
| 8 | DONE | Analytics |
| 9 | DONE | Fan memberships |
| 10 | DONE | Brand-side tools |
| 11 | DONE | Team tier |

---

## What to Do Before Every Task

1. **Read the relevant docs** — check `docs/` for the area you're working in
2. **Query the graph** — `graphify query "your question"` to understand connections
3. **Check existing code** — look at neighboring files for patterns
4. **Follow the rules** — dark theme, single accent, Zod validation, Server Components by default

## What to Do After Every Task

1. **Run lint:** `npm run lint`
2. **Run build:** `npm run build`
3. **Update docs** if you changed components, architecture, or copy
4. **Update the graph:** `graphify extract . --update`

---

## Forbidden Phrases (in copy)
"unlock your potential," "all-in-one solution," "revolutionize your journey," "empower your future," "unleash"

## Preferred Verbs (in copy)
build, claim, share, launch, ship, plug in, turn on, get paid, get discovered, get drafted into the brand economy

---

## Contact
- **Repo:** https://github.com/sameer-dev-stack/AthleteOS
- **Live:** https://athlete-os-vert.vercel.app
- **Admin email:** sameer@athleteos.app
