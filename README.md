# AthleteOS

> **The NIL operating system for athletes.**
> One card. One link. Your entire NIL business.

A premium, dark-themed, conversion-focused landing page for the next generation of NIL (Name, Image, and Likeness) athletes. Built as the marketing front for a SaaS-style athlete identity + monetization + AI growth platform.

---

## Stack

- **Next.js 14** — App Router, static-friendly
- **React 18** + **TypeScript 5**
- **Tailwind CSS 3.4** — custom dark theme + tokens
- **Framer Motion 11** — scroll reveals, magnetic CTAs, animated counters, 3D tilt
- **Lenis 1** — buttery smooth scrolling site-wide
- **Lucide React** — icon system
- **Inter** — primary typeface

---

## Quick Start

```powershell
# Install
npm install

# Dev server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

---

## Project Structure

```
NIL/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Root layout + SmoothScroll provider
│   ├── page.tsx          # Landing page composition
│   └── globals.css       # Tailwind base + design tokens
├── components/
│   ├── motion/           # Animation primitives (Reveal, Tilt, Magnetic, etc.)
│   ├── ui/               # (reserved for shadcn-style atoms)
│   ├── athlete-card.tsx  # Hero centerpiece — 3D mockup
│   ├── hero.tsx
│   ├── problem.tsx
│   ├── solution.tsx
│   ├── features.tsx
│   ├── how-it-works.tsx
│   ├── ai-features.tsx
│   ├── monetization.tsx
│   ├── pricing.tsx
│   ├── faq.tsx
│   ├── final-cta.tsx
│   └── footer.tsx
├── lib/utils.ts          # cn() helper (clsx + tailwind-merge)
├── docs/                 # All project documentation (see below)
├── AGENTS.md             # Rules for AI coding agents
├── NIL.md                # Original product brief
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

---

## Documentation

All living documentation is in [`docs/`](./docs):

- **[CONTEXT.md](./docs/CONTEXT.md)** — Master product/brand context
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — System architecture & data flow
- **[DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md)** — Colors, typography, motion tokens
- **[COMPONENTS.md](./docs/COMPONENTS.md)** — Per-component reference
- **[COPY.md](./docs/COPY.md)** — All verbatim landing page copy
- **[CHANGELOG.md](./docs/CHANGELOG.md)** — Session-by-session history
- **[ROADMAP.md](./docs/ROADMAP.md)** — Post-landing MVP plan
- **[DECISIONS.md](./docs/DECISIONS.md)** — Architecture decision records
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** — Vercel + GitHub workflow

For AI agents working on this repo, **read [`AGENTS.md`](./AGENTS.md) first**.

---

## Deploy

Deployed via Vercel. Auto-deploys on push to `main`. See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

---

## License

Private. © AthleteOS, Inc.
