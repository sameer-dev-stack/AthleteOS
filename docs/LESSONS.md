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
