# Brain — Approved Implementation Patterns

Add a pattern here only after it is validated in the codebase.

- **Ponytail ladder** before any code: YAGNI → reuse → stdlib → platform feature → installed dep →
  one-liner → minimum that works. Never cut validation, error handling, security, accessibility.
- **Server Components by default**; `"use client"` only when required (hooks, effects, handlers, motion).
- **Every DB write validated with Zod**; RLS scoped to `auth.uid()`.
- **Use `getUser()` not `getSession()`** in Server Components.
- **Service role key never client-side** — only Server Actions / route handlers.
- **Smallest possible change**; no comments unless explaining *why*.
- **Single accent `#C6FF3D`**, dark only, no emojis in code or copy.
