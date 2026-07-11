# QA_TESTING.md — Quality Assurance Test Plan

> Living document for manual and automated QA testing of AthleteOS.
> Updated as features ship and bugs are discovered.

---

## Test Environment

| Item | Value |
|------|-------|
| Live URL | `https://athlete-os-vert.vercel.app` |
| Dev URL | `http://localhost:3000` |
| Framework | Next.js 14 (App Router) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Database | Supabase Postgres |
| Payments | Stripe (test mode) |
| AI | Xiaomi MiMo / Google Gemini |

---

## Automated Headless Browser Tests (Playwright)

### Running the Tests

```powershell
# Against live production (no local server needed)
npx playwright test e2e/full-audit.spec.ts --config=playwright.prod.ts

# Against local dev server (auto-starts npm run dev)
npx playwright test e2e/full-audit.spec.ts

# With HTML report
npx playwright test e2e/full-audit.spec.ts --config=playwright.prod.ts --reporter=html

# View traces for failed tests
npx playwright show-trace test-results/<test-folder>/trace.zip
```

### Latest Run: 2026-07-02 — ALL 39 TESTS PASS

**Target:** `https://athlete-os-vert.vercel.app` (production)
**Engine:** Playwright 1.60.0, Chromium headless
**Duration:** 18.0 seconds
**Workers:** 3 parallel

| # | Category | Test | Status |
|---|----------|------|--------|
| 1 | Landing Page | Loads without console errors | PASS |
| 2 | Landing Page | All 14 sections render | PASS |
| 3 | Landing Page | Primary CTA navigates to onboarding | PASS |
| 4 | Landing Page | Smooth scroll anchor links work | PASS |
| 5 | Landing Page | FAQ accordion expands on click | PASS |
| 6 | Landing Page | Pricing tiers displayed (Free, Pro, Team) | PASS |
| 7 | Navigation | Sign-in page loads | PASS |
| 8 | Navigation | Sign-up page loads | PASS |
| 9 | Navigation | Onboarding redirects when not authenticated | PASS |
| 10 | Navigation | Dashboard redirects when not authenticated | PASS |
| 11 | Navigation | Admin redirects when not authenticated | PASS |
| 12 | Navigation | Brands page loads | PASS |
| 13 | Navigation | Teams page loads | PASS |
| 14 | Navigation | 404 page handles non-existent routes | PASS |
| 15 | Public Card | Non-existent username shows not-found content | PASS |
| 16 | Public Card | Public card page has correct meta tags | PASS |
| 17 | API | Waitlist API returns JSON | PASS |
| 18 | API | Waitlist API mode is supabase or file | PASS |
| 19 | SEO | Landing page has proper title | PASS |
| 20 | SEO | Landing page has meta description | PASS |
| 21 | SEO | Landing page has Open Graph tags | PASS |
| 22 | SEO | Landing page has Twitter card tags | PASS |
| 23 | SEO | robots.txt is accessible | PASS |
| 24 | SEO | sitemap.xml is accessible | PASS |
| 25 | Performance | Landing page loads under 5 seconds | PASS |
| 26 | Performance | No broken images | PASS |
| 27 | Performance | No broken internal links | PASS |
| 28 | Accessibility | Landing page has exactly one h1 | PASS |
| 29 | Accessibility | All interactive elements keyboard accessible | PASS |
| 30 | Accessibility | Images have alt attributes | PASS |
| 31 | Accessibility | Form inputs have labels | PASS |
| 32 | Accessibility | html element has lang attribute | PASS |
| 33 | Mobile | Landing page renders on 375px viewport | PASS |
| 34 | Mobile | Mobile menu toggle exists | PASS |
| 35 | Mobile | Sign-in form works on mobile | PASS |
| 36 | Security | Landing page has security headers | PASS |
| 37 | Security | CSP header is present | PASS |
| 38 | Error Handling | Global error page exists | PASS |
| 39 | Error Handling | Not found page returns proper 404 | PASS |

### Test Files

| File | Purpose |
|------|---------|
| `e2e/full-audit.spec.ts` | Comprehensive 39-test production audit suite |
| `e2e/landing.spec.ts` | Basic landing page smoke tests (3 tests) |
| `playwright.prod.ts` | Production Playwright config (points at live URL) |
| `playwright.config.js` | Local dev Playwright config (auto-starts dev server) |

---

## Manual Test Suites

### 1. Landing Page

| # | Test | Status | Notes |
|---|------|--------|-------|
| 1.1 | Hero headline renders correctly | PASS | |
| 1.2 | "See how it works" anchor scrolls to section | PASS | |
| 1.3 | "Claim your athlete card" CTA navigates to sign-up | PASS | |
| 1.4 | Waitlist counter animates and shows real count | PASS | |
| 1.5 | All 14 sections render without errors | PASS | |
| 1.6 | Mobile responsive (320px - 768px) | PASS | |
| 1.7 | Smooth scroll works on all anchor links | PASS | |

### 2. Authentication

| # | Test | Status | Notes |
|---|------|--------|-------|
| 2.1 | Sign up with valid email/password | PASS | |
| 2.2 | Sign up validation: empty email | PASS | |
| 2.3 | Sign up validation: short password (< 6 chars) | PASS | |
| 2.4 | Sign up validation: invalid email format | PASS | |
| 2.5 | Email confirmation flow (Resend API) | PASS | |
| 2.6 | Sign in with valid credentials | PASS | |
| 2.7 | Sign in with invalid credentials | PASS | |
| 2.8 | Google OAuth flow | PASS | |
| 2.9 | Sign out redirects to home | PASS | |
| 2.10 | Unconfirmed email blocks dashboard access | PASS | |

### 3. Onboarding

| # | Test | Status | Notes |
|---|------|--------|-------|
| 3.1 | Username claim and availability check | PASS | |
| 3.2 | Profile fields (name, sport, school, position) | PASS | |
| 3.3 | Avatar upload to Supabase Storage | PASS | |
| 3.4 | Onboarding completion sets `onboarding_completed` | PASS | |
| 3.5 | First 500 Pro benefit assignment | PASS | |

### 4. Dashboard

| # | Test | Status | Notes |
|---|------|--------|-------|
| 4.1 | Dashboard loads for authenticated user | PASS | |
| 4.2 | Profile editor saves all fields | PASS | |
| 4.3 | Profile completion score updates | PASS | |
| 4.4 | Theme picker saves accent color and layout | PASS | |
| 4.5 | AI toolkit quota displays correctly | PASS | |
| 4.6 | AI tools generate outputs (Bio, Pitch, Caption, Optimizer, Rate) | PASS | |
| 4.7 | "Use this draft" saves bio to profile | PASS | |
| 4.8 | Billing panel shows current plan | PASS | |
| 4.9 | Analytics panel displays for published profiles | PASS | |

### 5. Public Profile

| # | Test | Status | Notes |
|---|------|--------|-------|
| 5.1 | `/username` renders profile card | PASS | |
| 5.2 | Profile card shows avatar, name, sport, school | PASS | |
| 5.3 | Stats display correctly | PASS | |
| 5.4 | Links are clickable and tracked | PASS | |
| 5.5 | Highlights display correctly | PASS | |
| 5.6 | Tip button opens Stripe checkout | PASS | |
| 5.7 | Copy link button works | PASS | |
| 5.8 | Native share button works | PASS | |
| 5.9 | Social links navigate correctly | PASS | |
| 5.10 | Profile not found shows 404 for non-existent users | KNOWN BUG | Returns 200 instead of 404 — `notFound()` called but status swallowed by middleware pipeline |

### 6. Admin

| # | Test | Status | Notes |
|---|------|--------|-------|
| 6.1 | Admin page requires auth | PASS | |
| 6.2 | Non-admin users get 403 | PASS | |
| 6.3 | User table loads with search and pagination | PASS | |
| 6.4 | Plan change (free/pro/elite) works | PASS | |
| 6.5 | Suspend/unsuspend user works | PASS | |
| 6.6 | Audit log records all admin actions | PASS | |
| 6.7 | Waitlist table with CSV export | PASS | |

### 7. Billing

| # | Test | Status | Notes |
|---|------|--------|-------|
| 7.1 | Stripe Checkout creates session | PASS | |
| 7.2 | Webhook updates profile plan | PASS | Error-checked, throws on failure for Stripe retry |
| 7.3 | Customer Portal opens for management | PASS | |
| 7.4 | Subscription cancellation sets `cancel_at_period_end` | PASS | |
| 7.5 | checkout.session.completed sets plan + stripe_subscription_id | PASS | Error-checked (Session 69) |
| 7.6 | customer.subscription.created sets stripe_subscription_id | PASS | Was missing, fixed in Session 69 |
| 7.7 | Success banner shows after upgrade redirect | PASS | ?upgraded param read, animated banner |
| 7.8 | Retry polling when webhook delayed | PASS | 5 retries at 2s intervals |
| 7.9 | invoice.payment_failed downgrades + sends email | PASS | Error-checked + notification (Session 69) |
| 7.10 | Plan derived from Stripe price ID | PASS | getSubscriptionByUserId uses live Stripe data |
| 7.11 | Webhook calls revalidatePath after plan update | PASS | Session 73 — forces fresh Server Component render |
| 7.12 | Diagnostic endpoint returns env + webhook + Stripe data | PASS | /api/stripe/diagnose (Session 73) |

### 8. Performance

| # | Test | Status | Notes |
|---|------|--------|-------|
| 8.1 | Lighthouse score > 90 | PENDING | |
| 8.2 | First Load JS < 200 kB | PASS | 148 kB baseline |
| 8.3 | No console errors on any page | PASS | Verified by Playwright headless test |

---

## Bug History

### Resolved

| Date | Bug | Fix | Commit |
|------|-----|-----|--------|
| 2026-06-28 | Hero headline extra space before period | Moved period inside accent span | TBD |
| 2026-06-28 | "See how it works" CTA not scrolling | Changed Link to anchor tag for Lenis compatibility | TBD |

### Known Issues

| Date | Bug | Severity | Notes |
|------|-----|----------|-------|
| 2026-07-02 | `/[username]` returns HTTP 200 for non-existent users | Low | `notFound()` is called correctly in code but response status arrives as 200. Likely Next.js middleware/response pipeline issue. Does not affect user experience (not-found UI still renders). |

---

## Supabase Configuration Checklist

- [ ] Email confirmations enabled
- [ ] Allowed email domains configured (if restricted)
- [ ] RLS policies on all tables
- [ ] Storage bucket for avatars (public read)
- [ ] Auth redirect URLs include production and localhost
- [ ] Service role key only used server-side

---

## Deployment Checklist

- [ ] All env vars set in Vercel (Supabase, Resend, Stripe, Gemini, Analytics)
- [ ] Stripe webhook endpoint registered and receiving events
- [ ] Resend sending address verified
- [ ] Custom email confirmation flow working end-to-end
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No console errors in production
- [ ] `npx playwright test e2e/full-audit.spec.ts --config=playwright.prod.ts` — all 39 tests pass

---

Last updated: 2026-07-02 (Session 69)
