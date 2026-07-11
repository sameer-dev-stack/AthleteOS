# DESIGN_SYSTEM.md — Visual Tokens & Motion

> All design tokens, type scale, animation tokens, and component patterns.
> Source of truth for the look and feel.

---

## Color Tokens

Defined in `tailwind.config.ts` under `theme.extend.colors`.

| Token | Hex | Role |
|-------|-----|------|
| `bg.DEFAULT` | `#0A0A0B` | Page background |
| `bg.elev` | `#101012` | Elevated surfaces (footer base, nav hover) |
| `bg.card` | `#121216` | Card backgrounds |
| `line` | `#1C1C22` | Default border / divider |
| `ink.DEFAULT` | `#F5F5F7` | Primary text |
| `ink.muted` | `#9A9AA3` | Secondary text / body |
| `ink.dim` | `#6B6B74` | Tertiary text / meta |
| `accent.DEFAULT` | `#C6FF3D` | **The single accent — electric lime** |
| `accent.soft` | `#E4FF8A` | Hover state for accent surfaces |
| `accent.deep` | `#9BD400` | Pressed/dark variant of accent |

**Rule:** Never introduce a second accent color. The lime is the entire visual identity.

Body background uses a layered gradient:
```css
background-image:
  radial-gradient(ellipse 80% 50% at 50% -10%, rgba(198, 255, 61, 0.06), transparent 60%),
  linear-gradient(180deg, #0A0A0B 0%, #07070A 100%);
background-attachment: fixed;
```

---

## Typography

**Primary font:** Inter (Google Fonts, self-hosted via `next/font`)
**Fallback:** `ui-sans-serif, system-ui, sans-serif`

### Display Scale (responsive, defined in `tailwind.config.ts`)

| Class | Clamp | Use |
|-------|-------|-----|
| `text-display-xl` | `clamp(3rem, 8vw, 6rem)` · LH 0.95 · -0.04em | Hero headline only |
| `text-display-lg` | `clamp(2.25rem, 5vw, 4rem)` · LH 1 · -0.03em | Section headlines |
| `text-display-md` | `clamp(1.75rem, 3.5vw, 2.75rem)` · LH 1.05 · -0.02em | FAQ + smaller section headers |

### Body
- Tailwind defaults (`text-sm`, `text-base`, `text-lg`)
- Body copy: `text-lg text-ink-muted` for long paragraphs, `text-sm text-ink-muted` for tighter blocks

### Special text utilities (in `globals.css`)
- `.gradient-text` — vertical white→gray gradient for premium feel on headlines
- `.text-balance` — `text-wrap: balance` for short headers
- `.text-pretty` — `text-wrap: pretty` for body
- `.accent-underline` — soft lime underline behind text
- `.eyebrow` — small uppercase tracked label, accent color

---

## Spacing & Layout

### Containers
| Class | Max width | Use |
|-------|-----------|-----|
| `.container-tight` | 1152px (6xl) | Body sections |
| `.container-wide` | 1280px (7xl) | Hero, navbar, footer |

Both center, with responsive horizontal padding (`px-5 sm:px-6 lg:px-8`).

### Section rhythm
- `.section` = `py-20 sm:py-28 lg:py-36`
- All major sections use this; do not freestyle vertical padding.

---

## Component Patterns (in `globals.css`)

### Buttons
| Class | Look |
|-------|------|
| `.btn-primary` | Filled lime pill, hovers to soft lime + lift + glow |
| `.btn-ghost` | Bordered transparent pill, hovers to subtle white wash |

### Decorative
| Class | Look |
|-------|------|
| `.chip` | Small rounded pill w/ subtle border — for tags/labels |
| `.eyebrow` | Small lime uppercase tracked label — section intros |
| `.glass` | Subtle white wash + blur — for floating UI |
| `.glass-strong` | Heavier glass — for prominent floating cards |
| `.hairline` | `border-white/[0.07]` — standard hairline border color |
| `.glow-accent` | Lime ring + lime shadow halo — for highlighted CTAs |
| `.glow-card` | `border: 1px solid rgba(255,255,255,0.04)` + dark drop shadow — elevated cards with a subtle outer edge, no inset highlight to avoid corner artifacts |

### Backgrounds
| Class | Look |
|-------|------|
| `.grid-bg` | Faint dot/line grid with radial mask — hero backdrop |
| `bg-grid-fade` (Tailwind utility) | Radial accent gradient |

### Masks
| Class | Effect |
|-------|--------|
| `.mask-fade-r` | Fade content to right edge |
| `.mask-fade-b` | Fade content to bottom edge |
| `.mask-fade-edges` | Fade content on both horizontal edges (for marquee) |

### Sidebar Navigation Pattern
- Desktop: Fixed left sidebar, 240px expanded / 68px collapsed
- Background: `#0C0C0E` with `border-white/[0.06]` right border
- Nav items: `h-10 px-3 rounded-lg`, active state `bg-accent/10 text-accent`
- Section labels: `text-[10px] font-bold uppercase tracking-wider text-white/25`
- Collapse toggle: `ChevronLeft`/`ChevronRight` icons, `h-8 w-8 rounded-lg`
- User section: Avatar (32px) + name + email + sign-out button
- Mobile: Hamburger opens full-height overlay drawer with backdrop blur

### Header with Search Pattern
- Sticky header: `h-14`, `bg-[#0A0A0F]/80 backdrop-blur-md`, `border-b border-white/[0.06]`
- Breadcrumbs: Auto-generated from pathname, `text-xs`, separator `ChevronRight`
- Search trigger: `h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06]`
- Search modal: Fixed overlay, `max-w-lg`, `rounded-2xl`, `bg-[#111113]`, backdrop blur
- Search input: `h-12`, no background, `placeholder-white/30`
- Results: `hover:bg-white/[0.04]`, icon in `h-7 w-7 rounded-lg bg-white/[0.04]`
- Notification bell: `h-8 w-8 rounded-lg`, accent-colored dot indicator
- Avatar dropdown: `w-56 rounded-xl`, `bg-[#111113]`, `shadow-2xl shadow-black/40`

### Bottom Navigation Pattern
- Fixed bottom bar: `h-[60px]`, `border-t border-white/[0.06]`, backdrop blur
- Safe area: `paddingBottom: env(safe-area-inset-bottom, 0px)`
- Tab items: `w-14 h-[52px] rounded-xl`, centered icon + label
- Active state: `text-accent`, icon `strokeWidth={2.2}`, glowing dot indicator `bg-accent shadow-[0_0_6px_2px_rgba(198,255,61,0.5)]`
- Inactive: `text-white/30`, icon `strokeWidth={1.8}`
- Haptic: 8ms vibration on tap via `navigator.vibrate()`

### Error Page Pattern
- Container: Centered, `mb-8`
- Icon box: `h-28 w-28 rounded-3xl bg-white/[0.03] border border-white/[0.06]`
- Error code: `text-5xl font-black text-accent/20 tracking-tighter`
- Glow halo: `bg-accent/5 blur-2xl` absolute positioned behind box
- Shadow: `shadow-[0_0_60px_-12px_rgba(198,255,61,0.15)]`

### Settings Accordion Pattern
- Sections: `rounded-xl border border-white/[0.06] bg-[#121216]`
- Open state: `border-white/[0.08]`
- Danger zone: `border-red-500/15 bg-red-500/[0.03]`
- Trigger button: `px-5 py-4`, flex with icon (8x8 rounded-lg) + title + description
- Chevron: `ChevronDown`/`ChevronUp` from `lucide-react`
- Content: `border-t border-white/[0.04] px-5 py-5`
- Toggle component: `h-5 w-9 rounded-full`, accent when enabled
- Toast: Fixed bottom-right, `rounded-xl`, accent or red border/bg

### Loading Skeleton Pattern
- ProfileCardSkeleton: Matches ProfileCard dimensions, shimmer on dark bg
- Base primitives: `Skeleton`, `SkeletonCard`, `SkeletonCircle`, `SkeletonText`
- Animation: Shimmer sweep via CSS gradient animation
- Usage: Wrap in React `Suspense` boundaries

### Animation Patterns

#### TypingText (Typewriter)
- Cycles through word array with blinking cursor
- Speed: 80ms/char typed, 50ms/char deleted, 2200ms pause
- `prefers-reduced-motion`: Shows first word statically
- Framer Motion `AnimatePresence` for word transitions

#### FloatingElements (Decorative)
- Icons: `$`, `NIL`, `%`, `0x` scattered around hero
- Hidden on mobile (`hidden md:block`)
- Framer Motion: Slow random drift with `repeat: Infinity`, `repeatType: "reverse"`
- `prefers-reduced-motion`: No animation

#### AnimatedGradientBg (Hero Background)
- Two radial gradient blobs with different drift paths
- Colors: `rgba(198, 255, 61, 0.12)` and `rgba(198, 255, 61, 0.08)`
- Animation: 18s and 22s cycles via `orb-1` and `orb-2` keyframes
- `prefers-reduced-motion`: Static position

#### SocialProofAvatars (Hero Social Proof)
- Row of 5 overlapping avatar circles (40px, 4px overlap)
- Stagger-in animation: 0.08s delay between each
- Hover tooltip: Athlete name, `bg-[#111113]`, `rounded-lg`, `shadow-xl`
- `prefers-reduced-motion`: Instant appearance

---

## Animation Tokens

### Custom keyframes (defined in `tailwind.config.ts`)

| Name | Behavior | Use |
|------|----------|-----|
| `fade-up` | Opacity 0→1 + Y 12→0 | Generic entrance |
| `marquee` | TranslateX 0 → -50% | Trust strip sport names |
| `pulse-soft` | Opacity 0.6 ↔ 1 over 2.4s | Live dots, accent highlights |
| `shine` | Background-position sweep | Reserved for sheen sweeps |
| `orb-1` | Slow drift + slight scale, 18s | Hero ambient orb |
| `orb-2` | Different drift path, 22s | Secondary ambient orb |
| `float-y` | Y -8 ↔ 0 over 5s | Floating receipts on athlete card |
| `gradient-shift` | Background-position pan, 8s | Reserved for animated gradients |
| `draw` | stroke-dashoffset 500→0, 2.5s | Monetization chart line draw |

Available as Tailwind utilities: `animate-fade-up`, `animate-marquee`, `animate-pulse-soft`, `animate-shine`, `animate-orb-1`, `animate-orb-2`, `animate-float-y`, `animate-gradient-shift`.

The `draw` keyframe is defined in `globals.css` and used via Tailwind arbitrary value: `animate-[draw_2.5s_ease-out_forwards]`.

### Easing curves used in Framer Motion

| Use | Curve |
|-----|-------|
| Entrance reveals | `[0.16, 1, 0.3, 1]` (exponential out) |
| FAQ expand/collapse | `[0.16, 1, 0.3, 1]` |
| Magnetic / Tilt springs | `{ stiffness: 180–220, damping: 18–22, mass: 0.4–0.6 }` |
| Counter springs | `{ stiffness: 60, damping: 22, mass: 0.6 }` |
| Footer wordmark parallax | `{ stiffness: 60, damping: 20 }` |

### Lenis config
```ts
new Lenis({
  duration: 1.15,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
})
```

---

## Iconography

- **Library:** `lucide-react` only
- **Default stroke:** `1.8` (slightly lighter than default `2` for a more refined feel)
- **Default size:** `h-4 w-4` for inline icons, `h-3 w-3` for chip/badge icons
- **Color:** Inherits from text. Icons inside cards usually `text-ink-muted` and shift to `text-accent` on hover

---

## Borders & Radii

| Element | Radius |
|---------|--------|
| Buttons / chips / inputs | `rounded-full` |
| Cards | `rounded-2xl` (16px) |
| Big cards / panels | `rounded-3xl` (24px) |
| Phone frame mockup | `rounded-[34px]` (custom) |
| Final CTA panel | `rounded-[2rem]` (32px) |
| Icon tiles | `rounded-lg` (8px) or `rounded-xl` (12px) |

| Border | Hex / Rule |
|--------|------------|
| Standard hairline | `border-white/[0.06]` |
| Hover lift | `border-white/[0.12]` or `border-accent/30` |
| Card on accent surfaces | `border-accent/40` |

---

## Shadows / Glow

Used sparingly — premium = restraint.

```css
/* Card lift */
box-shadow:
  0 1px 0 0 rgba(255, 255, 255, 0.04) inset,
  0 30px 80px -20px rgba(0, 0, 0, 0.7),
  0 0 0 1px rgba(255, 255, 255, 0.05);

/* Accent ring (Pro pricing card, hot CTAs) */
box-shadow:
  0 0 0 1px rgba(198, 255, 61, 0.25),
  0 0 40px -8px rgba(198, 255, 61, 0.45),
  0 0 80px -20px rgba(198, 255, 61, 0.35);
```

---

## Selection & Scrollbar

```css
::selection { @apply bg-accent text-bg; }

/* Custom scrollbar (Webkit) */
::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-thumb { background: #1C1C22; border-radius: 8px; }
::-webkit-scrollbar-thumb:hover { background: #2A2A33; }
```

---

## Accessibility

- **Skip-to-content link** — first focusable element in `<body>`, visually hidden until focused, jumps to `#main`.
- **Global focus ring** — `:focus-visible { outline: 2px solid #C6FF3D; outline-offset: 2px; }` on every interactive element. `:focus:not(:focus-visible) { outline: none }` suppresses the default blue ring on mouse click but keeps it on keyboard nav.
- **`prefers-reduced-motion`** — handled in two places: (1) `app/globals.css` has a `@media` block that nukes all animation/transition/scroll-behavior to ~0ms. (2) `components/smooth-scroll.tsx` checks the media query on mount and skips Lenis initialization.
- **Form inputs** — both email inputs (waitlist + newsletter) have visually-hidden `<label htmlFor>` and matching `id` attributes.
- **Icon-only buttons** — aria-labels: "Share profile" (athlete card), "Subscribe" (newsletter submit), "Open menu" / "Close menu" (navbar), and `aria-label={label}` on every social icon.
- **Mobile menu toggle** — has `aria-expanded={open}` and `aria-controls="mobile-menu"`; the menu panel has matching `id`.
- **FAQ accordion** — each button has `aria-expanded`, `aria-controls`, and `id="faq-button-{i}"`; the answer region has `id="faq-panel-{i}"`, `role="region"`, and `aria-labelledby` pointing back to the trigger. The Plus/Minus icon is `aria-hidden`.
- **Color contrast** — accent (#C6FF3D) on bg (#0A0A0B) ≈ 16:1 (AAA). ink (#F5F5F7) on bg ≈ 18:1 (AAA). ink-muted (#9A9AA3) on bg ≈ 7.2:1 (AAA). ink-dim (#6B6B74) on bg ≈ 6.8:1 (AA). All pass WCAG AA, most pass AAA.
- **Heading hierarchy** — single `<h1>` in hero, `<h2>` per section, `<h3>` for nested cards. No skipped levels.
- **Landmarks** — `<header>` (navbar), `<main id="main">` (page), `<footer>`, `<nav>` inside header.
- **`html lang="en"`** — set in `app/layout.tsx`.

---

## Social Share Assets

- **`og-image.png`** (1200x630) — used by Facebook, LinkedIn, Slack, Discord, iMessage. Lime brand mark + "AthleteOS" wordmark top-left. Headline "One card. / One link. / Your entire / NIL business." with alternating white/lime lines. Mini athlete card mockup on the right (Maya Reyes · Stanford · stats · Gymshark $2,400 deal · Tip Maya CTA). URL `athleteos.app` bottom-left. "Join the waitlist →" pill bottom-right. Background: dark with two soft lime radial-gradient orbs and a faint grid mask.
- **`twitter-image.png`** (1200x675) — used by Twitter/X. Centered composition: lime brand mark + "AthleteOS" name, two-line headline ("One card. One link." / "Your entire NIL business." in lime), "Join the waitlist →" button.
- **`apple-icon.png`** (180x180, rounded corners) — iOS home screen. Lime square with the brand chart mark centered.
- **`icon.svg`** — Favicon for browser tabs. Lime rounded square with the chart mark.
- **Regeneration:** run `npm run gen:og` after any brand/design change. The script is `scripts/gen-og.js` and uses `sharp` to rasterize SVG templates to PNG.

### Why static PNGs and not `next/og`?
Next 14's `ImageResponse` from `next/og` is broken on Windows because `import.meta.url` doesn't resolve to a proper `file://` URL in the bundled CJS module, causing `fileURLToPath` to throw "Invalid URL" during prerender. Static PNGs work everywhere, don't add serverless render time, and are more predictable for design QA. See `scripts/gen-og.js` header for the full note.

---



Last updated: 2026-07-08 (Session 95)
