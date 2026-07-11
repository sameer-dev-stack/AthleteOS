# MVP_PROGRESS.md — Launch Readiness Tracker

> Single source of truth for MVP launch status.
> Goal: a **functional, working** MVP — not perfect UI/UX.
> Update after every logical change. Remove items only when verified live.

---

## Launch Gate Status (updated 2026-07-09)

| Gate | Status | Note |
|------|--------|------|
| Code builds (`npm run build`) | ✅ PASS | exit 0, 63/63 pages, `/dashboard/nil` compiles |
| Lint clean (`npm run lint`) | ✅ PASS | exit 0, 2 cosmetic `<img>` warnings only |
| Deps installed (`node_modules`) | ✅ DONE | 873 pkgs, `npm install` |
| App runs locally (`npm run dev`) | ✅ DONE | `/`=200, `/auth/sign-in`=200, `/dashboard/nil`=307 (auth gate OK) |
| Local env configured (`.env.local`) | ✅ DONE | copied from `env`; live Supabase/Stripe/Gemini keys present |
| **Git repo initialized** | ⛔ BLOCKED | folder has NO `.git` / no remote. CI (`ci.yml`) can't run |
| **Supabase migrations applied** | ⛔ BLOCKED | `20260709_nil_score_history.sql` + others not run against live DB |
| **Vercel project linked** | ⛔ BLOCKED | CLI installed+authed but no project linked, no env in Vercel |
| **Live deploy (URL)** | ⛔ BLOCKED | no deploy performed (local-only mode this session) |
| **Domain/DNS** | ⛔ NOT CONFIG | deferred |

---

## Completed This Session (NIL Core)

### NIL Score History feature (functional)
- [x] Migration `supabase/migrations/20260709_nil_score_history.sql` — creates `nil_score_history` (RLS: owner select, service_role all, admin read) + 2 indexes. **Verified on disk.**
- [x] `lib/actions/nil-engine.ts` — inserts history row after each `nil_value_metrics` upsert (line ~171-186, pre-existing from prior session).
- [x] `getNilScoreHistory()` action appended (line 543) — returns `{computed_at, nil_score, label}[]`, graceful empty on missing table. **Verified on disk.**
- [x] `components/dashboard/nil-score-history.tsx` — NEW, dark-only, trend panel, empty-state. **Created (hand-written after worker miss).**
- [x] Mounted in `app/dashboard/nil/client.tsx` column 3 (below `NilAiBreakdown`).

### Engine hardening
- [x] `engagement_rate` placeholder documented (`// ponytail:` comment) — still `0.05` baseline, no real engagement column exists yet. No behavior change.
- [x] `tips_amount` cents→dollars (`/100`) conversion **verified correct** vs `tips.amount` (Stripe cents) + `analytics.ts`.

---

## Blocked / Needs User Action

### Repo + Deploy (account boundaries — user decides)
- **Status:** BLOCKED
- **Issue:** No git repo in `D:\Projects\AthleteOS-main`; `ci.yml` targets `github.com/sameer-dev-stack/AthleteOS` (Sameer's account). Not linked to Vercel.
- **Options given:** A) user links Vercel+GitHub self, B) init git+new repo under user's account, C) `vercel deploy --prebuilt` preview now, D) pause for Sameer.
- **Impact:** Cannot push, run CI, or deploy until resolved.

### Supabase migration execution
- **Status:** NEEDS EXECUTION
- **Issue:** `20260709_nil_score_history.sql` (and possibly earlier migrations) not applied to live DB.
- **Note:** `env` keys point at an EXISTING Supabase project (likely Sameer's), so a project exists — but schema may be missing this table. NIL history will error at runtime until applied.
- **Action:** `supabase db push` OR paste SQL in Supabase SQL editor. Requires Supabase login (CLI not authed this session).

### next@14.2.15 security CVE
- **Status:** KNOWN, NON-BLOCKING
- Patched version available per Next.js security advisory (2025-12-11). Bump before/after launch.

---

## Pre-Launch Checklist (remaining)
- [ ] Init git repo + connect remote
- [ ] Apply all Supabase migrations to live project
- [ ] Link Vercel project + set env vars (or pull from local)
- [ ] Deploy to production (`vercel --prod`)
- [ ] Smoke test core flows on live URL: signup → onboarding → card publish → NIL recalc → tip
- [ ] Configure Stripe webhook endpoint (events: checkout.session.completed, customer.subscription.updated/deleted)
- [ ] Bump Next.js security patch
- [ ] Decide domain/DNS

---

## Known Limitations (accepted for MVP, not bugs)
- `engagement_rate` is a hardcoded 5% placeholder — no real social engagement ingested yet.
- NIL score history only starts populating AFTER first recalc post-migration.
- `computeHistoricalTrend` / `compareAthletes` helpers in `lib/nil-score.ts` are unused (dead code) — trend UI uses raw history list, not these helpers.

---

## Orchestration Notes (how work was done)
- Model: Ghost = orchestrator only. Workers: Cline, Kilo Code, OpenCode executed code via paste-ready briefings.
- Lesson: delegated file creation for `nil-score-history.tsx` missed **twice** (worker self-reports didn't match disk). Resolve by verifying on disk, not trusting worker `## OUTPUT`. Hand-write if delegation loops.
- AGENTS.md rule honored: no lint/build during generation; centralized verify once at end (passed).

---

Last updated: 2026-07-09
