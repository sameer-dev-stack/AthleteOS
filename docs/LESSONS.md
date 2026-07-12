# LESSONS.md — Reusable Knowledge & Patterns

> Persisted lessons learned across sessions. Next agents consult this before reinventing.

---

## L1 — Isolate reward/attribution policy in pure helpers

Reward and attribution decisions (who gets rewarded, by how much) belong in pure,
unit-tested functions separate from the DB application (rpc calls). Mirrors the
T4 `resolvePlan` / T3 `hashIp` pattern.

- Canonical example: `usersToReward(referrerId, referredId, isSelf, alreadyReferred)`
  in `lib/referral-reward.ts` — returns the list of user IDs to reward, no Supabase.
- The action (`recordReferral`) only applies the policy by looping `grant_pro_reward`
  over the returned IDs via the service-role admin client.
- Benefit: policy changes (e.g. unequal referrer/referred amounts) require no action changes;
  the policy is fully testable without a DB.

**Source:** ADR-040 (two-sided referral reward), 2026-07-12.

---

## L2 — TDD-first for pure policy helpers

When adding a policy/decision function, write the failing test first (the helper not
exported → test fails), implement minimally, then confirm pass. Cheap, fast, and
documents intent. Used for both `resolvePlan` and `usersToReward`.

---

## L3 — Dashboard page pattern (Server fetch + presentational client + pure display helpers)

For any new dashboard page:
1. **Server Component** page fetches data via `Promise.all([...])` of server actions
   and passes results as props to a `"use client"` presentational component. Use
   `getMyProfile()` to gate auth and `redirect()` for unauthenticated users.
2. **Pure display transforms** (date/status formatting, labels) live in `lib/*-display.ts`
   helpers — TDD-able, no React/DB. Example: `lib/referral-display.ts` (`proUntilLabel`,
   `statusLabel`).
3. Keep client components presentational — no `createClient`/service-role in the client.
4. Match existing sibling component classes exactly (e.g. `referral-card.tsx` →
   `referral-dashboard.tsx`) for visual consistency.

**Source:** Built `/dashboard/referrals` (T8), 2026-07-12.

---

## L4 — Social share URLs are pure + encoded helpers

Build social share deep-links (Twitter/X, WhatsApp, Email, etc.) in a pure,
encoded helper (`buildShareLinks(link, text)` in `lib/share-links.ts`) rather
than inline in the component. Same pattern as the T3/T4/T6/T7/T8 helpers:
- The component stays presentational and the URL logic is TDD-able
  (`__tests__/share-links.test.ts`).
- Verify icon export names exist in the installed `lucide-react` version before
  importing (e.g. `Twitter` works here; newer versions may rename it `X`) —
  never import a non-existent icon.

**Source:** Built `<ShareSheet>` (T9), 2026-07-12.

---

## L5 — Personalized referral UI needs a code→name lookup that exposes only the display name

When surfacing a referral at signup, the client only has the `athleteos_ref` cookie
(the referral code), not the name. Resolve `code → referral_codes.user_id →
profiles.full_name` server-side in a nodejs Route Handler using the service-role
client, and return only `{ name }` — never email/avatar/other PII. The client reads
the cookie (non-httpOnly, set by middleware on `/r/[code]`), fetches the API, and
renders the name via a pure helper (`buildInvitedBy(name)` in `lib/referral-display.ts`).
Reuse the cookie-read regex from `app/onboarding/page.tsx:306` so both stay in sync.

**Pattern:** client reads `athleteos_ref` cookie → `GET /api/referral/referrer?code=` →
render `buildInvitedBy(name)`.

**Source:** Built the sign-up "Invited by {Name}" banner (T12), 2026-07-12.

---

## L6 — Sanitize free-text display names (reject email-shaped) before showing them to other users

Free-text display names (e.g. `profiles.full_name`) are untrusted input. Any value
surfaced to a *different* user — referral banner, mentions, sender names — must be
sanitized for PII before render. Use a single pure guard (`sanitizeReferrerName`
in `lib/referral-display.ts`): drop empty/whitespace and email-shaped values
(`/^\S+@\S+\.\S+$/`), and fall back to a generic string. Apply it both server-side
(return only the sanitized name from the API — never let the raw value cross the
wire) and client-side (the render helper re-sanitizes) for defense in depth.

**Source:** Fixed the referral banner PII leak (T13), 2026-07-12.

---

## L7 — Auth copy belongs in a pure helper; always show a processing state on async submit

User-facing auth copy (verification screen wording, etc.) lives in a pure,
TDD-able helper (`accountCreatedCopy` in `lib/auth-copy.ts`), not inline JSX —
so the exact wording is tested and consistent. On any async submit (server
action / slow route), show an unambiguous processing state: an inline spinner
on the button (`animate-spin` + disabled) **plus** a full-screen overlay
(`components/auth/processing-overlay.tsx`) for multi-second transitions, until
navigation completes. Release the overlay on the error path so the user can retry.

**Source:** Signup submit loading state + verify-email copy (T14), 2026-07-12.

---

## L9 — A plain function passed to `<form action>` is NOT a React 18 form action

In React 18 / Next 14 App Router, `<form action={fn}>` only accepts a real
form-action dispatch — e.g. the `formAction` returned by `useFormState` (as the
sign-in form does). Passing a *plain client function* (a `handleSubmit`
wrapper) makes the browser fall back to a **native form submission (full page
reload)**. The reload resets `useFormState` to its initial value and cancels any
client `router.push`, so the user sees the submit overlay ("Processing…") and
is then stranded on the same page with no error text. Same signature as
calling `revalidatePath` inside the action (also resets state + cancels
navigation) — but the native-submit bug is the usual culprit. Fix: pass
`formAction` straight to `<form action>`, and set any loading flag via
`onSubmit={() => setLoading(true)}` (don't `preventDefault`, or the action
won't run). Tell a *reset* submit (no error copy) from a *failed* one (red
error copy shows): only a reset strands the user silently.

**Source:** Fixed create-account stuck on "Processing…" (T16), 2026-07-12.

---

## L8 — Auth inputs deserve SaaS-grade polish: password toggle, reduced-motion, trust signal

Repeated form inputs ship as one shared component (`PasswordField` in
`components/auth/password-field.tsx`) so sign-up and sign-in never drift — the
show/hide eye toggle flips the input type via a pure helper
(`nextPasswordInputType` in `lib/auth-copy.ts`), is `type="button"` (never
submits), and carries an `aria-label`. Every CSS animation must be gated with
`motion-reduce:animate-none` (the `animate-pulse` skeleton in
`account-created/page.tsx` respects `prefers-reduced-motion`). Trust copy
("Secured by…") lives in `lib/auth-copy.ts` and renders under each submit button.

**Source:** Auth UX hardening (T15), 2026-07-12.
