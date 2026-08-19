# Blueprint — NIL CARD Digital Card

The public, shareable athlete identity card. One card, one link, the athlete's whole NIL business.

This is the design + engineering blueprint for the card rendered on the public route (`/[username]`). It covers architecture, data flow, the visual layer stack, the flip system, motion, theming, mobile/desktop divergence, interactions, and performance rules.

---

## 1. What it is

A **trading-card-style digital business card** for a student-athlete. The front face is an identity/showcase face (photo, name, stats, verification, share). The back face is a business face (bio, links, highlights, socials, and monetization: Contact / Send Inquiry / Tip). The card flips in 3D between the two faces.

Facts that anchor every design decision:

- Dimensions: `360 × 480` design units (`lib/constants.ts`), rendered at `aspect-ratio: 360 / 600` with a `min()`/`maxHeight` clamp so it scales to any screen.
- Dark-only. Single accent `#C6FF3D` (electric lime) as the brand accent; the card itself is theme-driven (per-athlete accent color).
- Server-rendered shell, client-hydrated interactions. No page scroll on the card page (locked while mounted).
- The card must feel premium on both desktop (GPU-heavy effects allowed) and mobile (every expensive effect gated off or cheapened). Mobile/desktop divergence is a first-class, deliberate system (see §9).

---

## 2. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router (TypeScript) | Server Components by default; route is `force-dynamic` |
| Route | `app/[username]/page.tsx` | Public per-athlete page |
| Rendering | Server Component page → `<ProfileCard>` (client) | Fast LCP, SEO metadata, JSON-LD |
| Styling | Tailwind + hand-written CSS files (`app/globals.css`, component `.css`) | Precision control over layers/masks the card needs |
| Motion | `framer-motion` | 3D flip + popups |
| Icons | `lucide-react` | Consistent line icons |
| Animations | rAF loop + CSS `@keyframes` | Border glow sweep (JS), breathing/pulse (CSS) |
| Data | Supabase (Postgres) via server actions / service client | Profile + stats fetch |
| Analytics | PostHog (`trackView`, `trackFunnel`) + Google gtag.js | Funnel + pageview tracking |

---

## 3. Component architecture

```
app/[username]/page.tsx            (Server Component)
  ├─ generateMetadata()            SEO title/OG/Twitter, JSON-LD
  ├─ getPublicProfile(username)    profile row (notFound if missing)
  ├─ service client fetch          page_views, social_accounts, nil_value_metrics
  └─ <ProfileCard profile=… totalViews=… totalFollowers=… nilScore=…>

components/profile-card.tsx        (client, the card root)
  ProfileCard
  ├─ BusinessModalProvider         context: anyOpen, openContact/Inquiry/Tip
  ├─ Locked-scroll effect          body/html overflow:hidden while mounted
  ├─ 3D perspective container      perspective: 1100px, aspect 360/600
  ├─ motion.div                    rotateY: 0/180, 0.35s, preserve-3d  ← THE FLIP
  │   ├─ [FRONT FACE]  .flip-card-face (backface-hidden)
  │   │   └─ FaceGlow (BorderGlow wrapper, gated active)
  │   │       └─ ReflectiveCard
  │   │           ├─ AthletePhoto            hero image + vignette + carousel
  │   │           ├─ AthleteIdentity         name, sport, position, school, verify
  │   │           ├─ AthleteStats            NIL + custom stat strip
  │   │           ├─ AthleteIDBlock          username / ID copy row
  │   │           └─ FlipCTA                 "tap to flip" hint
  │   └─ [BACK FACE]  .flip-card-back (rotateY 180)
  │       └─ FaceGlow (BorderGlow wrapper, gated active)
  │           └─ ReflectiveCard
  │               ├─ BackHeader              avatar, name, flip-back CTA
  │               ├─ AboutSection            bio
  │               ├─ LinksSection            structured links (favicons)
  │               ├─ HighlightsSection       highlight reels
  │               ├─ ConnectSection          socials + share
  │               └─ BusinessBlock           Contact / Send Inquiry / Tip buttons
  ├─ ContactModal / InquiryForm / QrShareModal   (portaled overlays)
  └─ Tip success flow                confetti + verification polling

components/border-glow.tsx + .css   animated perimeter glow (sweep + edge light)
components/reflective-card.tsx + .css  webcam-metallic surface material
components/profile-card-skeleton.tsx   loading fallback
```

The header comment in `profile-card.tsx` documents this tree; keep it in sync when the card changes.

---

## 4. Data flow

1. Visitor hits `/{username}`.
2. `page.tsx` (server) fetches the profile via `getPublicProfile`; 404s unknown usernames.
3. In parallel it reads view/follower/NIL metrics with a Supabase service client (non-critical, try/catch — the card still renders if this fails).
4. Renders `<ProfileCard>` inside `<Suspense fallback={<ProfileCardSkeleton/>}>`.
5. On the client, `ProfileCard` fires `trackView(profile.id)` once (ref-guarded).
6. User interactions → `trackLinkClick` / `trackFunnel(...)` analytics; tips verify via `verifyRecentTip` polling.

### Key profile fields the card consumes

`id`, `full_name`, `username`, `avatar_url`, `sport`, `position`, `school`, `bio`, `class_year`, `theme_accent`, `social` (instagram/twitter/tiktok/youtube), `contact_email`, `contact_phone`, `is_verified`, `plan`, `extended_pro_until`, plus custom `stats` and `highlights` for the back face.

---

## 5. Theming & design tokens

Theme source: `lib/themes.ts`. `resolveTheme(theme_accent)` returns a `ThemePreset`.

| Preset type | Examples | Surface |
|---|---|---|
| `solid` (free) | Electric Lime, Coral Red, Teal Cyan, Lavender, Sky Blue, Amber | flat accent color |
| `metallic` (Pro) | 24K Gold, Titanium, Rose Gold | `backgroundGradient` + `borderGlow` |
| `neon` (Pro) | Cyber Neon | gradient + glow |
| `holographic` (Pro) | Iridescent | multi-stop gradient |

Tokens flow into components as CSS custom properties:

- `BorderGlow`: `--card-bg`, `--edge-sensitivity`, `--border-radius`, `--glow-padding`, `--cone-spread`, `--fill-opacity`, `--glow-color*` (7 opacity stops), `--gradient-one..seven` (mesh), `--gradient-base`.
- `ReflectiveCard`: `--rc-blur`, `--rc-metalness`, `--rc-roughness`, `--rc-overlay`, `--rc-saturation`, `--rc-radius`, plus `--rc-accent-glow` / `--rc-accent-glow-hover` (inline) for the shadow.
- Card content: accent passed as a hex string, used directly for borders, glows, and stat colors.

Rules: one accent per card, dark surfaces only, `#C6FF3D` stays the brand accent elsewhere.

---

## 6. Visual layer stack (bottom → top)

Inside a face, the paint order is:

```
┌─ BorderGlow (.border-glow-card)
│   └─ .border-glow-layer (glow visuals; ::before mesh border, ::after fill, .edge-light)
│       └─ .border-glow-inner
│           └─ ReflectiveCard (.rc-container)
│               ├─ .rc-video            webcam feed (desktop, active)   z0
│               │    └─ SVG feDisplacementMap + feSpecularLighting filter
│               ├─ .rc-video-fallback   static #0d0d12 surface (mobile/denied) z0
│               ├─ .rc-noise            fractalNoise grain               z1
│               ├─ .rc-sheen            diagonal specular highlights     z2
│               ├─ .rc-theme-gradient   theme gradient, mix-blend overlay z2
│               ├─ .rc-overlay          surface tint                     z3
│               ├─ .rc-border           hairline 1px white ring          z20
│               └─ .rc-content          card UI                         z10
```

Notes:

- `.rc-content` sits above the material but below the hairline border ring, so the ring frames the content edge.
- `z-index` was chosen deliberately; if you add a layer, respect the ordering or the glass feel breaks.
- The **border glow** is an *outside* frame (`.border-glow-layer` spans the card with `inset:0` and an outer `.edge-light` at `inset: -glow-padding`).

---

## 7. The BorderGlow (animated perimeter)

File: `components/border-glow.tsx` / `border-glow.css`.

Props: `edgeSensitivity`, `glowColor` (HSL string), `backgroundColor`, `borderRadius`, `glowRadius`, `glowIntensity`, `coneSpread`, `animated`, `loop`, `active`, `colors[]`, `fillOpacity`, `style`.

Behavior:

- **Loop mode** (used by the card): an rAF loop walks a point around the card perimeter and writes `--cursor-x` / `--cursor-y` / `--edge-proximity` on the `.border-glow-layer`. The layer's pseudo-elements consume them:
  - `::before` — colored mesh **border** visible near the cursor (`mask-image` radial spotlight, opacity scales with edge proximity).
  - `::after` — mesh **fill** near the edge, `mix-blend-mode: soft-light`.
  - `.edge-light` — outer halo ring (inset box-shadows), `mix-blend-mode: plus-lighter`.
- **Speed**: `speed = 0.0003` → ~3.3 s per perimeter lap (desktop). One constant, `components/border-glow.tsx` (~line 166).
- **Per-frame writes are scoped to `.border-glow-layer`** — a tiny element — so the writes never invalidate the whole card subtree. Do not move them back onto `.border-glow-card`.
- **Mobile: fully disabled** (`@media (pointer: coarse) { .border-glow-layer { display:none } }` + the sweep bails on coarse pointers). Both spots are commented so it's easy to re-enable.
- **Flip coordination**: `FaceGlow` (in `profile-card.tsx`) passes `active = baseActive && !anyOpen`. When a popup is open, or during a flip (+ 800 ms after), the glow is off. `GLOW_RESTART_DELAY_MS = 800` controls the restart delay.

---

## 8. The ReflectiveCard material

File: `components/reflective-card.tsx` / `reflective-card.css`.

A webcam-feed metallic shell (adapted from React Bits):

- The user-facing camera frames the card and is run through an SVG filter (`feTurbulence` → luminance→alpha → `feDisplacementMap` → `feSpecularLighting` → blend) plus CSS desaturation/blur, producing a **real-time liquid-metal reflection**.
- **Fallbacks**: no webcam / denied / coarse pointer → static `#0d0d12` surface with noise + sheen + theme gradient. Mobile never requests the webcam (`isCoarsePointer()`).
- Front and back faces **share one stream** via a `streamRef` prop so only one `getUserMedia` call happens; the owner stops tracks on unmount, the shared consumer doesn't.
- `active` prop: when false (during flip / popup), renders the static surface and skips the SVG filter entirely — this is the mobile-GPU saver.
- Hover shadow transition is gated behind `@media (hover:hover) and (pointer:fine)` so Android taps don't blur-repaint.

---

## 9. Mobile vs desktop — the divergence map

This is the single most important maintenance rule: **every expensive effect has a coarse-pointer path.**

| Feature | Desktop | Mobile (`pointer: coarse`) |
|---|---|---|
| Border glow sweep | on, ~3.3 s/lap | **off entirely** (display:none + no rAF) |
| ReflectiveCard webcam | live video + SVG filter | static dark surface |
| Auto flip-back (12 s) | on | **off** (card stays on chosen face) |
| Glow during flip | paused + 800 ms restart | n/a (glow off) |
| `.rc-container` hover transition | animated | none |
| `backdrop-filter` inside faces | used | stripped via `@media` override |
| Page scroll | locked | locked |

Rule of thumb: touch = no live video, no sweep, no hover-triggered blur, no surprise motion. Anything you add should declare which side it's on.

---

## 10. The flip system

- Flip container: `motion.div` with `animate={{ rotateY: flipped ? 180 : 0 }}`, `transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}`, `transformStyle: "preserve-3d"`, `will-change: transform`.
- Faces: `.flip-card-face` (absolute, `backface-visibility: hidden`); the back is pre-rotated `rotateY(180deg)`.
- Pointer events / z-index swap with `flipped` so only the visible face is interactive.
- State machine: `flipped`, `isFlipping`, `glowPaused`. `handleFlip()` toggles; `onAnimationComplete` clears `isFlipping` and schedules the glow restart.
- Tap anywhere on the card flips it. Back face's `onTouchStart` resets the (desktop-only) auto-return timer.
- Mobile: no auto-return (see §9). Desktop: flips back after `AUTO_RETURN_MS = 12_000`.

---

## 11. Interactions & monetization

- **QR / share**: `QrShareModal`, native `navigator.share` fallback to clipboard copy.
- **Contact**: `ContactModal` (email/phone), opened via `BusinessModalCtx.openContact`.
- **Send Inquiry**: `InquiryForm` — request business/fan inquiry, `openInquiry`.
- **Tip**: `TipButton` — Stripe-backed, success shows confetti + polling (`verifyRecentTip`), `?tip=success` deep link support.
- All popups render through `BusinessModalProvider`; `anyOpen` pauses the border glow so the animation never fights a modal.
- Analytics hooks: `trackView`, `trackLinkClick`, `trackFunnel` (PostHog) + gtag pageview.

---

## 12. Performance rules (why the card feels 60 fps on a $100 Android)

1. **No per-frame layout reads.** `getBoundingClientRect()` / `offsetWidth` are cached via ResizeObserver/scroll/resize listeners, never inside pointermove or rAF.
2. **Per-frame writes go to the smallest element.** Glow CSS vars land on `.border-glow-layer`, not the card.
3. **rAF loop is the only loop**, single instance, throttled to ~31 fps on coarse pointers, paused while `document.hidden`.
4. **Hover-only CSS is media-gated** (`(hover:hover) and (pointer:fine)`).
5. **Blend modes, masks, blur, displacement filters** are the expensive toys — the coarse-pointer path drops or cheapens them.
6. `contain: layout style`, `translateZ(0)`, `will-change: transform` on the pieces that move.
7. Memoized CSS var maps (`useMemo`) — recompute only when props change.
8. **Reduced motion**: `@media (prefers-reduced-motion: reduce)` strips shimmers/sweeps/breathing where present.

---

## 13. Editing guide (short version)

- Want to change the glow look → `components/border-glow.css` (mesh gradients, masks, opacities). Speed → one constant in `border-glow.tsx`.
- Want to change the material → `reflective-card.css` (noise, sheen, overlay, border) + prop knobs in `reflective-card.tsx`.
- Want to change face content → the memoized section components inside `profile-card.tsx` (AthletePhoto, AthleteIdentity, AthleteStats, BackHeader, About/Links/Highlights/Connect).
- Want a new theme → add a `ThemePreset` in `lib/themes.ts`.
- Want to re-enable mobile glow → delete the two marked blocks (CSS `@media (pointer: coarse)` + the TSX gate).
- **Any change**: update this file, `docs/CHANGELOG.md`, and if it touches copy → `docs/COPY.md`.

---

## 14. Relevant files

| File | Role |
|---|---|
| `app/[username]/page.tsx` | route, metadata, data fetch |
| `components/profile-card.tsx` | the card: faces, flip, interactions, glow/flip gating |
| `components/border-glow.tsx` / `.css` | animated perimeter glow |
| `components/reflective-card.tsx` / `.css` | metallic surface material |
| `components/profile-card-skeleton.tsx` | loading state |
| `lib/constants.ts` | `CARD_W`, `CARD_H`, platform fees |
| `lib/themes.ts` | theme presets + resolver |
| `lib/sport-config.ts` | sport fallback gradients, position validation |
| `app/globals.css` | `.flip-card-face`, noise, pulse keyframes |
| `components/tip-button.tsx`, `components/inquiry-form.tsx` | monetization surfaces |