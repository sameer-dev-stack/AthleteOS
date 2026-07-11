<!-- AGENT BRIEFING FILE — orchestrator-owned. Structure is CONTRACTUAL: the universal prompt
     (AGENT_PROMPT.md) depends on these exact markers. Do NOT rename sections. -->
<!-- BRIEFING is FROZEN (orchestrator). OUTPUT is agent-append-only. -->
<!--
  AthleteOS briefing conventions (override KKhan's template — this repo uses NO ৳, NO enums,
  but DOES enforce: single accent #C6FF3D, dark-only, no emojis, no comments unless why,
  smallest-possible change, Server Components by default, Zod-before-write, getUser() not getSession().)
-->

# <Agent Name> — Briefing
- Project: AthleteOS (Next.js 14 + Supabase + Stripe, NIL platform)
- Repo: https://github.com/sameer-dev-stack/AthleteOS · Branch: main (direct-main, AGENTS.md)
- Exclusive file(s): `<path>`  <!-- only these may be edited -->
- Non-overlap: <other agents' files — name them>
- STATUS: <ACTIVE | MONITOR | COMPLETE>

<!-- === BRIEFING START (read by AGENT_PROMPT.md; this is the ONLY section workers consume) === -->
## BRIEFING
STATUS: ACTIVE — <one-line task>

Read `D:/Projects/AthleteOS-main/docs/AGENTS.md` in full and obey it. Read `AGENT_PROMPT.md` (the universal prompt) for the standing contract.

MONITOR SCOPE (collision-proof):
- WATCH ONLY: `<file>`
- NEVER EDIT unless a regression/bug is explicitly reported against this file by the orchestrator.
- If a fix needs another file → STOP, report in OUTPUT. Do NOT cross files.

EMBEDDED CONTEXT (zero external lookup):
<facts, props, constraints, exact file paths, function signatures — no external lookup required>

TASK:
1. <step — smallest possible change>
2. <step>
N. Verify ONCE: `npm run lint` is NOT run during generation; run `npx tsc --noEmit` only. The full `npm run lint && npm run build` gate runs centralized in CI (`.github/workflows/ci.yml`) after the batch.

GUARDRAILS (non-negotiable):
- Single accent `#C6FF3D` only. Never add a second accent color.
- Dark mode only. No light theme, no theme toggle. Bg `#0A0A0B`.
- No emojis in code or copy unless explicitly requested.
- No comments unless they explain WHY.
- Server Components by default; `"use client"` only when required.
- Every DB write validated with Zod first. RLS on every table, scoped to `auth.uid()`.
- Use `getUser()` not `getSession()` in Server Components. Never expose service-role key client-side.
- Smallest possible change. Reuse existing patterns in neighboring files.

SELF-HEALING LOOP:
1. Read file fully. 2. Minimal change. 3. `npx tsc --noEmit`. 4. Fix root cause, re-run (max 3×). 5. Forbidden-file error → STOP, report. 6. No lint/build during generation.

ZERO CONTEXT LOSS: all facts are in this briefing. Never guess/invent values/enums/credentials.
<!-- === BRIEFING END === -->

<!-- === OUTPUT START (agent appends; orchestrator reviews) === -->
## OUTPUT (<Agent Name>)

<!-- === OUTPUT END === -->
