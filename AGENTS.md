# AGENTS.md — Project Rules for AI Agents

> This file is read by AI coding agents (opencode, Claude Code, Cursor, etc.) at session start.
> Follow these rules **on every session** without being reminded.

---

## Project

**AthleteOS** — premium dark-themed NIL (Name, Image, Likeness) business operating system for student-athletes.
Built as a startup-grade conversion page that scales into the athlete's full NIL operating system.

**Repo:** https://github.com/sameer-dev-stack/AthleteOS
**Local path:** `C:\Users\Sameer\Desktop\NIL`
**Live (Vercel):** `https://athlete-os-vert.vercel.app`

---

## Stack

Next.js 14 App Router, TypeScript 5, Tailwind CSS (dark only, single accent #C6FF3D), Supabase (Postgres + Auth + RLS), Resend, Vercel.

---

## Standing Rules (read every session)

### 0. GOLDEN RULE — Document everything, never lose context

**Every single piece of information about this project MUST be documented in a `.md` file.**
Do not assume the next agent will "just know" something. Write it down.

This includes:
- **Credentials, API keys, tokens** — document in `docs/CREDENTIALS.md`.
- **Service URLs and project IDs** — Supabase, Vercel, Resend, GitHub, etc.
- **Admin/sign-in accounts** — document in `docs/CREDENTIALS.md`.
- **Every session** — what changed, why, files touched, commit hash. Document in `docs/CHANGELOG.md`.
- **Every code change** — must be reflected in the relevant `docs/*.md` file in the same session.
- **Every decision** — architecture, design, package choice, config change. Document in `docs/DECISIONS.md`.
- **Every component** — added, renamed, removed, or changed. Document in `docs/COMPONENTS.md`.
- **Every copy edit** — any user-facing text change. Document in `docs/COPY.md`.

**If you are unsure whether to document something, document it.**

### 1. Always update documentation

Never let the docs drift from the code.

**Required updates per session:**
- `docs/CHANGELOG.md` — append a new dated session entry.
- `docs/CREDENTIALS.md` — update when any key, token, URL, or account changes.
- `docs/COMPONENTS.md` — update if components are added, renamed, removed, or refactored.
- `docs/ARCHITECTURE.md` — update if file/folder structure changes.
- `docs/DESIGN_SYSTEM.md` — update if tokens change.
- `docs/COPY.md` — update if any user-facing copy changes.
- `docs/DECISIONS.md` — append a new ADR entry for non-trivial decisions.
- `docs/ROADMAP.md` — update when scope changes or items ship.
- `docs/DEPLOYMENT.md` — update when deploy config changes.

### 2. Always push to GitHub

At the end of any session that changed files, commit and push to `origin/main`.

```powershell
git add -A
git commit -m "<concise present-tense summary>"
git push
```

### 3. Verify before committing

Run these before pushing:
```powershell
npm run lint
npm run build
```
Both must pass. Do not push broken builds.

### 4. Secret key handling

Credentials are documented in `docs/CREDENTIALS.md`. The `.env` file is gitignored.
Never hardcode keys into source code. Reference them from `.env` only.
If changing a key, update BOTH `.env` AND `docs/CREDENTIALS.md`.

### 5. Branching

Default to direct commits on `main` unless explicitly told otherwise.

---

## Rules You Must Never Break

1. **Server Components by default** — `"use client"` only when required (hooks, effects, event handlers, Framer Motion).
2. **Every DB write validated with Zod first** — no unvalidated inserts/updates.
3. **RLS enabled on every table**, scoped to `auth.uid()`.
4. **Use `getUser()` not `getSession()` in Server Components** — getSession can be stale.
5. **Never expose service role key client-side** — only used in Server Actions and route handlers.
6. **No second accent color.** Single accent: `#C6FF3D` (electric lime). Never add another.
7. **No light mode.** Dark only. No theme toggle.
8. **No emojis** in code or copy unless explicitly requested.
9. **Make the smallest possible code change** — never rewrite existing functions unless told.
10. **No comments** unless they explain *why*, not *what*.

---

## Session Workflow Checklist

At the **start** of every session:
1. Run `git status` — commit anything uncommitted.
2. Run `npm run lint && npm run build` — both must be clean.
3. Read `docs/CHANGELOG.md` for fresh context.
4. Read `docs/VISION.md` — the master strategic blueprint.
5. Read `docs/CREDENTIALS.md` to know all active keys, URLs, and accounts.
6. Read `docs/CONTEXT.md` if returning after a long gap.

At the **end** of every session that modified files:
1. Run `npm run lint && npm run build` — fix errors before continuing.
2. Run `npx playwright test e2e/full-audit.spec.ts --config=playwright.prod.ts` — all 39 tests must pass against live production.
3. Update ALL relevant docs.
4. Stage, commit, push.
5. Reply to the user with a summary + commit hash.

---

## Conventions

- **Component naming:** kebab-case files, PascalCase exports. `components/feature-name.tsx`.
- **Section components** live in `components/` root and are composed in `app/page.tsx`.
- **Motion primitives** live in `components/motion/`.
- **Utilities** live in `lib/`.
- **Server Actions** live in `lib/actions/`.
- **Accent color is single:** `#C6FF3D` (electric lime).
- **Dark mode only.** No light theme.

---

## Documentation Map

| File | Purpose | Update trigger |
|------|---------|----------------|
| `AGENTS.md` | This file — agent rules | Rules or workflow changes |
| `docs/CONTEXT.md` | Master product/brand context | Mission, audience, positioning changes |
| `docs/CREDENTIALS.md` | All API keys, tokens, URLs, admin accounts | Any credential change |
| `docs/ARCHITECTURE.md` | File tree, component map, data flow | Structural changes |
| `docs/DESIGN_SYSTEM.md` | Tokens, type, motion, patterns | Theme/animation token changes |
| `docs/COMPONENTS.md` | Per-component reference | Component add/remove/refactor |
| `docs/COPY.md` | Verbatim landing page copy | Any user-facing text edit |
| `docs/CHANGELOG.md` | Session-by-session history | Every session |
| `docs/ROADMAP.md` | Post-landing-page MVP plan | Scope changes, items shipped |
| `docs/DECISIONS.md` | ADR-style records | Any non-trivial decision |
| `docs/DEPLOYMENT.md` | Vercel + GitHub workflow | Deploy/CI changes |

---

Last updated: 2026-07-02
