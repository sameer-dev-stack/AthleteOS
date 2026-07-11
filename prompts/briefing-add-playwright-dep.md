# Agent D — Briefing
- Project: AthleteOS (Next.js 14 + Supabase + Stripe, NIL platform)
- Repo: https://github.com/sameer-dev-stack/AthleteOS · Branch: main (direct-main, AGENTS.md)
- Exclusive file(s): `package.json`
- Non-overlap: `jest.config.js` (owned by Prompt 1 / Agent C), `e2e/*` (not yours to author)
- STATUS: ACTIVE

<!-- === BRIEFING START (read by AGENT_PROMPT.md; this is the ONLY section workers consume) === -->
## BRIEFING
STATUS: ACTIVE — Make the mandated Playwright e2e suite runnable

Read `D:/Projects/AthleteOS-main/docs/AGENTS.md` in full and obey it. Read `AGENT_PROMPT.md` (the universal prompt).

MONITOR SCOPE (collision-proof):
- WATCH ONLY: `package.json`
- NEVER EDIT unless a regression/bug is explicitly reported against this file by the orchestrator.
- If a fix needs another file → STOP, report in OUTPUT. Do NOT cross files.

EMBEDDED CONTEXT (zero external lookup):
- `AGENTS.md` Session Workflow (end-of-session) mandates: `npx playwright test e2e/full-audit.spec.ts --config=playwright.prod.ts` — all 100 tests must pass against live production.
- Reality: `@playwright/test` is NOT in `package.json` (neither deps nor devDeps) and is NOT in `node_modules`. So `npx playwright test` fails with `Cannot find module '@playwright/test'`. The mandated verification is unrunnable out of the box.
- `package.json` scripts are: `dev`, `build`, `start`, `lint`, `gen:og`. There is NO `test` script and NO `test:e2e` script.
- `playwright.config.js` and `playwright.prod.ts` both `require('@playwright/test')` and use `e2e/` as `testDir`. The 3 specs exist: `e2e/landing.spec.ts`, `e2e/full-audit.spec.ts`, `e2e/user-flows.spec.ts`.

TASK:
1. Add `"@playwright/test": "^1.48.0"` to `devDependencies` (aligned with the project's Oct-2024 era deps; any 1.x resolves the import).
2. Add two scripts to `package.json`:
   - `"test": "jest"`
   - `"test:e2e": "playwright test"`
3. Do NOT install browser binaries (that is a one-time manual `npx playwright install chromium` needing network — out of scope for this file change). Do NOT modify `e2e/` specs. Do NOT touch `jest.config.js` (Prompt 1 scope).
4. Verify: after `npm install`, `npx playwright --version` must print a version (not "module not found"). `npm run test` must map to `jest`.

GUARDRAILS (non-negotiable):
- Smallest possible change — add one devDep line + two script lines. No rewrite.
- No secrets, no env changes.
- Keep version pin conservative (`^1.48.0`); do NOT jump to a major that could break the existing `playwright.config.js` API.

SELF-HEALING LOOP:
1. Read `package.json` fully. 2. Add devDep + scripts. 3. `npm install`. 4. `npx playwright --version`. 5. Fix root cause, re-run (max 3×). 6. Forbidden-file error → STOP, report.

ZERO CONTEXT LOSS: all facts are in this briefing. Never guess/invent values/enums/credentials.
<!-- === BRIEFING END === -->

<!-- === OUTPUT START (agent appends; orchestrator reviews) === -->
## OUTPUT (Agent D)

<!-- === OUTPUT END === -->
