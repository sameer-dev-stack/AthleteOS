# Pre-Launch Audit Report

**Date:** 2026-07-11
**Auditor:** opencode (AI agent)
**Scope:** Every user/visitor-facing page and component
**Build status:** Compiled successfully, 0 type errors, 2 lint warnings

---

## Executive Summary

The site compiles and builds cleanly. No type errors. Two lint warnings. One broken mobile route. One fake testimonials issue that must be fixed before launch. Overall the surface is solid — this is a polish pass, not a rebuild.

**Critical (must fix before launch): 2**
**High (should fix before launch): 4**
**Medium (nice to fix): 5**
**Low (backlog): 3**

---

## Critical Issues

### 1. `/dashboard/more` route does not exist — mobile bottom nav 404s

**File:** `components/layout/bottom-nav.tsx:19`
**Impact:** Every mobile user who taps "More" in the bottom nav gets a 404.

The bottom nav links to `/dashboard/more` but no such route exists anywhere in the app. The glob search returned zero results. This is the 5th tab on mobile — it's one of the most-tapped surfaces.

**Fix:** Either create `app/dashboard/more/page.tsx` with a "more" menu (settings, billing, sign out, etc.) or remove the tab and redistribute those links.

---

### 2. Testimonials are fabricated — legal/reputation risk

**File:** `components/testimonials.tsx`
**Impact:** Fake names, fake schools, fake quotes presented as real athlete testimonials.

Three testimonials use invented people:
- "Maya Chen, Track & Field, University of Oregon" — does not exist
- "DeShawn Williams, Football, Ohio State" — does not exist
- "Sofia Rodriguez, Soccer, Stanford University" — does not exist

Each has a fabricated quote and 5-star rating. Presenting these as real testimonials is deceptive and potentially a FTC issue. The `solution.tsx` component also references "Maya" with fake metrics ($2,348/month, 142K followers, 42 paying fans).

**Fix:** Either remove testimonials entirely until real ones exist, or label them clearly as "illustrative" / "example" with a disclaimer. Never present fabricated endorsements as real.

---

## High Issues

### 3. Two `<img>` tags instead of `next/image`

**Files:**
- `app/discover/client.tsx:191` — athlete avatar images
- `app/onboarding/page.tsx:116` — avatar preview

Both use raw `<img>` for user-uploaded avatar images. This bypasses Next.js image optimization (WebP, resizing, lazy loading, CDN caching). On the discover page with many athlete cards, this means significantly slower LCP and higher bandwidth.

**Fix:** Replace with `next/image` using `unoptimized` if the images are Supabase storage URLs (since they can't be optimized by the default loader), or configure a custom loader.

---

### 4. Sentry config deprecation warning

**Build output:**
```
[@sentry/nextjs] DEPRECATION WARNING: It is recommended renaming your `sentry.client.config.ts` file,
or moving its content to `instrumentation-client.ts`.
```

This will break when Turbopack is enabled. Not blocking now, but will become an error in a future Next.js version.

**Fix:** Rename `sentry.client.config.ts` to `instrumentation-client.ts` and update imports.

---

### 5. Inconsistent auth redirect destinations

Different dashboard pages redirect to different places when the user isn't authenticated:

| Page | Redirect |
|------|----------|
| `dashboard/layout.tsx` | `/auth/sign-in` |
| `dashboard/billing/page.tsx` | `/auth/sign-in?redirect=/dashboard/billing` |
| `dashboard/nil/page.tsx` | `/auth/sign-in` |
| `dashboard/settings/page.tsx` | `/auth/sign-in` then `/onboarding` |
| `dashboard/analytics/page.tsx` | `/onboarding` |
| `dashboard/memberships/page.tsx` | `/onboarding` |
| `dashboard/compliance/page.tsx` | `/onboarding` |

The layout already handles auth checks. The per-page redirects to `/onboarding` are redundant (the layout catches it first). The billing page is the only one that preserves the return URL via query param — the others don't, so users land on `/dashboard` after signing in instead of where they were trying to go.

**Fix:** Standardize all redirects. The layout handles the auth gate. Per-page redirects should be removed or should all pass `?redirect=` back to the original page.

---

### 6. Navbar CTA `#waitlist` link only works on landing page

**File:** `components/navbar.tsx:92`, `components/footer.tsx:91`

The primary CTA ("Get early access" / "Join the waitlist") links to `#waitlist`, which is the section ID on the landing page. If a user is on `/discover`, `/about`, `/changelog`, or any other page and clicks this CTA, it navigates to `/#waitlist` — which reloads the entire landing page and scrolls to the section. This works but is suboptimal.

**Fix:** On non-landing pages, the CTA should link to `/auth/sign-up` or `/onboarding` instead of `#waitlist`.

---

## Medium Issues

### 7. `solution.tsx` uses fake revenue data in marketing mockup

**File:** `components/solution.tsx:74-91`

The solution section shows a fake dashboard with fabricated metrics:
- "AI-drafted in 4 sec"
- "$847 this month" tip jar
- "2 new · Gymshark, Celsius" sponsor inquiries
- "42 paying fans" membership
- "$2,348" monthly takeaway with "+38%"

These are presented as a "Live profile" preview but are entirely made up. While this is a common marketing pattern, it should be clearly labeled as an example or removed if the actual product can demonstrate real data.

---

### 8. `how-it-works.tsx` claims "Earning in 10 days"

**File:** `components/how-it-works.tsx:48`

The headline says "Live in 10 minutes. Earning in 10 days." This is a promise that can't be guaranteed. New athletes may not earn anything for weeks or months. This could erode trust if the expectation isn't met.

**Fix:** Soften to something like "Earning from day one" or "Start earning immediately" — the product does enable tips from launch, so the capability is real even if the timeline varies.

---

### 9. `faq.tsx` says "first 500 signups get 3 months of Pro for free"

**File:** `components/faq.tsx:36`

This is also stated in `final-cta.tsx:139`. If this promotion has an end date or cap, it should be updated or removed before launch. If the 500 spots fill up, this becomes misleading.

---

### 10. `pricing.tsx` — Free plan says "5 AI actions / mo" but AI features page says different numbers

**File:** `components/pricing.tsx:20` vs `components/ai-features.tsx:12-34`

Pricing page says "5 AI actions / mo" for Free. The AI features breakdown says:
- Bio Generator: 3/mo
- Sponsor Pitch Writer: 2/mo
- Caption Generator: 5/mo
- Profile Improver: 1/mo

That's 11 total AI actions for free, not 5. Either the pricing page is wrong or the AI features page is wrong. This inconsistency will confuse users.

**Fix:** Reconcile the numbers. If the total is 5 across all tools, update the AI features page. If each tool has its own quota, update the pricing page to reflect the real limits.

---

### 11. `trust-strip.tsx` — no actual trust proof

**File:** `components/trust-strip.tsx`

The trust strip lists 14 sports (D1 Basketball, Football, Track & Field, etc.) with the label "Built for the next generation of NIL athletes." This is a claim, not proof. There are no logos of schools, teams, or partners. The sports list is just a text marquee.

**Fix:** Either add real school/team/partner logos (if any exist) or change the label to something like "Supporting athletes across 14+ sports" to avoid implying institutional endorsement.

---

## Low Issues

### 12. `smooth-scroll.tsx` — Lenis added to every page

**File:** `components/smooth-scroll.tsx`

Lenis smooth scroll is applied globally. It respects `prefers-reduced-motion` (good), but it adds JS overhead to every page including the dashboard. On the dashboard where users are clicking through nav items rapidly, smooth scroll can feel sluggish.

**Fix:** Consider only applying Lenis on the landing page, not the dashboard.

---

### 13. Webpack cache serialization warnings

**Build output:**
```
[webpack.cache.PackFileCacheStrategy] Serializing big strings (127kiB) impacts deserialization performance
```

Four warnings about large serialized strings in the webpack cache. This slows down incremental builds but doesn't affect production performance.

**Fix:** Low priority. Could investigate splitting large chunks or using `buffer` instead of string serialization.

---

### 14. `components/footer.tsx` — ParallaxWordmark mouse tracking on mobile

**File:** `components/footer.tsx:210-224`

The `ParallaxWordmark` component attaches a `mousemove` listener to `window`. On mobile, this listener does nothing useful (no mouse) but still runs. The effect is harmless but wasteful.

**Fix:** Guard with a check for pointer device type or just skip on mobile viewports.

---

## Pages Reviewed

| Page | Route | Status |
|------|-------|--------|
| Landing page | `/` | Clean |
| Sign in | `/auth/sign-in` | Clean |
| Sign up | `/auth/sign-up` | Clean |
| Forgot password | `/auth/forgot-password` | Clean |
| Reset password | `/auth/reset-password` | Clean |
| Auth error | `/auth/error` | Clean |
| Auth welcome | `/auth/welcome` | Clean |
| Onboarding | `/onboarding` | Clean (1 lint warning: `<img>`) |
| Public card | `/[username]` | Clean |
| Dashboard home | `/dashboard` | Clean |
| Dashboard profile | `/dashboard/profile` | Clean |
| Dashboard analytics | `/dashboard/analytics` | Clean |
| Dashboard AI | `/dashboard/ai` | Clean |
| Dashboard billing | `/dashboard/billing` | Clean |
| Dashboard settings | `/dashboard/settings` | Clean |
| Dashboard NIL | `/dashboard/nil` | Clean |
| Dashboard memberships | `/dashboard/memberships` | Clean |
| Dashboard campaigns | `/dashboard/campaigns` | Clean |
| Dashboard compliance | `/dashboard/compliance` | Clean |
| Dashboard marketplace | `/dashboard/marketplace` | Clean |
| Dashboard notifications | `/dashboard/notifications` | Clean |
| Dashboard schedule | `/dashboard/schedule` | Clean |
| Dashboard more | `/dashboard/more` | **MISSING — 404** |
| Discover | `/discover` | Clean (1 lint warning: `<img>`) |
| Brands | `/brands` | Clean |
| Brands setup | `/brands/setup` | Clean |
| Brands discover | `/brands/discover` | Clean |
| Brands dashboard | `/brands/dashboard` | Clean |
| Teams | `/teams` | Clean |
| Teams setup | `/teams/setup` | Clean |
| Team detail | `/teams/[teamId]` | Clean |
| About | `/about` | Clean |
| Changelog | `/changelog` | Clean |
| Feedback | `/feedback` | Clean |
| NIL guide | `/docs/nil-guide` | Clean |
| Help center | `/docs/help` | Clean |
| Terms | `/legal/terms` | Clean |
| Privacy | `/legal/privacy` | Clean |
| Suspended | `/suspended` | Clean |
| Offline | `/offline` | Clean |
| Referral | `/r/[username]` | Clean |
| Stripe status | `/stripe/status` | Clean (admin only) |
| Admin | `/admin` | Clean (admin only) |

---

## Build Output Summary

- **Compiled successfully** — 0 type errors
- **Lint:** 2 warnings (both `<img>` elements)
- **63 routes** generated (mix of static and dynamic)
- **First Load JS:** 160 kB shared baseline
- **Middleware:** 143 kB
- **Sentry deprecation:** 1 warning (will become error with Turbopack)
- **Webpack cache:** 4 serialization performance warnings (non-blocking)
