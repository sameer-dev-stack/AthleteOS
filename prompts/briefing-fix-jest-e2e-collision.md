# Agent C — Briefing
- Project: AthleteOS (Next.js 14 + Supabase + Stripe, NIL platform)
- Repo: https://github.com/sameer-dev-stack/AthleteOS · Branch: main (direct-main, AGENTS.md)
- Exclusive file(s): `jest.config.js`
- Non-overlap: `package.json` (owned by Prompt 2 / Agent D), `e2e/*` (not yours)
- STATUS: ACTIVE

<!-- === BRIEFING START (read by AGENT_PROMPT.md; this is the ONLY section workers consume) === -->
## BRIEFING
STATUS: ACTIVE — Isolate Jest unit tests from Playwright e2e specs

Read `D:/Projects/AthleteOS-main/docs/AGENTS.md` in full and obey it. Read `AGENT_PROMPT.md` (the universal prompt).

MONITOR SCOPE (collision-proof):
- WATCH ONLY: `jest.config.js`
- NEVER EDIT unless a regression/bug is explicitly reported against this file by the orchestrator.
- If a fix needs another file → STOP, report in OUTPUT. Do NOT cross files.

EMBEDDED CONTEXT (zero external lookup):
- `jest.config.js` is CommonJS (`module.exports`). It sets: `coverageProvider: 'v8'`, `testEnvironment: 'jsdom'`, `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`, `moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' }`. It has NO `testMatch` and NO `testPathIgnorePatterns`.
- Jest's default `testMatch` globs `**/?(*.)+(spec|test).[jt]s?(x)`, which matches `e2e/*.spec.ts`.
- The 3 files `e2e/landing.spec.ts`, `e2e/full-audit.spec.ts`, `e2e/user-flows.spec.ts` import `@playwright/test`. Jest cannot resolve that module → each suite fails with `Cannot find module '@playwright/test' from 'e2e/<file>'`.
- The 2 REAL unit suites (`__tests__/nil-score.test.ts`, `__tests__/utils.test.ts`) pass: 7/7 tests green.
- Root cause: Jest globs e2e specs it should never run. Playwright specs are executed by the Playwright runner (`playwright.config.js` / `playwright.prod.ts`), NOT Jest.

TASK:
1. Add `testPathIgnorePatterns: ['/node_modules/', '/e2e/']` to the `config` object.
2. Verify: `npx jest` (no args). Expected: exactly 2 suites (`__tests__/*`), 7 tests pass, exit 0. The 3 e2e suites must NOT appear.
3. Do NOT add `@playwright/test` and do NOT touch `e2e/` — that is Prompt 2 / Agent D's scope.

GUARDRAILS (non-negotiable):
- Smallest possible change — one line added. No rewrite.
- A single why-comment is allowed: `// e2e specs run via the Playwright runner, not Jest`.
- Single accent `#C6FF3D` only / dark-only / no emojis — not applicable to a config file, but keep edits minimal.

SELF-HEALING LOOP:
1. Read `jest.config.js` fully. 2. Add the ignore line. 3. `npx jest`. 4. Fix root cause, re-run (max 3×). 5. Forbidden-file error → STOP, report. 6. Config-only change — `npm run lint` optional, no `npm run build` needed.

ZERO CONTEXT LOSS: all facts are in this briefing. Never guess/invent values/enums/credentials.
<!-- === BRIEFING END === -->

<!-- === OUTPUT START (agent appends; orchestrator reviews) === -->
## OUTPUT (Agent C)

<!-- === OUTPUT END === -->
