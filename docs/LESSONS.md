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
