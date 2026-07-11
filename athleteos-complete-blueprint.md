# AthleteOS – Master Product, UX, and Technical Blueprint (PRD)

> This document is a comprehensive Product Requirements Document (PRD) and implementation blueprint for AthleteOS, designed to be consumed by AI agents and engineering teams to build, test, and evolve the platform end‑to‑end. It merges product vision, business model, user workflows, component behavior, UI/UX guidelines, architecture, error handling, logging, testing, and roadmap into a single reference. It follows SaaS PRD best practices used by mature product teams.[cite:208][cite:211][cite:213][cite:219]

---

## 1. Vision, Context, and Business Model

### 1.1 Vision

AthleteOS is the **NIL operating system for student‑athletes**: one public card, one business stack, and one intelligence layer across identity, money, and performance.[cite:115][cite:207]

Athletes use AthleteOS to:

- Present a professional NIL identity (card, stats, highlights, links).[cite:115]
- Turn audience into income via tips, memberships, and later brand deals.[cite:166][cite:193]
- Use AI to generate and refine NIL content and performance insights.[cite:138][cite:190][cite:194]
- Understand reach and earnings via analytics and digest reports.[cite:40][cite:51][cite:188]

Long‑term, AthleteOS evolves into a full **Athlete OS** spanning NIL, performance, recovery, financial literacy, compliance, marketplace, and community.[cite:137][cite:189][cite:193][cite:195][cite:201]

### 1.2 NIL and Sports‑Tech Landscape (2026)

NIL in 2026 is professionalized and complex:

- Centralized systems (NIL Go, College Sports Commission) track, clear, and reject deals based on reporting thresholds and business purpose.[cite:195][cite:201]
- Many athletes report confusion and disappointment: deals not delivering promised value, unexpected taxes, and unclear requirements.[cite:189][cite:191]
- Trends include revenue sharing, performance‑based contracts, growth in women’s/non‑revenue sports, and the rise of micro‑influencers.[cite:193][cite:195][cite:197]

Sports‑tech and AI coaching apps (IntervalCoach, AI Training Plan, athletedata.health, TrainWise, Cora, Recovery Insights, Gym AI) focus on ingesting training and recovery data from Strava, WHOOP, Oura, Garmin, Apple Health, etc. to provide adaptive coaching.[cite:190][cite:192][cite:194][cite:196][cite:198][cite:200][cite:202]

AthleteOS sits at the intersection: **NIL operating system + performance intelligence**, athlete‑owned and extensible.

### 1.3 Target Segments

Primary:

- College and high‑school student‑athletes in all sports who want simple, clear NIL tools and performance support.[cite:189][cite:191][cite:193]

Secondary:

- Fans who want to discover and support athletes.
- Teams, collectives, and institutions that must track NIL and performance.[cite:36][cite:40][cite:51][cite:195][cite:201]
- Brands/agents seeking better discovery and deal pipelines (future).[cite:97][cite:43][cite:162]

Tertiary:

- Coaches and performance staff using later performance modules.[cite:190][cite:194][cite:198]

### 1.4 Business Model

Revenue streams:

- **Platform fees on tips** using Stripe destination charges with application fees.[cite:165][cite:158][cite:160][cite:171]
- **Subscription plans** (Free, Pro, Elite) with differentiated AI quotas, analytics depth, performance modules, and marketplace access.[cite:146][cite:160]
- **Marketplace fees** for approved NIL deals processed through AthleteOS (phase 2+).[cite:97][cite:43][cite:162][cite:195]

Positioning:

- AthleteOS differentiates from marketplaces (Opendorse, MOGL, MarketPryce, NIL Portal, TheLinkU) by being an OS: card + dashboard + AI + governance, not just a deal list.[cite:97][cite:43][cite:94][cite:162][cite:180]

### 1.5 Objectives and Metrics

Objectives:

- Make AthleteOS the default NIL OS for a meaningful segment of athletes.
- Reduce NIL confusion and burnout through clearer workflows and education.[cite:189][cite:191][cite:201]
- Connect NIL data with performance metrics and insights.

Core metrics:

- Active athlete cards (MAU), tip volume, MRR.
- AI toolkit usage and applied outputs (bios, pitches, captions, profile updates).
- Volume and quality of deals tracked (future).
- Institution adoption and compliance exports (future).

---

## 2. Roles and Personas

### 2.1 Roles

- **Athlete** – owns a profile, card, and dashboard; primary user.
- **Fan** – views cards, tips athletes, follows links.
- **Platform Admin** – manages users, tenants, plans, verification, abuse, audit.
- **Institution Admin** (future) – compliance officer overseeing NIL deals.[cite:36][cite:40][cite:51][cite:195][cite:201]
- **Brand/Agent** (future) – posts briefs, manages campaigns.[cite:97][cite:43][cite:162][cite:193]
- **Coach/Performance Staff** (future) – monitors training and recovery.[cite:190][cite:194][cite:198]

### 2.2 Personas

1. **Student‑Athlete A**
   - Frustrated by complex NIL rules and low‑quality deals.
   - Wants: simple card, direct fan income, AI help, clear analytics, and basic financial guidance.[cite:189][cite:191]

2. **Fan F**
   - Follows athletes on social.
   - Wants: easy tipping and updates.

3. **Admin P**
   - Needs: control, visibility, and auditability.

4. **Institution I** (future)
   - Needs: institutional NIL view, disclosures, compliance exports.

5. **Brand B / Agent A** (future)
   - Needs: structured briefs, pipeline view, performance metrics.

6. **Coach C** (future)
   - Needs: training and recovery summaries; AI recommendations.

---

## 3. User Workflows (End‑to‑End)

### 3.1 Athlete Workflow

1. **Landing → Discovery**
   - Visits landing page; sees hero and CTA "Claim your card".
   - Understands core value within seconds.[cite:115][cite:231]

2. **Auth & Sign‑up**
   - Signs up (email/password or Google OAuth).
   - Confirms email; auth cookie set via Supabase.[cite:167][cite:170]

3. **Onboarding (Multi‑Step)**

   - Step 1: Claim username (validated uniqueness, suggestions).
   - Step 2: Basic profile (name, sport, position, school, class year).
   - Step 3: Avatar upload (crop, resize).
   - Step 4: First link + highlight.
   - Step 5: Tips setup (Stripe Connect Express onboarding, optional).[cite:168][cite:160]
   - On completion: profile completion score computed; redirected to dashboard.

4. **Card Review & Sharing**
   - Views card at `/[username]` (identity, stats, highlights, links, tip button if enabled).
   - Uses share tools to copy link and QR; posts to social.

5. **Tips & Earnings**
   - If tips enabled: fans can tip via Stripe Checkout (destination charges).
   - Dashboard shows total tips and recent earnings.

6. **AI Toolkit**
   - Uses tools to generate/refine bio, pitches, captions, profile improvements.[cite:138][cite:157]
   - Adjusts outputs; applies to profile or saves drafts.

7. **Analytics & Digest**
   - Checks analytics tab: views, clicks, tips, referrers, charts.[cite:40][cite:51][cite:188]
   - Receives weekly email digest summarizing activity and recommended actions.[cite:157]

8. **Plan Upgrades**
   - Hits AI quota; sees prompts to upgrade.
   - Uses Stripe Billing to move from Free to Pro/Elite.[cite:160][cite:146]

### 3.2 Fan Workflow

1. Land on `/[username]` via shared link or search.
2. Read profile, stats, highlights; click links.
3. Click "Tip this athlete": choose amount, complete Stripe Checkout, see thank‑you page.

### 3.3 Admin Workflow

1. Log in as admin.
2. View admin dashboard: usage, tips, abuse, audit summary.[cite:182][cite:184][cite:186][cite:188]
3. Inspect users and tenants; adjust plan tiers, verify/suspend profiles.
4. Review abuse reports; take action (suspend, mark content) and log to audit.
5. Monitor tips and webhooks; handle incidents.

### 3.4 Future Workflows (Brief Outline)

- Institution compliance: manage `nil_deals` and disclosures; export reports.[cite:36][cite:40][cite:51][cite:195][cite:201]
- Marketplace: brands post briefs; athletes discover/apply; deals move through pipeline.[cite:97][cite:43][cite:162][cite:193][cite:197]
- Performance OS: ingest training/recovery data; AI coach surfaces daily guidance.[cite:190][cite:192][cite:194][cite:196][cite:198][cite:200][cite:202]

---

## 4. Functional Requirements per Module

### 4.1 Landing & Marketing

- Hero: tagline, subhead, main CTA.
- Sections: Identity, Monetization, AI, Analytics, Future OS.
- FAQ: NIL basics and how AthleteOS helps.[cite:189][cite:191][cite:193]
- SEO & OG metadata.

### 4.2 Auth & Onboarding

- Sign‑up, sign‑in, password reset, email verification.
- Onboarding steps as described.
- Middleware protections around dashboard and card editing.

Error handling: use Supabase error patterns; log full error; show clear messages.[cite:209][cite:218][cite:216]

### 4.3 Public Athlete Card `/[username]`

- Data: `profiles`, `profile_links`, `profile_stats`, `profile_highlights`.[cite:148]
- UI: avatar + identity + tip + share; stats/highlights/links.
- Tip button visible only when `tips_enabled` and `stripe_connect_account_id` present.[cite:165][cite:168]
- OG image generation.

Analytics: log `page_views` and `link_clicks` events.[cite:40][cite:51]

### 4.4 Tips

- Enable tips via Stripe Connect Express onboarding (dashboard step).[cite:168][cite:160]
- Tip modal: presets, custom amount, validation.
- API route to create Stripe Checkout Session using destination charges and application fees.[cite:165][cite:158][cite:160][cite:171]
- Webhooks for payment lifecycle update `tips` status and update `profiles.total_tips_amount`/`total_tips_count`.

### 4.5 AI Toolkit

- Tools: Bio Builder, Sponsor Pitch, Caption Generator, Profile Optimizer, Rate/Readiness.[cite:138][cite:157]
- Streaming AI responses; editable before applying.
- `ai_usage` tracking; quotas per plan (Free 5, Pro 300, Elite 500).[cite:146]
- Drafts saved to `ai_drafts`; apply‑to‑profile updates fields and completion score.

### 4.6 Analytics Module

- Page views chart; link performance; tip earnings summary; referrer list.[cite:40][cite:51][cite:188]
- Aggregation from `page_views`, `link_clicks`, `tips`.

### 4.7 Athlete Dashboard

- Tabs: Profile, Analytics, AI, Billing.
- Shows completion score, plan tier, quick actions.

### 4.8 Admin Console

- Users: list/search/filter; plan, status, verification.
- Tenants: list and membership management.
- Audit log: filter by action, actor, target.[cite:157]
- Abuse reports: queue with resolution actions.

---

## 5. Technical Architecture

### 5.1 Stack

- Frontend: Next.js 14 App Router, React 18, TypeScript 5.[cite:159][cite:172]
- Backend: Supabase Postgres + Auth + RLS.[cite:148]
- Payments: Stripe Billing + Stripe Connect.[cite:165][cite:158][cite:160][cite:171][cite:168]
- AI: Gemini 2.0 Flash.[cite:138]
- Email: Resend.
- Observability: Sentry.

### 5.2 Supabase + Next.js Integration

Use `@supabase/ssr` patterns:[cite:164][cite:167][cite:159][cite:170][cite:175]

- Server client: `createServerClient` with cookies; used in Server Components and server actions.
- Browser client: `createBrowserClient` with anon key; used in client components.
- Service‑role client: server‑only; used in Stripe webhooks and background jobs.[cite:148][cite:142]

### 5.3 Data Model and RLS

Tables:

- `tenants`, `tenant_users` for multi‑tenant management.[cite:142][cite:143][cite:145][cite:147][cite:161]
- `profiles`, `profile_links`, `profile_stats`, `profile_highlights` for card content.[cite:148]
- `tips`, `subscriptions` for monetization.[cite:165][cite:158][cite:160][cite:171][cite:168]
- `ai_usage`, `ai_drafts` for AI toolkit.[cite:138][cite:157]
- `page_views`, `link_clicks` for analytics.[cite:40][cite:51]
- `audit_log`, `abuse_reports` for governance.[cite:157][cite:182][cite:184][cite:186]

RLS principles:[cite:142][cite:143][cite:145][cite:147][cite:148][cite:149][cite:150][cite:161]

- Enable RLS on all tables at creation.
- Use `tenant_id` and `tenant_users` to enforce per‑tenant isolation.
- Policies reference `auth.uid()` and membership; admin elevation via roles only.
- Explicit tests to ensure cross‑tenant queries return no data.

---

## 6. Error Handling, Logging, and QA

### 6.1 Supabase Error Handling

Follow Supabase guidance:[cite:209][cite:218][cite:216]

- Always read `{ data, error }`; check and log `error` fully.
- Use `error.code` to branch logic.
- Return structured responses to client (e.g., `{ success: false, errorCode, errorMessage }`).

### 6.2 Edge Function / API Error Handling

From Supabase docs:[cite:212]

- Use correct HTTP status codes (400/401/403/404/500).
- Return JSON error payloads; handle `FunctionsHttpError`, `FunctionsRelayError`, `FunctionsFetchError` on client.

### 6.3 Sentry Integration

Community recommendations:[cite:214]

- Centralize `captureException` calls in a wrapper; tag errors with route, user, and context.

### 6.4 Testing

Use unit, integration, and Playwright E2E tests:[cite:211][cite:213][cite:219][cite:220][cite:221]

- Card: correct rendering, 404 behavior, analytics logging.
- Tips: modal validation, API call, webhook updates.
- AI: quotas, drafts, apply‑to‑profile.
- Admin: actions, audit logging.
- RLS: cross‑tenant isolation tests.

---

## 7. UI/UX Design System

### 7.1 Principles

- Clarity and restraint (no generic SaaS gradient slop). [cite:188]
- Consistency across card, dashboard, admin.
- Accessibility (WCAG AA, keyboard nav).

### 7.2 Layout Patterns

- Public card: responsive player card style; identity + tip + share at top; stats/highlights/links below.[cite:181][cite:183][cite:185][cite:187][cite:210]
- Dashboard: sidebar navigation, top KPIs, content panels with progressive disclosure.[cite:179][cite:226][cite:227][cite:232][cite:234]

### 7.3 States

- Loading: skeletons.
- Empty: helpful guidance.
- Error: inline messages + retry.

---

## 8. Competitive Context

- NIL marketplaces: match athletes to deals; often complex and deal‑centric.[cite:97][cite:43][cite:162][cite:94][cite:180]
- NCAA NIL Assist: centralized NIL data and dashboards.[cite:36][cite:40][cite:51]
- CSC reports: show which deals are cleared vs rejected and why.[cite:195]
- AI training apps: performance OS patterns AthleteOS can integrate or emulate.[cite:190][cite:192][cite:194][cite:196][cite:198][cite:200][cite:202]

AthleteOS: OS across NIL + performance; card‑centric, athlete‑owned, with strong governance and AI.

---

## 9. Roadmap (Phased)

Phase A – Core NIL OS (current)

- Landing, auth, onboarding, card, tips, AI toolkit, analytics, admin.

Phase B – AI UX & Earnings Depth

- Better prompts, streaming, digest; richer earnings views.

Phase C – Compliance OS

- `nil_deals`, `nil_disclosures`; institution dashboards; export tools.[cite:36][cite:40][cite:51][cite:195][cite:201]

Phase D – Marketplace OS

- Brand profiles, briefs, matching; performance‑based contracts.[cite:97][cite:43][cite:162][cite:193][cite:197]

Phase E – Financial Literacy

- Income views; tax and budgeting education.[cite:189][cite:191][cite:193][cite:195][cite:201]

Phase F – Performance & Recovery OS

- Training/wearable integrations; AI coaching modules.[cite:190][cite:192][cite:194][cite:196][cite:198][cite:200][cite:202]

Phase G – Fan & Community OS

- Memberships; fan dashboards.

---

## Appendix A – Implementation Spec: Public Card, Tips, AI Toolkit

> This appendix specifies the public card, tip flow, and AI toolkit in implementation‑ready detail for Next.js 14 App Router + Supabase + Stripe + Gemini.

### A.1 Routes

- `app/(card)/[username]/page.tsx` – public card.
- `app/(dashboard)/dashboard/ai/page.tsx` – AI toolkit.
- `app/api/tips/create-session/route.ts` – tip Checkout Session.
- `app/api/stripe/webhook/route.ts` – Stripe webhooks.

Other routes: landing, auth, onboarding, dashboard, admin (see main sections).

### A.2 Supabase Clients

Implement server, browser, and service‑role clients using `@supabase/ssr` per Supabase/Next.js guidance.[cite:164][cite:167][cite:159][cite:170]

- Server client: `getServerSupabaseClient()` with cookies.
- Browser client: `getBrowserSupabaseClient()` with anon key.
- Service client: server‑only for webhooks.

### A.3 Data Loaders

- `getProfileByUsername(username)` – fetch profile + links/stats/highlights.
- `getCardAnalyticsSummary(profileId)` – aggregated views/clicks.
- `getTipsSummaryForProfile(profileId)` – tip earnings.
- `getAIUsageForUser(userId)` – quorum usage.

Each uses `data, error` pattern and logs errors as recommended.[cite:209][cite:212]

### A.4 Public Card Implementation

`[username]/page.tsx`:

- Server Component; calls `getProfileByUsername`.
- Renders 404 if profile missing.
- Renders `ProfileCard` with props.

`ProfileCard` client component:

- Props: `profile`, `links`, `stats`, `highlights`.
- Subcomponents: `AvatarBadge`, `IdentityBlock`, `TipButton`, `ShareTools`, `StatGrid`, `HighlightList`, `LinkList`.
- Layout: stacked on mobile, two‑column on desktop.

States:

- Skeletons for loading.
- Friendly empty states when no stats/highlights/links.

### A.5 Tip Flow

`TipButton`:

- Shows enabled/disabled state; opens `TipModal`.

`TipModal`:

- State: `amountPreset`, `customAmount`, `isSubmitting`, `errorMessage`.
- Validates amount; calls `/api/tips/create-session`; redirects to Stripe Checkout URL.

`create-session` route:

- Validates inputs; fetches profile; checks `tips_enabled` + `stripe_connect_account_id`.
- Inserts `tips` row (pending).
- Creates Stripe Checkout Session (destination charge + application fee).[cite:165][cite:158][cite:160][cite:171]
- Updates `tips` row with `stripe_checkout_session_id`; returns `checkoutUrl`.

`webhook` route:

- Verifies signatures.
- On `payment_intent.succeeded`: sets `tips.status = 'succeeded'` and increments `profiles` earnings in transaction.
- On `payment_intent.payment_failed`: sets `tips.status = 'failed'`.

### A.6 AI Toolkit

`dashboard/ai/page.tsx`:

- Server Component; fetches `profile` + AI quota; renders `AIToolList`.

`AIToolList`:

- Shows usage meter; lists tools.

`AIToolEditor`:

- State: `inputText`, `outputText`, `isStreaming`, `errorMessage`.
- Submits to AI server action; streams output; allows edit; supports "Save draft" and "Apply to profile".

AI server actions:

- `runAITool` – check quotas, call Gemini, log `ai_usage`, increment usage.[cite:138]
- `saveAIDraft` – insert `ai_drafts` row.
- `applyDraftToProfile` – update profile fields, mark draft applied.

### A.7 Error Handling & Logging (Applied)

- Follow Supabase and Edge Function guidance for structured error responses.[cite:209][cite:212][cite:218][cite:216]
- Integrate Sentry via centralized wrapper.[cite:214]
- UI shows inline errors for validation and general failures.

### A.8 Testing (Applied)

- Card: 404 vs success; content correct; analytics events.
- Tips: modal validation; session creation; webhook state transitions.
- AI: quota enforcement; drafts; apply‑to‑profile behavior.

These details allow an AI agent to generate concrete components, routes, and server actions that match the PRD and modern SaaS patterns.
