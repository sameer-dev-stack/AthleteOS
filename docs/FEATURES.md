# New Features Documentation

## 1. NIL Value Engine

A data-driven engine that reads real performance stats from the athlete's dashboard and connected social accounts, calculates a unified valuation score, maps standard brand pricing bands, and provides automated valuation breakdowns.

**Files:**
- `lib/nil-score.ts` - Core math calculation engine
- `lib/actions/nil-engine.ts` - Server actions for running calculations, deal evaluations, and fetching metrics snapshots
- `lib/actions/social-accounts.ts` - CRUD for linking social handles and audience counts
- `components/dashboard/nil-score-card.tsx` - Radial animated SVG valuation score gauge
- `components/dashboard/nil-metrics-strip.tsx` - Stats bar showing card views, click stats, tips, and total followers
- `components/dashboard/nil-rate-table.tsx` - Suggested rate ranges (Post, Appearance, Campaign)
- `components/dashboard/nil-deal-checker.tsx` - Interactive contract offer analyzer (gated to Pro/Elite)
- `components/dashboard/nil-ai-breakdown.tsx` - Premium valuation feedback generated via MiMo AI
- `components/dashboard/social-accounts-editor.tsx` - Forms to link social profiles
- `app/dashboard/nil/` - Valuation cockpit dashboard route (Page & Client layout)

---

## 2. The Lock-In System (AI Memory & Telemetry)

A behavioral engagement loop that records toolkit usage parameters silently, refines future AI text generation models, emails weekly briefings to active users, hooks magic action triggers on dashboards, and tracks compounding days-on-platform milestones to lock athletes into the AthleteOS workspace.

**Files:**
- `lib/actions/ai-memory.ts` - Event logger and memory updater server actions
- `lib/actions/quick-ai.ts` - Server action executing pre-built prompts based on real-time traffic/financial triggers
- `app/api/cron/weekly-briefing/route.ts` - Cron route handler executing Monday 8AM UTC
- `components/dashboard/smart-ai-actions.tsx` - One-click contextual prompt buttons (e.g. dropped views → re-engagement caption)
- `components/dashboard/compounding-value.tsx` - Days on platform card showing compounding value stats
- `vercel.json` - Cron configuration and scheduling parameters

---

## 3. Compliance OS & NIL Disclosures

Full-stack disclosure system that allows student-athletes to log brand contracts, financial values, and deliverables to remain compliant with state, conference, and university regulations.

**Files:**
- `lib/actions/compliance.ts` - Server actions (`discloseDeal`, `getMyDeals`, `updateDealStatus`)
- `app/dashboard/compliance/` - Disclosure cockpit route (Form modal, CSV ledger exporter, audit categories)
- `components/dashboard/overview.tsx` - Visual sync hooks for initial profile states

---

## 4. AI Toolkit Migration (Xiaomi MiMo)

Refactored the core AI generation modules from Google Gemini SDK to direct connection calls to the Xiaomi MiMo Open Platform API, providing faster response latency and standard completions format.

**Files:**
- `lib/ai.ts` - Direct `fetch` calls to OpenAI-compatible completions endpoint (`https://api.xiaomimimo.com/v1/chat/completions`)
- `lib/actions/ai.ts` - AI action wrappers with quota guards and event triggers

**Configuration:**
- Primary Model: `mimo-v2.5-pro` (or `mimo-v2.5` omni)
- Primary Key: `MIMO_API_KEY` (configured in env / Vercel settings)

---

## 5. Stripe Connect & Payments

Transaction rails enabling fans to tip athletes directly on their cards and subscribe to monthly membership plans.

**Files:**
- `lib/stripe.ts` - Proxy-wrapped Stripe client singleton
- `lib/stripe-billing.ts` - Checkout and Customer Portal session builders
- `lib/actions/stripe.ts` - Stripe Express Connect onboarding link creation
- `lib/actions/tips.ts` - Tip transactions tracker and earnings metrics calculator
- `app/api/webhooks/stripe/route.ts` - Webhook events processor

---

## 7. Sidebar Navigation

Collapsible sidebar navigation system with organized sections for dashboard access.

**Files:**
- `components/dashboard/sidebar.tsx` - Main sidebar component with section grouping
- `components/dashboard/sidebar-item.tsx` - Individual nav items with active state
- `app/dashboard/layout.tsx` - Sidebar integration into dashboard layout

---

## 8. Header Search (Cmd+K)

Global command palette accessible via Cmd+K keyboard shortcut for quick navigation and search.

**Files:**
- `components/dashboard/command-palette.tsx` - Modal command palette with fuzzy search
- `components/dashboard/header.tsx` - Header bar with search trigger

---

## 9. Notification System

Real-time notification center for platform events, tips, inquiries, and system messages.

**Files:**
- `components/dashboard/notification-center.tsx` - Notification dropdown panel
- `components/dashboard/notification-item.tsx` - Individual notification display
- `lib/actions/notifications.ts` - Server actions for fetching and managing notifications

---

## 10. User Dropdown Menu

User account dropdown in the header with profile, settings, billing, and sign-out options.

**Files:**
- `components/dashboard/user-menu.tsx` - Dropdown menu with account actions
- `components/dashboard/header.tsx` - Header integration

---

## 11. Breadcrumb Navigation

Context-aware breadcrumbs showing current location within the dashboard hierarchy.

**Files:**
- `components/dashboard/breadcrumbs.tsx` - Dynamic breadcrumb component
- `app/dashboard/layout.tsx` - Breadcrumb integration

---

## 12. Settings Page

User preferences and account settings management page.

**Files:**
- `app/dashboard/settings/page.tsx` - Settings page route
- `components/dashboard/settings-form.tsx` - Preferences form (email, theme, privacy)
- `lib/actions/settings.ts` - Server actions for updating user preferences

---

## 13. Billing Page with Usage Meter

Dedicated billing page showing subscription details, usage metrics, and plan management.

**Files:**
- `app/dashboard/billing/page.tsx` - Billing page route
- `components/dashboard/billing-meter.tsx` - Usage progress bar and stats
- `components/dashboard/plan-card.tsx` - Current plan display with upgrade/downgrade options

---

## 14. Analytics with Date Presets

Enhanced analytics dashboard with preset date ranges (7d, 30d, 90d, custom).

**Files:**
- `components/dashboard/analytics-panel.tsx` - Updated with date preset selector
- `components/dashboard/date-presets.tsx` - Date range preset buttons
- `lib/actions/analytics.ts` - Updated server actions with date range filtering

---

## 15. Onboarding with Live Preview

Multi-step onboarding wizard with real-time preview of the athlete card as fields are filled.

**Files:**
- `app/onboarding/page.tsx` - Onboarding wizard route
- `components/onboarding/onboarding-wizard.tsx` - Step-by-step form flow
- `components/onboarding/live-preview.tsx` - Real-time card preview during onboarding

---

## 16. Public Card with NIL Score

Public athlete card displaying NIL valuation score with animated gauge visualization.

**Files:**
- `app/[username]/page.tsx` - Public card route
- `components/card/nil-score-display.tsx` - Animated NIL score gauge on public card
- `components/card/card-header.tsx` - Card header with avatar, name, verified badge

---

## 17. Hero with Animations

Landing page hero section with animated elements and scroll-triggered reveals.

**Files:**
- `components/hero.tsx` - Main hero section with animations
- `components/motion/scroll-reveal.tsx` - Scroll-triggered animation wrapper
- `components/motion/magnetic-button.tsx` - Magnetic CTA button effect

---

## 6. Analytics Logging

A privacy-preserving analytics logger tracking public card profiles.

**Files:**
- `lib/actions/analytics.ts` - Deduplicates daily counts via SHA-256 IP hashing (IP addresses are never saved)
- `components/dashboard/analytics-panel.tsx` - Detailed charts showing referrers, links, and locations over 7d/30d/90d ranges
