# Graphify Skill for AI Agents

You are working on **AthleteOS** — a Next.js 14 + Supabase + Stripe NIL platform for student-athletes.

## How to use the knowledge graph

A full knowledge graph of this project exists at `graphify-out/`. It maps every file, function, component, and concept — how they connect, what depends on what, and why decisions were made.

### Before answering ANY codebase question, run:

```
graphify query "your question here"
```

This is faster and more accurate than reading files manually. The graph knows:
- Which files connect to which
- What `createClient()` powers (everything — it's the god node)
- How auth, billing, AI, analytics, and admin systems link together
- Architecture decisions documented in ADRs

### Useful commands:

```
graphify query "how does auth work?"
graphify query "what touches the profiles table?"
graphify query "show me the Stripe billing flow"
graphify path "AI Toolkit" "Stripe"
graphify explain "createClient"
```

### Key facts about this project:

- **Stack:** Next.js 14 App Router, TypeScript 5, Tailwind CSS, Supabase, Resend, Stripe, Vercel
- **Accent color:** `#C6FF3D` electric lime — ONLY accent, never add another
- **Dark mode only** — no light theme, no theme toggle
- **AI is metered** — Free=5, Pro=300, Elite=500 actions/month via Gemini
- **Server Components by default** — `"use client"` only when required
- **Every DB write validated with Zod** — no unvalidated inserts
- **RLS on every table** — scoped to `auth.uid()`
- **Service role key is server-side only** — never exposed to client

### After code changes, update the graph:

```
graphify extract . --update
```

### Full report:

Read `graphify-out/GRAPH_REPORT.md` for god nodes, surprising connections, and suggested questions.

### Current god nodes:

1. `createClient()` — 89 edges (backbone of everything)
2. `verifyAdmin()` — 18 edges (admin security)
3. `getAiQuota()` — 14 edges (AI metering)
4. `Profile` — 14 edges (core data type)
5. `recordAiUsage()` — 12 edges (usage tracking)
