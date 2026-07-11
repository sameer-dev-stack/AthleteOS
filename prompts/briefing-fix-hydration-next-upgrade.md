<!-- AGENT BRIEFING — orchestrator-owned. Paste the PROMPT below into Cline/Kilo/OpenCode. -->
<!-- Exclusive files declared. Do NOT cross them. Verify-once at end. -->

# Agent E — Fix hydration mismatch on `/` + outdated Next.js
- Project: AthleteOS (Next.js 14 App Router + Supabase + Stripe, NIL platform)
- Repo: https://github.com/sameer-dev-stack/AthleteOS · Branch: main (direct-main; obey docs/AGENTS.md)
- Exclusive files: `components/hero.tsx` + its motion children (`components/motion/*`, `components/athlete-card.tsx`, `components/hero-cta.tsx`, `components/motion/live-waitlist-count.tsx`, `components/motion/social-proof-avatars.tsx`, `components/motion/typing-text.tsx`, `components/motion/animated-gradient-bg.tsx`, `components/motion/floating-elements.tsx`) + `package.json` (Next bump ONLY)
- STATUS: ACTIVE

<!-- === PROMPT START (paste this block into the coding agent) === -->

# Fix: landing-page hydration error + outdated Next.js

You are fixing two issues in AthleteOS (Next.js 14 App Router). Read `docs/AGENTS.md` and `AGENT_PROMPT.md` first. Hard rules: single accent `#C6FF3D`, dark-only, no emojis, no comments unless explaining WHY, smallest possible change, Server Components by default, `"use client"` only when required.

## P1 — Hydration mismatch on `/` (Unhandled Runtime Error)
Symptom (from browser console):
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
Did not expect server HTML to contain a <div> in <div>.
  <Home><main><Hero><section><div>   (caret on the div)
```
A second error names the same node: `There was an error while hydrating this Suspense boundary. Switched to client rendering.`

### Root-cause hunt (do this BEFORE editing — do not guess)
1. `npm run dev`, open `http://localhost:3000/` in a browser. Read the FULL hydration error — React prints the server HTML vs client HTML diff for the offending node. That names the exact component + which attribute/child differs.
2. The mismatch is in `Hero` (`components/hero.tsx`), which composes motion wrappers + `AthleteCard`. Prime suspects (anything that renders differently on server vs first client paint — i.e. uses `Math.random()`, `new Date()`, `window`, or browser-only state WITHOUT a mounted guard):
   - `components/motion/floating-elements.tsx`
   - `components/motion/animated-gradient-bg.tsx`
   - `components/motion/typing-text.tsx`
   - `components/motion/live-waitlist-count.tsx`
   - `components/motion/social-proof-avatars.tsx`
   Note: `9:41` in `athlete-card.tsx:23` is STATIC — not the bug. `Reveal` uses `useReducedMotion()` (consistent server/client) — not the bug.
3. Confirm the exact culprit component + line before editing.

### Fix (Ponytail: smallest change, fix the CAUSE not the symptom)
- If a component renders a live/random value during SSR: gate the dynamic part behind a `mounted` flag. Render a STABLE placeholder on the server AND on first client render (byte-identical), then swap in the real value inside `useEffect`. Server HTML === first client HTML ⇒ mismatch gone.
- If it uses `Math.random()` for positions/keys: generate them in `useEffect` (post-mount) or seed deterministically. NEVER during render on the server.
- Do NOT blanket-add `suppressHydrationWarning` to silence it — that hides the bug and fails our quality bar. Use it ONLY on a single element that is genuinely client-time-only (e.g. a clock) AFTER confirming nothing else mismatches.

## P2 — Next.js (14.2.15) is outdated
Warning, not a crash, but it must clear.
- Run `npm outdated next eslint-config-next`. Bump to the LATEST `14.2.x` PATCH only. Do NOT jump to Next 15 (major; needs React 19, breaks App Router APIs). Minimal + safe.
- Set `next` and `eslint-config-next` to that same `14.2.x` version in `package.json`. `npm install`.

## Guardrails
- Touch ONLY the exclusive files. Overlap with another task? STOP and report.
- Single smallest diff. Reuse existing patterns. No refactors of neighboring code.

## Verify (run all, paste output)
1. `npm run build` → succeeds; route `/` builds; no hydration warnings in build log.
2. `npm run start` → open `http://localhost:3000/`; browser console MUST be clean (no hydration error). This is the real proof.
3. `npm run lint` → 0 errors.
4. `npm run test` → 7/7 pass (don't regress the unit suite).
Report: which component caused P1, the exact one-line fix, and the final Next version.

<!-- === PROMPT END === -->

## OUTPUT (Agent E — append findings + exact diff)
