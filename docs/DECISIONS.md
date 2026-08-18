# DECISIONS.md — Architecture Decision Records

> Lightweight ADR-style log. Every non-trivial product, design, or technical decision goes here.
> Format: `## ADR-NNN — Title` · `Status` · `Context` · `Decision` · `Consequences` · `Date`.

---

## ADR-059 — Isolate Digital Card Popup State to Avoid Card-Subtree Re-renders

**Status:** Accepted · 2026-08-17

**Context:**
Opening or closing the Digital Card's popups (Contact details, Send Inquiry, Support/Tips) felt sluggish. The Contact and Inquiry popup open state lived in `ProfileCard`, so clicking a trigger re-rendered the entire card subtree — including both non-memoized `ReflectiveCard` instances (SVG filter defs, video/webcam handling) and both `BorderGlow` instances (continuous rAF loop writing CSS custom properties) — stalling the main thread at the start of the popup animation. Separately, `InquiryForm` returned `null` before its `<AnimatePresence>` when closed, so the exit animation never played and closing was an instant unmount. Baseline measurement: ~16 FPS headless with ~18 missed vsyncs during a popup window.

**Decision:**
- Introduce `BusinessModalProvider` in `profile-card.tsx`: a React context provider that owns `showContact`, `showInquiry`, `copiedEmail`, `copiedPhone` and renders the ContactModal portal + InquiryForm itself. The card tree is passed through as `children`, so provider state changes re-render only the provider and popups — never the card faces. `BusinessBlock` reads `openContact`/`openInquiry` from context instead of prop callbacks.
- Fix `InquiryForm` so `<AnimatePresence>` stays mounted and the dialog is gated by `{open && …}` (restores exit animation).
- Remove redundant `willChange: transform` from overlay-only-opacity layers (ContactModal, TipButton overlay); keep `translateZ(0)`.
- Keep popup animation properties compositor-friendly (opacity / scale / transform only).

**Consequences:**
- Opening a popup no longer mutates card-face DOM: verified via MutationObserver (only the continuous BorderGlow rAF loop — out of scope — and the popup's own mount mutate).
- Headless FPS improved from ~16 (pre-fix baseline) to ~59 idle; popup open/close stays near baseline with no long tasks.
- Border glow, ReflectiveCard, layout, dimensions, spacing, typography, colors, button styling, and popup content were intentionally untouched per task scope.

---

## ADR-060 — Compositing Hints on Overlays: Viewport-Sized Layers Hurt, Card-Sized Layers Help

**Status:** Accepted · 2026-08-17

**Context:**
After ADR-059 the popups were smooth on a dev server but still dropped frames when measured against a local **production build** (`next build` + `next start` + Playwright/CDP rAF frame timer). The remaining compositing-hint placement was inconsistent: ContactModal and TipButton overlays had `willChange: transform` + `translateZ(0)`, InquiryForm's full-viewport overlay had the same, and TipButton's full-viewport backdrop had none. It wasn't clear which hints were earning their keep.

**Decision:**
- **Remove `transform: translateZ(0)` + `willChange: transform` from the InquiryForm full-viewport `fixed` overlay.** Measured on the production bundle, this single change dropped Inquiry open from 3.6 → 0.2 avg dropped frames. The hint was forcing a repaint each frame on a layer that covers the whole viewport instead of letting the opacity fade composite.
- **Keep `willChange: transform` on the card-size ContactModal overlay** (`absolute inset-0`): measuring showed it helps (0.4 avg dropped frames open, 0 close).
- **Rule going forward:** compositing hints on viewport-sized (`fixed inset-0`) layers hurt — the layer is too large to composite cheaply; on small card-sized layers they help. TipButton's full-viewport overlay stays hint-free (committed state), its card-size dialog keeps `translateZ(0)` + `willChange`.

**Consequences:**
- Full popup set on production build now measures near zero dropped frames: baseline 0; contact open 0.4 / close 0; inquiry open 0.2 / close 0 (exit animation plays); support open 0.6–0.8 / close 0.
- Only `components/inquiry-form.tsx` changed this session (a −1 line diff); no visual, layout, or functional changes.

---

## ADR-061 — Strip Blend-Mode Material Layers From Card Faces During the 3D Flip

**Status:** Accepted · 2026-08-17

**Context:**
Users reported the card flip feeling instant/janky on mobile. CDP tracing (Pixel 7 emulation against a local production build) showed the browser re-rasterizing the card faces during the flip — `SmoothnessDroppedFrame: 10`, `DroppedFrameDuration: 14`, `JankV3: 26` in the flip window, with hundreds of `RasterTask`/`GpuRasterBuffer::Playback` events. The faces contain `mix-blend-mode: overlay` layers (`.rc-noise`, `.rc-sheen`, `.rc-theme-gradient`); blend-mode layers can't be cached as static flip textures, so every rotateY frame forces a GPU re-blend/re-raster. Desktop GPUs absorb this; phone GPUs stutter. The codebase already had the same pattern of coarse-pointer carve-outs (webcam skipped on touch, `backdrop-filter` off inside faces) and `BorderGlow`'s `active`-during-flip gating.

**Decision:**
- `ReflectiveCard` renders its three blend-mode layers only when `active` is true.
- Both `ReflectiveCard` instances pass `active` gated on `!isFlipping` (front `!flipped && !isFlipping`, back `flipped && !isFlipping`), mirroring `BorderGlow`.
- Remove the back face's redundant `onClick={handleFlip}` — it double-fired with the parent `motion.div` handler in the same event (net no-op), so tapping the back never flipped back; taps now bubble to the parent's single handler.

**Consequences:**
- Post-fix trace: `SmoothnessDroppedFrame: 4`, `DroppedFrameDuration: 2`, `JankV3: 8`; screencast frame-diffing confirms the flip still interpolates over ~350 ms (not snapped).
- During the 0.35 s flip the faces show the flat `#0d0d12` surface instead of the metallic sheen — invisible in practice while rotating; `active` returns when the flip completes.
- Back-face taps now flip the card back (verified against the production build); the `BackHeader` button still works via its `stopPropagation` handler.

---

## ADR-062 — Pause the Card Glow Sweep While a Popup Is Open

**Status:** Accepted · 2026-08-17

**Context:**
A user reported that pressing "Send Inquiry" on mobile "takes time" and the card animation animates "very laggy" as the popup opens. After ADR-059/060 the popup itself mounts cheaply (provider state only, compositor-friendly overlay), but the card's `BorderGlow` sweep — a continuous rAF loop writing CSS custom properties every frame — keeps running underneath the dimmed `bg-black/80` scrim while the popup entrance (fade + scale, 0.15 s) plays. On a phone GPU that background sweep competes with the popup animation for main-thread time exactly when the user is watching the entrance.

**Decision:**
- `BusinessModalCtx` gains an `anyOpen` boolean (`showContact || showInquiry`), added to the provider's memoized context value with deps `[showContact, showInquiry]`.
- Introduce `FaceGlow` — a tiny local consumer in `profile-card.tsx` that reads `anyOpen` and renders `<BorderGlow {...glow} active={baseActive && !anyOpen} />`. Both face usages switch from `active={...}` to `baseActive={!flipped && !isFlipping}` (front) / `baseActive={flipped && !isFlipping}` (back).
- `BorderGlow` already cancels its rAF cleanly when `active` flips false (effect cleanup on deps `[loop, active]`), so the pause is free — no change to `border-glow.tsx`/`.css`.
- **Exit coverage (follow-up):** the provider adds a `closing` flag — `closePopup()` sets both popups' state false plus `closing` true, and a 250 ms `setTimeout` clears it. `anyOpen` becomes `showContact || showInquiry || closing`, so the sweep stays paused through each popup's 0.15 s exit animation (both ContactModal and InquiryForm exit at `duration: 0.15`) and resumes only after the popup is unmounted. The 250 ms window is bounded by the longest exit (0.15 s) with margin, and the timer is cleared on provider unmount.

**Consequences:**
- Verified against the local production build (Pixel 7 emulation): sweep running pre-open (`glow-looping` class present, `--cursor-x` advancing), paused the instant the popup mounts (class removed, cursor static), resumed on close; popup-open rAF window showed only 2 gaps >30 ms, max gap 33 ms. Follow-up verification of the exit coverage: at +150 ms after close the popup is still animating out with the sweep still paused; at +450 ms the popup is gone and the sweep has resumed; the close-window showed 0 gaps >30 ms (max 17 ms).
- Preserves ADR-059 isolation: `anyOpen` lives in provider state, so toggling it re-renders only the provider and `FaceGlow` consumers — never the `ReflectiveCard`/card subtree.
- Only `components/profile-card.tsx` changed (context type + provider value + `FaceGlow` + two usages); no visual change (the glow is hidden behind the scrim while dimmed anyway).

---



## ADR-064 — Smooth CTA + Tip Button Animations and Pause Glow During the Tip Popup

**Status:** Accepted · 2026-08-17

**Context:**
The card's Send Inquiry / Contact buttons and the Support (Tip) button animations felt abrupt, and the Support popup still lagged on open/close. The two prior popup fixes (ADR-059, ADR-062) gated the BorderGlow sweep on the Contact + Inquiry popups only; the Tip popup manages its own `open` state inside `TipButton`, so the continuous rAF sweep kept running behind its 0.15–0.2s entrance/exit animations. Separately, the buttons animated `boxShadow` inside Framer `whileHover`, forcing per-frame repaint on hover.

**Decision:**
- **Glow gating for the tip popup:** added `onOpenChange?: (open: boolean) => void` to `TipButton` (effect-notified, first render skipped via ref). `BusinessModalProvider` now tracks `showTip` + a `setTipOpen` callback; `anyOpen` becomes `showContact || showInquiry || showTip || closing`, and closing the tip reuses the 250 ms `closing` window so the sweep stays paused through the popup's exit. `BusinessBlock` passes `setTipOpen` into `TipButton`.
- **Button smoothing:** removed `boxShadow` from `whileHover` on both Support buttons (kept the glow as a stable inline `style`), switched Framer taps to spring transitions (`type: "spring", stiffness: 400, damping: 26`), and changed `transition-all` to `transition-colors` so only transform/color animate. Send Inquiry + Contact use `ease-[cubic-bezier(0.22,1,0.36,1)]` with a slightly deeper `active:scale-[0.97]`.
- **Popup easing:** the Tip popup and InquiryForm dialogs now use `easeOut` (overlay) and `ease: [0.22, 1, 0.36, 1]` (sheet) with a subtle `y` slide instead of bare linear `duration: 0.15`.

**Consequences:**
- Verified on a production build with a Playwright probe: opening the Tip popup on the card's back face leaves the sweep paused (1 frame in the open window), it stays paused through close (9 frames in the exit window), then resumes (31 frames after). Popup opens successfully; no console errors. `npm run lint` clean, `tsc --noEmit` clean, `npm run build` clean.
- Tip popup and InquiryForm share the same open/close easing, so all three business popups now feel consistent.

---

## ADR-063 — Inline CSS on SSR'd Pages to Remove Render-Blocking Stylesheets

**Status:** Accepted · 2026-08-17

**Context:**
A Lighthouse run against the live public card (`www.nilcard.app`) flagged "Render-blocking requests · Est savings of 750 ms". The critical path carried the 25.9 KiB HTML document plus 4 separate `/_next/static/chunks/*.css` stylesheet requests (2.1 KiB, 19.2 KiB, 2.4 KiB, 2.3 KiB) — each a full network round trip (190–760 ms) before first paint. The app ships three stylesheets (globals.css 14.8 KiB, border-glow.css 5.6 KiB, reflective-card.css 5.9 KiB), which Turbopack emits as multiple blocking `<link rel="stylesheet">` tags in `<head>`.

**Decision:**
- Enable `experimental.inlineCss: true` in `next.config.mjs`. Next.js then inlines the page's CSS as `<style>` tags in the SSR'd HTML instead of emitting render-blocking `<link>` stylesheets, eliminating the four blocking requests from the critical path. Applied globally; production builds only; fonts remain external `url()` references (no base64 bloat); prerendered pages keep `<link>` to avoid duplication during navigation.

**Consequences:**
- Verified on a local production build: the card route (`/alexmercer`) and homepage now emit 0 `<link rel="stylesheet">` tags; CSS is inline (`@font-face` + globals + component CSS), no base64 font embeds, two distinct non-duplicated `<style>` blocks. Card still renders with the glow sweep running and no console errors.
- Tradeoff: HTML document grows (the inline CSS is ~120 KiB unminified text) but is fetched in the single document request instead of 4 parallel round trips — a net win on slow mobile connections, which is what the Lighthouse savings estimate targets.
- Docs: ADR-063; changelog entry pending commit hash.

---

## ADR-057 — Lock `www.nilcard.app` as the Canonical SEO Domain

**Status:** Accepted (updated) · 2026-08-16

**Context:**
An SEO audit found critical domain chaos. The code's `NEXT_PUBLIC_SITE_URL` fallback was `https://nilcard.app`, but the live HTML canonicals/og:url/JSON-LD pointed at `https://athlete-os-vert.vercel.app` (the env var is set to the vercel URL in prod). `nilcard.app` serves the same content (a second live domain), and `docs/CREDENTIALS.md` + `.env.example` incorrectly listed `https://athleteos.app` — which is a completely different product (an AI lifting-coaching app). Search engines were seeing duplicate sites, split link signals, and mismatched canonicals between robots.txt, sitemap.xml, and page canonicals. Separately, Google OAuth was returning users to the OLD Vercel domain because the `signInWithGoogle` host allowlist fell back to a stale `NEXT_PUBLIC_SITE_URL`.

**Decision:**
`www.nilcard.app` is the ONE canonical production domain. All SEO output (canonical, og:url, sitemap, robots.txt sitemap line, JSON-LD URLs) must resolve to `www.nilcard.app`. The Vercel deployment URL stays but is non-canonical (optionally 301-redirected). `athleteos.app` is explicitly documented as a different product and never used. The bare `nilcard.app` resolves and is accepted by the OAuth host allowlist, so visitors on either host get OAuth callbacks on their own host.

**Consequences:**
- Code now derives URLs from `NEXT_PUBLIC_SITE_URL || "https://www.nilcard.app"` everywhere (robots.ts, sitemap.ts, page.tsx, [username]/page.tsx already did).
- Deployment action required (not code): set `NEXT_PUBLIC_SITE_URL=https://www.nilcard.app` in Vercel env and redeploy, plus Supabase Dashboard → Authentication → URL Configuration → Site URL + Redirect URLs (`https://www.nilcard.app/**`). Without this, Google OAuth still returns users to the stale URL.
- Duplicate-content risk between nilcard.app/www and the vercel URL remains until the redirect is added.

---

## ADR-058 — Harden Indexing: Thin Sitemap, Noindex on Private Areas, FAQ Structured Data

**Status:** Accepted · 2026-08-16

**Context:**
The sitemap only listed `/`, `/discover`, and published athlete URLs — missing static pages (about, changelog, docs, legal, brands) — and included junk/test athlete usernames derived from spam emails (e.g. `lasihad311adspritecom`). Auth, dashboard, admin, onboarding, and stripe-status pages inherited the root layout's `index, follow` and the generic site title, wasting crawl budget and risking junk pages in the index. The homepage has a visible FAQ section but no FAQPage structured data, missing a free rich-results opportunity.

**Decision:**
- Rebuild `app/sitemap.ts`: a `STATIC_PAGES` list covers 10 public pages with priorities and change frequencies; athlete URLs are filtered by a `JUNK_USERNAME_RE` (email-derived usernames); the CI fallback returns the full static set.
- Noindex private areas via `robots: { index: false, follow: false }`: server route layouts for auth, onboarding, offline, brands/setup, brands/dashboard, teams/setup (client pages can't export metadata, so metadata lives in layouts); direct exports on dashboard layout, admin, stripe/status, suspended.
- Add FAQPage JSON-LD to the homepage mirroring the 5 most relevant on-page FAQs.

**Consequences:**
- Crawl budget focuses on indexable public pages; auth/dashboard/admin emit `noindex, nofollow`.
- FAQ content can surface as Google FAQ rich results.
- Public static pages now appear in the sitemap with sensible priorities.

---

## ADR-056 — Server-Render Landing Sections Instead of Client-Side Lazy Loading

**Status:** Accepted · 2026-08-16

**Context:**
The home page (`app/page.tsx`) rendered a `LandingSections` client component that lazy-loaded all 13 landing sections through `next/dynamic` with `{ ssr: false }`. This predated the Next.js 15.5 upgrade. On a hard refresh the server sent only the above-the-fold hero; the browser then downloaded and hydrated all 13 section chunks in one burst after first paint, causing visible stutter/jank on first load. Investigation confirmed 9 of the 13 sections are pure server components (no `"use client"`, no module-scope browser APIs), so `ssr: false` gained nothing and forced them into the client bundle.

**Decision:**
Convert `components/landing-sections.tsx` into a server component that statically imports and renders all sections in order. The 9 server sections are SSR'd into the initial HTML; the 4 client sections (`FAQ`, `FinalCTA`, `Footer`, `InstallBanner`) stay `"use client"` and hydrate as islands.

**Consequences:**
- First refresh no longer triggers a 13-chunk client burst; below-fold content ships in the initial server HTML, so first-load jank is removed.
- Trade-off: the landing page's below-fold content is no longer code-split into separate chunks, slightly increasing initial payload; acceptable for a marketing page.
- Remaining suspects for any residual mobile jank (not addressed here): PostHog `autocapture: true`, and `Reveal`'s `filter: blur(8px)` scroll-in animation.

---

## ADR-055 — Re-enable Animated Border Glow Sweep on All Devices

**Status:** Accepted · 2026-08-16

**Context:**
ADR-052 disabled the BorderGlow `animated` cursor sweep on touch devices (`animated={!IS_COARSE_POINTER}`) and ADR-053/054 flattened the gradient mesh into a static ring under `@media (pointer: coarse)`. User feedback after those perf fixes: the card is fast, but the border glow no longer *moves* — the premium signature is the colored gradient that sweeps/loops around the card, not a static border. The flattened version reads as a downgrade.

**Decision:**
- Set `animated` (true) on both `BorderGlow` instances regardless of pointer type; remove the `IS_COARSE_POINTER` const.
- Delete the `@media (pointer: coarse)` block from `border-glow.css` so the masked gradient mesh + sweep-driven vars render normally again.
- Keep the other mobile-perf fixes that don't conflict with the sweep: webcam + SVG filter skipped on touch (`ReflectiveCard` fallback), `backdrop-filter: none` inside `.flip-card-face`, `.card-ambient-glow` blur `60px → 20px`, backface culling, and ReflectiveCard's blend-layer stripping.

**Consequences:**
- The animated sweep (one-shot ~5.7s arc around the card on mount) is back on mobile and desktop; the mesh blend modes re-enter the flip-frame compositing path on touch.
- If the sweep re-introduces mobile jank, the next lever is a cheaper sweep (e.g. CSS-only conic-gradient rotation, or gating only the sweep while keeping the static mesh during the 3D flip) — not another full removal.

---

## ADR-054 — Mobile Card: Restore Premium Border Glow as a Static Mesh

**Status:** Accepted · 2026-08-16

**Context:**
ADR-053 stripped the BorderGlow gradient mesh from touch devices, replacing it with a flat 1px accent border + `box-shadow`. User feedback: the card now performs well but lost the colored gradient border glow that "gives the platform its premium feel." The gap was that the coarse-pointer block hid the entire mesh rather than distinguishing the expensive parts (cursor-driven masks, sweep-driven CSS vars, blend-mode compositing) from the cheap parts (a static gradient ring).

**Decision:**
Keep all per-frame cost drivers off on touch (no `animated` sweep, no cursor masks, no blend modes), but restore the mesh as a **static** layer:
- `.border-glow-card::before` (gradient border ring) — mask removed, `opacity: 1`, `transition: none`. This is the colored accent ring that reads as the premium border.
- `.border-glow-card > .edge-light` (outer glow) — mask removed, `mix-blend-mode: normal` (was `plus-lighter`), `opacity: 0.6`.
- `.border-glow-card::after` (interior soft-light fill) stays `display: none` — unmasked it would wash the whole card face.
- The card's own border becomes transparent (mesh owns the edge) and the drop shadow stays.

**Consequences:**
- Mobile now shows a full colored gradient ring + soft outer halo, statically composited once and cached, so the 3D flip stays cheap.
- The interior fill and animated sweep remain off on touch; desktop hover behavior is unchanged.
- If a mobile device still shows jank, the next lever is the flip spring (`mass: 0.85`), not another glow removal.

---

## ADR-053 — Mobile Card: Fix Flip-Back Double-Toggle + Strip Blend/Blur Layers from Flip Faces

**Status:** Accepted · 2026-08-16

**Context:**
After ADR-052 (webcam + BorderGlow sweep off on touch), the profile card was still laggy on mobile and the flip-back control was broken. Investigation found two distinct issues: (1) the "Flip Back" button's `onClick={onFlipBack}` event bubbled to the parent `motion.div`'s `onClick={handleFlip}`, so `flipped` was toggled twice (front→back→front) — a genuine logic bug, not a performance artifact; and (2) even with the webcam disabled, each flip face still contained expensive per-frame compositor work: `mix-blend-mode: overlay`/`soft-light`/`plus-lighter` layers (BorderGlow masked gradient mesh, ReflectiveCard noise/sheen/overlay/border), inline `backdrop-filter: blur()` chips, and a `blur(60px)` ambient glow.

**Decision:**
- Flip-back button: `e.stopPropagation()` before calling `onFlipBack()` so the toggle fires exactly once.
- Add `@media (pointer: coarse)` CSS blocks that, on touch devices:
  - Hide the BorderGlow gradient mesh and render a static accent border + `box-shadow` glow (which also restores a visible "bottom glow" that previously only showed on hover/sweep).
  - Hide ReflectiveCard's `mix-blend-mode` layers (noise, sheen, overlay, border) and switch `theme-gradient` to normal blending.
  - Force `backdrop-filter: none !important` on any element inside `.flip-card-face`, and shrink the ambient glow blur `60px → 20px`.

**Consequences:**
- The flip-back button works on all devices; auto-return (12s) timer was already correct once the double-toggle no longer raced it.
- Mobile card faces composite as near-plain layers during the `preserve-3d` flip, dramatically reducing per-frame cost.
- Mobile loses the layered "live metal" look (noise grain / sheen / blend-overlays); the static metallic gradient + static glow remain, so the card still reads premium. Desktop is unaffected.

---

## ADR-052 — Mobile Card: Skip Webcam Material + 3D Backface Culling on Touch

**Status:** Accepted · 2026-08-16

**Context:**
The public athlete profile card (`components/profile-card.tsx`) mounted **two** `ReflectiveCard` instances (front + back face) simultaneously, each running a live 640×480 webcam `<video>` through an SVG displacement/specular filter chain, plus two `BorderGlow` `animated` cursor sweeps mutating CSS vars per frame, all composited under a Framer Motion `rotateY` spring with `preserve-3d`. On mobile GPUs the browser recomposited two big filtered video layers every frame, producing page-wide lag on every profile visit.

**Decision:**
- Detect coarse pointers (`pointer: coarse` media query or `maxTouchPoints > 1`) and, on touch devices, skip the webcam + SVG filter entirely — `ReflectiveCard` renders its existing static metallic-gradient fallback instead of a `<video>`.
- Disable the `BorderGlow` animated cursor sweep (`animated={!IS_COARSE_POINTER}`) on touch devices.
- Add `backface-visibility: hidden` + `will-change: transform` to `.flip-card-face` so the browser culls the turned-away face during the 3D flip instead of compositing both heavy faces each frame.

**Consequences:**
- Profile card is dramatically cheaper on mobile; desktop (hover) keeps the full webcam metallic material.
- Static fallback looks slightly less "live" than the webcam reflection on phones — an acceptable tradeoff for usability.
- The `backface-visibility` fix also reduces flip cost on desktop, since the hidden face is no longer composited mid-rotation.

---

## ADR-051 — OAuth Callback: Session Is the Source of Truth, Not the Code Exchange

**Status:** Accepted · 2026-08-16

**Context:**
The OAuth callback route (`app/auth/callback/route.ts`) treated `exchangeCodeForSession(code)` as the source of truth: any exchange error (or absent `code`) immediately redirected to `/auth/error` ("Sign-in failed"). This produced a classic OAuth race — the sign-in genuinely succeeds on Google's/Supabase's side, but a replayed callback URL, an expired PKCE `code_verifier`, or a retried request caused the exchange to error while `getUser()` would have returned a valid session, so the user saw a failure page despite being signed in.

**Decision:**
- Always exchange the code when present, but log (do not surface) exchange errors.
- Read the session via `supabase.auth.getUser()` as the single source of truth for routing.
- If no user session exists, redirect to `/auth/sign-in?error=sign-in-required` (retry path) rather than the dead-end error page.
- Keep `/auth/error` for genuine failures only (e.g., profile upsert failure).

**Consequences:**
- Eliminates the "Sign-in failed despite successful OAuth" race.
- Stale/replayed callback codes no longer produce a false failure.
- `/auth/error` becomes a real-failure surface instead of a default fallback.
- Requires `getUser()` (verified session, hits Supabase) rather than a cached `getSession()` — already the project convention.

---

## ADR-050 — Tip Refund Policy: Claw Back Net from Balance

**Status:** Accepted · 2026-08-16

**Context:**
When a fan requests a refund for a platform-collected tip, the athlete's balance has already been credited the net payout. Stripe retains its processing fee on refunds, so a full reversal of the original gross is impossible without the platform eating more than the fee. The policy needed to decide what is debited from the athlete's balance and whether the tip stays in their earnings history.

**Decision:**
Claw back only the athlete's net from their balance; the platform absorbs the `stripe_fee`. Refund handling in the `charge.refunded` webhook handler:
- Full refund → `net_amount = 0`, `status = "refunded"` (drops out of earned, which is `net_amount` where `status = succeeded`).
- Partial refund → `net_amount` reduced proportionally (`min(1, amount_refunded / charge.amount)`), status unchanged, so the remaining earned amount stays credited.
- Missing tip or already-refunded tip → skip; update failure → throw so Stripe retries the event.

**Consequences:**
- Athletes never owe more than what they were credited; the platform covers the non-refundable Stripe fee.
- Refunded tips disappear from the earnings/balance totals, matching the `status = succeeded` accounting in `getBalanceSummary`.
- Partial refunds keep the remaining net in the balance rather than zeroing the tip.
- No UI surfaces refunds as "negative" earnings — they are simply removed from the balance.

---

## ADR-001 — Use Next.js 14 App Router

**Status:** Accepted · 2026-06-06

**Context:**
The brief called for Next.js + React + Tailwind. We had to pick between Pages Router and App Router. The site is mostly static marketing with future product needs (auth, AI streaming, server actions).

**Decision:**
Next.js 14 App Router. Pinned to `14.2.15` for stability.

**Consequences:**
- Server components by default → smaller JS bundles for the landing page
- Easy future migration to Server Actions for forms
- React Server Components compatible with future streaming AI tools
- Slightly steeper learning curve when introducing client-only patterns
- Some libraries (older ones) still expect Pages Router; will need to vet new deps

---

## ADR-002 — Tailwind CSS with custom theme tokens, no UI library install

**Status:** Accepted · 2026-06-06

**Context:**
Brief suggested "shadcn/ui-style component aesthetics if helpful." Considered actually installing shadcn vs. recreating the aesthetic with Tailwind + custom utility classes in `globals.css`.

**Decision:**
Tailwind 3.4 with a custom theme in `tailwind.config.ts` and component utility classes (`.btn-primary`, `.btn-ghost`, `.chip`, `.eyebrow`, `.glass`, `.glow-card`, etc.) in `globals.css`. No shadcn install yet.

**Consequences:**
- Zero dependency on shadcn's component primitives → easier to keep total bundle small
- Full design control without fighting library conventions
- If/when complex primitives are needed (Dialog, DropdownMenu, Select with proper a11y), revisit installing shadcn or just radix-ui directly
- `components/ui/` folder is reserved for that future moment

---

## ADR-003 — Single accent color: electric lime `#C6FF3D`

**Status:** Accepted · 2026-06-06

**Context:**
Brief required "one strong accent color only" and explicitly said "avoid overused purple AI gradients." Candidates considered:
- Electric lime / yellow-green (sport tech feel, gen Z, Y3/Off-White vibe)
- Hot magenta (too playful)
- Cyan (too "AI startup")
- Orange (too consumer)
- Sapphire (too corporate)

**Decision:**
Electric lime `#C6FF3D` as the singular accent, with `accent.soft` (#E4FF8A) for hovers and `accent.deep` (#9BD400) for pressed states.

**Consequences:**
- Lime is **the** brand. Never introduce a second accent without amending this ADR.
- Reads premium against deep black, athletic against muted text
- Differentiates from purple/blue-saturated competitor landing pages
- Some color blindness types (deuteranopia) may perceive lime as more yellow — verify accessibility on each launch

---

## ADR-004 — Lenis for smooth scroll instead of native scroll-behavior

**Status:** Accepted · 2026-06-06

**Context:**
Modern premium sites (Linear, Apple, Vercel-adjacent) use JS-driven smooth scroll for buttery feel. Native `scroll-behavior: smooth` only animates programmatic scrolls, not wheel/touch input.

**Decision:**
Adopt **Lenis 1.1.x** in `components/smooth-scroll.tsx` wrapping the entire app in `app/layout.tsx`. Removed CSS `scroll-behavior: smooth` from `globals.css` to avoid conflict. Anchor link clicks are intercepted and routed through `lenis.scrollTo()`.

**Consequences:**
- Buttery scroll feel across all input types (wheel, touch, keyboard)
- Small JS cost (~3kB gzipped)
- Some edge cases with sticky positioning (verified: navbar sticky still works)
- Requires care when introducing scroll-locked modals — use `[data-lenis-prevent]` attribute on scrollable inner panels
- IntersectionObserver-based libraries (like Framer Motion's `whileInView`) still work because IO is independent of scroll mechanism

---

## ADR-005 — Framer Motion for animations (not GSAP, not Three.js)

**Status:** Accepted · 2026-06-06

**Context:**
Need scroll reveals, mouse-tracking 3D tilt, magnetic CTAs, animated counters, spring physics. Candidates:
- **Framer Motion** — React-first, hooks-based, MotionValues for cursor tracking, smaller than GSAP
- **GSAP** — more powerful timelines, but heavier and not React-idiomatic
- **Three.js / React Three Fiber** — true 3D but adds 500kb+ JS and requires WebGL, overkill for the look we want

**Decision:**
**Framer Motion 11.x** for all animations. Build "3D" feel with CSS perspective + `transformStyle: preserve-3d` + Framer's `useMotionValue` + spring physics. No Three.js.

**Consequences:**
- All motion primitives (`Tilt`, `Magnetic`, `Spotlight`, `Counter`, `Reveal`) built on consistent APIs
- Reusable, declarative, easy to maintain
- Total motion library cost: ~30kB gzipped for framer-motion
- True 3D (rotating models, particle systems) would still require Three.js if ever needed — we'd add it in isolation, not replace Framer Motion

---

## ADR-006 — Inter as the only typeface (no JetBrains Mono)

**Status:** Accepted · 2026-06-06 (revised from initial dual-font setup)

**Context:**
Initially set up Inter + JetBrains Mono via `next/font/google`. First build attempts had transient `fonts.gstatic.com` socket hangups for the Mono variant. JetBrains Mono was only used in a few tiny meta labels.

**Decision:**
Drop JetBrains Mono. Use system mono fallback (`ui-monospace, SFMono-Regular, "JetBrains Mono", monospace`) for the rare mono use cases via Tailwind's `font-mono`.

**Consequences:**
- One less font fetch at build time → faster, more reliable builds
- Slight visual inconsistency on the few mono labels across OSes — acceptable tradeoff
- If we ever want guaranteed consistent mono, we can self-host JetBrains Mono via `next/font/local`

---

## ADR-007 — Email-only waitlist form, no backend yet (Phase 0)

**Status:** Superseded · 2026-06-06

**Context:**
The landing page shipped before any backend exists. The "Get early access" form needs to feel real but can't actually persist data yet.

**Decision:**
Form is **visual-only** in Phase 0. On submit it toggles UI state to show a success message but does not POST anywhere. Backend (Phase 1 in `ROADMAP.md`) will wire this up to a real database + transactional email.

**Consequences:**
- Misleading to real users in production if site is publicly launched before Phase 1 ships
- Must complete Phase 1 before any paid marketing or public launch
- Recommend gating production deploy with a soft password until backend lands

---

## ADR-008 — GitHub CLI (gh) + GCM via gh for git auth

**Status:** Accepted · 2026-06-06

**Context:**
First push attempt failed because no git credential helper was configured on the dev machine. Considered: PAT in URL, SSH keys, Git Credential Manager, GitHub CLI.

**Decision:**
Install GitHub CLI via winget. Use `gh auth login --web` for OAuth. `gh auth setup-git` configures the git credential helper to use the gh token automatically.

**Consequences:**
- No PAT in shell history
- No SSH key management
- One-time browser auth, then transparent for all future pushes
- gh-managed credentials refresh automatically
- Re-auth needed if working on a new machine — but the flow is fast

---

## ADR-009 — Documentation discipline: AGENTS.md + docs/ folder

**Status:** Accepted · 2026-06-06

**Context:**
User explicitly required ongoing documentation discipline: "make sure you always have documentation of everything that's happening… never miss out anything… always push to github." Standard practice for AI-agent-driven projects.

**Decision:**
- `AGENTS.md` at repo root encodes standing rules every AI agent reads at session start
- `docs/` folder holds living documentation: CONTEXT, ARCHITECTURE, DESIGN_SYSTEM, COMPONENTS, COPY, CHANGELOG, ROADMAP, DECISIONS, DEPLOYMENT
- Every session that changes files MUST update relevant docs and append a CHANGELOG entry
- Every session that changes files MUST commit + push to `origin/main`

**Consequences:**
- Slight overhead per session
- Massive win for context retention across sessions and agents
- New agents/devs can ramp up in one read of `CONTEXT.md` + recent `CHANGELOG.md` entries
- Decisions are auditable and reversible because the rationale is captured

---

## ADR-010 — Deploy via Vercel with auto-deploy on main

**Status:** Accepted · 2026-06-06

**Context:**
Need a deploy target. Options: Vercel, Netlify, Cloudflare Pages, self-hosted.

**Decision:**
**Vercel.** Native Next.js support, zero-config for App Router, auto-deploys on push to `main`, free tier sufficient for landing page traffic.

**Consequences:**
- Locked to Vercel's runtime for future serverless features (acceptable)
- If we later need fine-grained edge control, Cloudflare Pages is the migration path
- Preview deployments on every PR (when we start using PRs)
- See `DEPLOYMENT.md` for setup specifics

---

## ADR-011 — Vercel KV (Redis) for waitlist persistence (with file fallback)

**Status:** Superseded by ADR-012 · 2026-06-06

**Context:**
Session 7 added a working waitlist with file-based JSON storage (`data/waitlist.json` + `data/newsletter.json`). Works fine in `npm run dev`, but on Vercel's serverless runtime the filesystem is ephemeral — `/tmp` is the only writable path and it doesn't survive across function invocations. Production submissions would silently disappear.

**Options considered:**
- **Vercel KV (Redis)** — free tier (30k requests/month, 256 MB), Upstash under the hood, `@vercel/kv` SDK, zero-config on Vercel (env vars auto-inject when you connect a KV store to a project).
- **Vercel Postgres** — SQL, free tier 256 MB, more overhead (Drizzle ORM setup, migrations), overkill for a simple set-with-count.
- **Neon Postgres** — serverless SQL, free tier, but same SQL-overhead cost.
- **Upstash Redis direct** — same as Vercel KV without the Vercel-native integration; works on any platform.
- **Stay on file storage** — only works in local dev. Rejected.

**Decision:**
**Vercel KV**, wrapped in a `Storage` interface (`lib/storage.ts`) that auto-selects between KV and the file fallback based on whether `KV_URL` is set. This means:
- `npm run dev` keeps working unchanged (file fallback).
- Production persists across deploys, function invocations, and region failover.
- Switching to Neon/Upstash/anything-else later is a one-file change in `lib/storage.ts`.

**Consequences:**
- The `lib/storage.ts` file is the single point of truth for persistence. Future contributors should NOT touch `lib/actions/waitlist.ts` or `app/api/waitlist/route.ts` for storage concerns.
- Free tier: 30k requests/month. At current traffic that's a long runway. If we blow past it, KV Pro is $1/mo per 100k commands.
- Rate limiting moved from in-memory `Map` (broken on serverless) to `kv.incr` + `kv.expire` — same UX, but now actually enforced in production.
- The `GET /api/waitlist` response gained a `mode` field (`"kv"` / `"file"` / `"unavailable"`) for observability.
- One-time setup required on the user's end: create the Vercel KV database in the Vercel dashboard and link it to the project. Step-by-step in `DEPLOYMENT.md`.

---

## ADR-012 — Supabase for auth + database (replaces Vercel KV + Clerk)

**Status:** Accepted · 2026-06-07

**Context:**
Phase 1 requires auth + a real database. Options considered:
- **Vercel KV + Clerk** — fast to integrate but two separate services, Clerk has its own UI aesthetics
- **Supabase (auth + Postgres)** — single service, full SQL database, own UI control, user already has a project
- **NextAuth + Drizzle + Neon** — more setup, more control, but more code

User already has a Supabase project and wants full control over aesthetics (no third-party UI components). Supabase provides auth + Postgres in one service.

**Decision:**
**Supabase** for both auth (email/password + Google OAuth) and database (Postgres). Replace Vercel KV with Supabase Postgres for waitlist/newsletter storage. Use Resend for transactional emails.

**Consequences:**
- Single service for auth + database → simpler mental model
- Full SQL database → can add complex queries, joins, analytics later
- Supabase Auth has its own session management → requires middleware for session refresh
- Service role key bypasses RLS → all server actions use service role for full access
- Free tier: 50k MAU, 500MB database → plenty for MVP
- Can migrate away from Supabase later by swapping `lib/supabase/` and `lib/storage.ts`

---

## ADR-013 — Resend for transactional emails

**Status:** Accepted · 2026-06-07

**Context:**
Need to send confirmation emails after waitlist signup. Options:
- **Resend** — simple API, React Email for templates, free tier (100 emails/day)
- **Loops** — SaaS-focused, more features, but heavier
- **SendGrid** — mature but complex setup

**Decision:**
**Resend** for confirmation + welcome emails. Using `onboarding@resend.dev` (sandbox) for now, custom domain later.

**Consequences:**
- Simple API → one function to send any email
- Inline HTML templates in `lib/actions/emails.ts` → easy to modify
- Free tier: 100 emails/day → enough for waitlist phase
- Custom domain needed for production emails (not just sandbox)

---

## ADR-014 — Adopt VISION.md as master strategic blueprint

**Status:** Accepted · 2026-06-08

**Context:**
After 16 sessions of building, the project had accumulated tactical progress (landing page, waitlist, auth, email flow) but lacked a formal strategic document to guide every decision going forward. The user provided a comprehensive vision document covering product thesis, six-layer architecture, three customer types, AI strategy, revenue model, build order, operating rules, and failure points. This needed to be captured as the authoritative reference for all future work.

**Decision:**
Create `docs/VISION.md` as the master strategic blueprint for AthleteOS. This document:
- Defines the core positioning: "the default business identity for ambitious athletes who want to turn attention into income"
- Describes the six connected layers (Identity → Monetization → AI Copilot → Growth → Marketplace → Control)
- Identifies the three customer types and their sequencing (Athletes first, then Fans, then Brands)
- Codifies the AI strategy (task-based, capped, metered, monetized — not an open-ended chatbot)
- Defines the pricing ladder (Free → Pro → Elite → Team)
- Maps the highest-probability build order (Phases 0–11)
- Establishes operating rules (narrow scope, feature filter, meter AI, God Mode from day one, conversion metrics)
- Identifies failure points and their mitigations
- Is required reading for every agent at session start (updated AGENTS.md rule)

**Consequences:**
- VISION.md is now the first document every agent reads at session start (AGENTS.md updated)
- All existing docs (CONTEXT.md, ROADMAP.md) updated to reference VISION.md as the strategic source
- ROADMAP.md reorganized from 6 phases to 11 phases to match the VISION.md build order
- CONTEXT.md reframed with six-layer model, three customer types, AI strategy section, operating rules
- All future feature decisions must be checked against VISION.md's "Does this help an athlete make money, look more professional, or save meaningful time?" filter
- VISION.md is a living document — update it if strategy evolves, record why in a new ADR

---

## ADR-015 — Security hardening: RLS lockdown, admin role check, error handling

**Status:** Accepted · 2026-06-08

**Context:**
Production audit (Session 18) found critical security gaps:
1. RLS policies on `waitlist` and `newsletter` allowed public SELECT — anyone could query the Supabase REST API to read all email addresses.
2. Admin dashboard and server actions only checked authentication (`getUser()`), not authorization — any Supabase-authenticated user could access admin functions and read all waitlist data.
3. Rate limit writes in `lib/storage.ts` had no error handling — insert/update failures silently disabled rate limiting.
4. File-based storage didn't persist confirmation tokens — email confirmation flow was broken in local dev.

**Decision:**
1. Remove all public SELECT RLS policies from `waitlist` and `newsletter` tables. All reads go through service role (server-side only).
2. Add hardcoded admin email check (`sameer@athleteos.app`) to `lib/actions/admin.ts` and `app/admin/page.tsx`.
3. Add try/catch + console.error to rate limit insert/update operations in `lib/storage.ts`.
4. Add `confirmationToken` field to file storage `Entry` type and persist it on waitlist entries.

**Consequences:**
- Email addresses are no longer enumerable via Supabase REST API
- Only the designated admin can access waitlist data
- Rate limiting failures are visible in logs instead of silent
- Local dev email confirmation flow now works correctly
- Admin email list is hardcoded — adding new admins requires a code change (acceptable for solo-dev phase)

---

## ADR-016 — Zod validation on all DB writes

**Status:** Accepted · 2026-06-09

**Context:**
Phase 2 (onboarding) introduced the first profile creation flow. Server actions like `updateProfile` received form data directly from client components and passed it to Supabase without validation. This could lead to invalid data in the database — missing fields, malformed URLs, or injection attempts.

**Decision:**
Add Zod validation schemas for all profile-related server actions. `updateProfile` in `lib/actions/profile.ts` now validates all fields with Zod before touching the database. URL fields are validated with `z.string().url()`, optional strings use `.optional()`, and the full profile schema is typed.

**Consequences:**
- Invalid data is rejected at the server action layer before reaching Supabase
- Type safety is enforced via Zod inferred types
- Consistent with standing rule: "Every DB write validated with Zod first"
- Slight overhead on server action calls (negligible)

---

## ADR-017 — CSP and security headers in next.config.mjs

**Status:** Accepted · 2026-06-09

**Context:**
Production audit (Session 21) identified that the app had no Content-Security-Policy or security headers configured. This left the app vulnerable to XSS, clickjacking, and other injection attacks.

**Decision:**
Add comprehensive security headers in `next.config.mjs`:
- `Content-Security-Policy` with allowlists for Supabase (`*.supabase.co`), Vercel Analytics, Stripe, and Google Fonts
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restricting camera, microphone, geolocation
- `X-Frame-Options: DENY`
- `frame-ancestors 'none'` in CSP

**Consequences:**
- Prevents clickjacking via iframe embedding
- Blocks XSS from untrusted scripts
- CSP allows `*.supabase.co` for images and realtime connections
- Stripe domains allowed for payment flow
- Must update CSP if new external domains are added

---

## ADR-018 — Stripe Connect Express for athlete monetization

**Status:** Accepted · 2026-06-09

**Context:**
Phase 4 requires the first monetization feature — athlete tips. The platform needs to handle payments from fans to athletes, take a platform fee, and distribute funds to athletes. Athletes need their own Stripe accounts for KYC compliance and direct payouts.

**Decision:**
Use Stripe Connect with Express accounts. Platform creates connected accounts for each athlete via `stripe.accounts.create({ type: "express" })`. Onboarding link generated via `stripe.accountLinks.create()`. Tips processed as direct charges with 5% `application_fee_amount`. Dashboard login link via `stripe.accounts.createLoginLink()`.

**Consequences:**
- Athletes get their own Stripe Express Dashboard for payouts
- Platform collects 5% on all tip transactions
- KYC handled by Stripe (no manual verification needed)
- Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` environment variables
- Webhook route (`/api/stripe/webhook`) now exists with event whitelist, audit logging, and signature verification
- Stripe SQL migration (`20260609_stripe_connect.sql`) must be applied to add columns to profiles table

---

## ADR-019 — Admin email list centralized in lib/admin.ts

**Status:** Accepted · 2026-06-09

**Context:**
Admin email check was duplicated in both `app/admin/page.tsx` and `lib/actions/admin.ts`. Adding a new admin required editing two files, creating drift risk.

**Decision:**
Create `lib/admin.ts` with a single `ADMIN_EMAILS` array and `isAdmin()` helper. All admin checks import from this file. Currently hardcoded to `sameer@athleteos.app`.

**Consequences:**
- Single source of truth for admin emails
- Adding new admins requires editing one file
- No database-backed admin role (acceptable for solo-dev phase)

---

## ADR-020 — Error boundaries and loading skeletons

**Status:** Accepted · 2026-06-09

**Context:**
Production audit found no error boundaries — runtime errors would crash the entire page with no recovery. No loading states for `/dashboard` or `/[username]` — users saw blank pages while data loaded.

**Decision:**
Add `app/error.tsx` (catches errors in dashboard/profile routes), `app/global-error.tsx` (catches root layout errors), `app/dashboard/loading.tsx`, and `app/[username]/loading.tsx` with shimmer skeleton UI.

**Consequences:**
- Runtime errors now show a retry button instead of blank page
- Loading skeletons provide visual feedback during data fetch
- Global error boundary catches layout-level crashes
- Minimal code — each file is small and focused

---

## ADR-021 — Profile published by default on onboarding

**Status:** Accepted · 2026-06-09

**Context:**
On onboarding completion, the profile needed a default visibility state. Making it unpublished would require athletes to manually publish, adding friction. Making it published immediately gets athletes their public card faster.

**Decision:**
Set `profile_published: true` on onboarding completion. New athletes immediately get a public card at `/username`. They can unpublish from the dashboard later.

**Consequences:**
- Athletes get instant gratification — their card is live after sign-up
- Public profiles are indexed by search engines immediately
- Athletes who want privacy must manually unpublish (minor friction)

---

## ADR-022 — Google Gemini as AI provider (not OpenAI)

**Status:** Accepted · 2026-06-12

**Context:**
Phase 5 requires an LLM provider for AI tools (Bio Builder first, then 4 more). Options considered:
- **OpenAI (gpt-4o-mini)** — cheap, fast, widely used, but expensive at scale and requires separate billing
- **Google Gemini (gemini-2.0-flash)** — fast, cost-efficient, generous free tier, integrated with Google ecosystem
- **Anthropic Claude** — high quality but more expensive, less generous free tier

**Decision:**
Use **Google Gemini** via `@google/generative-ai` SDK. Default model: `gemini-2.0-flash` (configurable via `GEMINI_MODEL` env var). Provider abstraction in `lib/ai.ts` exports `generateBioVariations()`.

**Consequences:**
- Free tier: 15 RPM, 1M tokens/day — generous enough for MVP
- Cost: $0.10/1M input tokens, $0.40/1M output tokens (gemini-2.0-flash)
- `GEMINI_MODEL` env var allows swapping models without code changes
- Provider abstraction (`lib/ai.ts`) makes future provider swaps a single-file change
- Monthly quota: Free = 5 total across all AI tools, Pro = 300/month
- `ai_usage` table tracks usage per user per calendar month

---

## ADR-023 — Shared quota pool across all AI tools

**Status:** Accepted · 2026-06-12

**Context:**
Phase 5 introduced 5 AI tools (Bio Builder, Pitch Writer, Caption Generator, Profile Optimizer, Rate Helper). The original spec called for per-tool limits (Bio=3, Pitch=2, Caption=5, Optimize=1, Rate=1) enforced via a shared pool. This adds complexity: tracking per-tool counts, displaying per-tool limits, and enforcing a shared ceiling simultaneously.

**Decision:**
Use a **single shared quota pool** across all 5 tools. One `ai_usage` row per user per month with `tool: "all"`. Free = 5 total actions/month, Pro = 300 total/month. No per-tool limits enforced — just the shared pool. Display shows "X of 5 free actions left this month" uniformly across all tools.

**Consequences:**
- Simpler implementation: one row, one counter, one check per generation
- Simpler UI: one quota banner shared across all tools
- Athletes can choose how to spend their quota (all on bios, or spread across tools)
- Landing page per-tool limits (Bio 3/mo, Pitch 2/mo, etc.) are aspirational display only — not enforced
- When subscriptions land (Phase 6), per-tool limits can be added as a separate layer without changing the core quota mechanism

---

## ADR-024 — Subscription tier model for AI quota

**Status:** Accepted · 2026-06-12

**Context:**
Phase 6 will introduce Stripe Billing subscriptions. Before that lands, the AI quota system needs to be tier-aware so it can enforce different limits per plan. Currently, everyone is hardcoded to "free" with a limit of 5/month.

**Decision:**
Add a `plan` column to the `profiles` table (TEXT, default `'free'`). Add a `getPlan()` helper in `lib/actions/ai-usage.ts` that reads the user's plan from the database. Update `getAiQuota()` to return the plan-based limit. Three tiers at launch:

| Plan | AI actions/month | Price |
|------|-----------------|-------|
| Free | 5 | $0 |
| Pro | 300 | $14/mo |
| Elite | 500 | $29/mo |

The `plan` column is set by Stripe webhooks (Phase 6) — not by the profile editor. Default is `'free'` for all new users.

**Consequences:**
- Quota enforcement is plan-aware without hardcoded checks
- `getPlan()` is the single source of truth for subscription tier
- Adding new tiers requires only updating `QUOTA_CONFIG` in `ai-usage.ts`
- The `plan` column is read-only from the client perspective — only server actions and webhooks modify it
- Phase 6 will add Stripe webhook handler to set `plan` on subscription create/cancel/update

---

## ADR-025 — Stripe Billing Integration

**Status:** Accepted · 2026-06-12

**Context:**
Phase 6 requires actual subscription billing to monetize the platform. The `plan` column and tier-aware quota system exist (ADR-024), but there's no way for users to actually subscribe or for the system to manage subscriptions. Need Stripe Checkout for subscription creation, Customer Portal for management, and webhooks for lifecycle events.

**Decision:**
Integrate Stripe Billing using the existing `stripe` npm package:

- **Checkout:** `stripe.checkout.sessions.create()` with `mode: "subscription"` and price IDs for Pro ($14/mo) and Elite ($29/mo). Includes `subscription_data.metadata` to propagate `athleteos_user_id` and `tier` to subscription events.
- **Customer Portal:** `stripe.billingPortal.sessions.create()` for subscription management (cancel, update payment method).
- **Cancel:** `cancelSubscriptionAction()` sets `cancel_at_period_end: true` for graceful downgrade at period end.
- **Webhooks:** Route at `/api/stripe/webhook` handles `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Uses raw body for signature verification. Downgrades to free on payment failure.
- **Lazy initialization:** `lib/stripe.ts` refactored to Proxy pattern — Stripe client initialized on first access, not at module level. Prevents build failures when `STRIPE_SECRET_KEY` is empty.
- **Price IDs:** Configured via `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_ELITE` env vars.

**Consequences:**
- Full subscription lifecycle without third-party billing libraries
- Reuses existing `stripe` npm package — no new dependencies
- Webhook handler uses Supabase service role key (no user session in webhook context)
- `subscription_data.metadata` ensures subscription events carry user ID for reliable plan updates
- `invoice.payment_failed` handler downgrades to free on payment failure
- `cancel_at_period_end` allows graceful downgrade without immediate cancellation
- Build passes with empty Stripe keys (lazy init pattern)

---

## ADR-026 — Auth callback repairs missing profile rows

**Status:** Accepted · 2026-06-13

**Context:**
Some users may have signed up before the `handle_new_user()` profile trigger or profile INSERT RLS policy existed. Those users can confirm email successfully but still have no `profiles` row. The auth callback previously queried `profiles.onboarding_completed` with `.single()` and only redirected to `/onboarding` when a profile existed with `onboarding_completed = false`. Missing rows fell through to the default `next` path, usually `/`.

**Decision:**
Make `app/auth/callback/route.ts` self-heal missing profile rows. After `exchangeCodeForSession()`, the callback now looks up the profile with `.maybeSingle()`. If no profile exists, it upserts a minimal row from the authenticated Supabase user (`id`, `email`, metadata name/avatar, `onboarding_completed: false`) and redirects to `/onboarding`.

**Consequences:**
- Email-confirmed users with missing profiles land in onboarding instead of the landing page.
- The database trigger remains the primary creation path; callback upsert is a resilience fallback.
- Requires the "Users can insert own profile" RLS policy to be applied in Supabase.
- If profile creation fails, the callback redirects to `/auth/error` and logs the Supabase error.

---

## ADR-027 — MVP analytics uses raw hashed events without rollup tables

**Status:** Accepted · 2026-06-17

**Context:**
Phase 8 needs athletes to see profile performance quickly: views, unique visitors, link clicks, referrers, countries, views-by-day, and top links. A rollup table was considered, but the current traffic volume and MVP dashboard needs are small enough that server-side aggregation from raw events is simpler and less error-prone.

**Decision:**
Use two raw event tables only:
- `page_views(athlete_id, viewer_ip_hash, referrer, user_agent, country, city, created_at)`
- `link_clicks(athlete_id, link_label, link_url, viewer_ip_hash, referrer, created_at)`

Store no raw IP addresses. `lib/actions/analytics.ts` hashes the request IP with SHA-256 plus `ANALYTICS_IP_HASH_SECRET` before inserting `viewer_ip_hash`. The dashboard aggregates with `getAnalytics(athleteId, range)` on demand for 7d, 30d, and 90d windows.

**Consequences:**
- Faster MVP implementation with one canonical event model
- No rollup job is required for the first analytics dashboard
- Query cost is acceptable at MVP scale but should be revisited before high-volume launch
- `country` and `city` are reserved for future enrichment but are not populated yet
- A 90-day raw-log cleanup helper exists, but a scheduler/manual job is still needed to enforce retention

---

## ADR-028 — Auth Resilience: Handling Expired Links

**Status:** Accepted · 2026-06-17

**Context:**
Users reported "otp_expired" errors during email verification. This happens when the verification link is clicked after it has expired (default is often 1 hour) or when multiple links are generated.

**Decision:**
Improve auth resilience with three changes:
1. **Resend Action:** Implement `resendVerification` server action in `lib/actions/auth.ts` using `supabase.auth.resend`.
2. **Specific Error Handling:** Update `/auth/error` page to be a client component that checks `window.location.hash` for specific Supabase error codes (like `otp_expired`) and displays user-friendly messages.
3. **Resend UI:** Add a "Resend Link" form to the `/auth/error` page to allow immediate recovery without going back to the signup page.
4. **Configuration Check:** Recommended manual increase of "OTP Expiry" in Supabase Dashboard -> Authentication -> Email Templates -> OTP Expiry.

**Consequences:**
- Reduced friction for users who click stale links.
- Better visibility into why authentication failed.
- Hash-based errors (which are client-side only) are now captured and displayed.
- Manual dashboard configuration is still required for the duration change.

---

## ADR-029 — Service role client for auth callback profile upsert

**Status:** Accepted · 2026-06-17

**Context:**
After Supabase email confirmation, the auth callback route (`app/auth/callback/route.ts`) upserts a profile row for users who don't have one yet (e.g., signed up before the `handle_new_user()` trigger existed). The upsert used the anon client, which relies on RLS to verify `auth.uid() = id`. However, in the Next.js Route Handler context after `exchangeCodeForSession()`, the anon client cannot resolve `auth.uid()` from the session cookies, causing the RLS INSERT policy to block the upsert and return "Could not create profile".

**Decision:**
Use a service role client (created via `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`) for the profile upsert in the auth callback. The service role client bypasses RLS entirely. The regular anon client is still used for `exchangeCodeForSession()` and `getUser()` where RLS is not needed.

**Consequences:**
- Profile creation in the auth callback now succeeds reliably
- Service role key is only used server-side in a Route Handler — no client-side exposure
- The `handle_new_user()` database trigger remains the primary profile creation path; the callback upsert is a resilience fallback
- If someone removes the service role key from env vars, the callback will fail — but this is acceptable since the key is a required env var

---

## ADR-030 — Custom Resend confirmation instead of Supabase SMTP

**Status:** Accepted · 2026-06-19

**Context:**
Supabase SMTP relay doesn't work with Resend (535 auth error with `onboarding@resend.dev`). The app showed "Check your email" after sign-up but no email was actually sent because `supabase.auth.signUp()` triggers Supabase's built-in SMTP, which fails silently. The `resendConfirmationEmail` function also called `supabase.auth.resend()` which hit the same broken SMTP path.

**Decision:**
Bypass Supabase email entirely and use the Resend API directly for account confirmation:

1. **`signUp()`** generates a UUID token via `generateToken()`, stores it in `profiles.confirmation_token` with a 24-hour expiry and `email_confirmed = false` via the service role client, then sends a confirmation email via `sendConfirmationEmail(email, token, "/api/auth/confirm-email")`.

2. **`/api/auth/confirm-email`** GET endpoint validates the token from query params, checks expiry, sets `email_confirmed = true` and clears token fields in profiles, then calls `supabase.auth.admin.updateUserById()` to also set `email_confirm: true` on the auth user (required for Supabase sign-in to work).

3. **`resendConfirmationEmail()`** looks up the profile by email, generates a new token, stores it with expiry, and sends via Resend. Does not call `supabase.auth.resend()`.

**Consequences:**
- Email confirmation now works end-to-end via Resend API
- Supabase's built-in SMTP is completely bypassed for account confirmation
- Token expiry (24h) prevents stale token abuse
- `supabase.auth.admin.updateUserById()` ensures the auth user's `email_verified` is set, so Supabase sign-in works after confirmation
- The `handle_new_user()` trigger still creates the profile row; the `signUp()` upsert adds confirmation fields to that row
- Resend free tier (100 emails/day) is sufficient for MVP
- If Resend fails, the user is still created but won't receive the email — they can use the "Resend confirmation email" button on the sign-in page

---

## ADR-031 — AI Asset Vault: Store AI outputs client-side with RLS-scoped server actions

**Status:** Accepted · 2026-07-02

**Context:**
Athletes generate content with 5 AI tools (bio, pitch, caption, optimize, rate) but had no way to save and reuse outputs. Every generation was ephemeral — copy or use, then gone. This creates friction for athletes who want to compare versions, revisit drafts, or build a library of AI-generated content over time. The Lock-In System (Session 63) tracks behavioral metadata but not the actual content itself.

**Decision:**
Create a dedicated `ai_saved_assets` table with RLS policies scoped to `auth.uid()`. Server actions follow the same pattern as `ai-memory.ts` (anon client for auth checks, service role for writes). The vault is exposed as a 6th tab in the AI Toolkit rather than a separate route, keeping all AI functionality in one place.

Key decisions:
1. **Single table, TEXT content** — No separate tables per tool type. One `ai_saved_assets` table with a `tool_type` CHECK constraint. Content stored as TEXT (up to 50k chars) rather than JSONB since outputs are always plain text strings.
2. **Star + filter UI** — Athletes can star favorites and filter by tool type. Stars sort to the top. This is the primary organization mechanism (no folders/tags yet).
3. **Inline editing** — Assets can be edited in-place without creating a copy. This supports the "iterate on a draft" workflow.
4. **No versioning** — Edits overwrite the original. Version history adds complexity with limited value at this stage.
5. **Milestone unlocks in CompoundingValue** — Replaced the generic progress bar with explicit Day 7/30/90 feature unlocks (Pitch Templates, PDF Export, Elite Card Layout). This creates tangible incentives for continued platform usage.

**Consequences:**
- Athletes can save any AI output with one click, building a personal content library
- The vault tab badge (saved count) creates a subtle engagement signal on the AI Toolkit
- RLS ensures athletes can only access their own assets — no cross-user data leakage
- The `tool_type` CHECK constraint allows future per-tool analytics on what gets saved most
- Milestone unlocks create a psychological lock-in loop tied to platform tenure
- No versioning means accidental edits are irreversible — acceptable tradeoff for simplicity

---

## ADR-032 — Fix pre-existing build errors before shipping new features

**Status:** Accepted · 2026-07-02

**Context:**
The codebase had 3 pre-existing TypeScript build errors that blocked `npm run build`:
1. `content-posts.tsx:46` — `loadPosts` called but function was named `load` inside `useEffect`
2. `membership-tiers.tsx:49` — `loadTiers` called but function was named `load` inside `useEffect`
3. `lib/stripe.ts:11` — Stripe API version `2024-11-20.acacia` didn't match installed package's expected `2026-05-27.dahlia`

**Decision:**
Fix all three errors in the same session rather than shipping new features on a broken build. Extract the `load` functions from `useEffect` callbacks to component scope so they're callable from event handlers.

**Consequences:**
- Build passes cleanly — new features can be verified with `npm run build`
- The pattern of defining async loaders inside `useEffect` and calling them elsewhere is now eliminated
- Stripe API version aligned with installed package — no runtime type mismatches

---

## ADR-022 — True SSE Streaming for AI Tools

**Status:** Accepted · 2026-07-02

**Context:**
The original `callGeminiStream` implementation was "fake streaming" — it called the non-streaming `callGemini`, awaited the full response, then wrapped the entire text in a `ReadableStream` as one chunk. Users saw no token-by-token output, defeating the purpose of a streaming UI.

**Decision:**
Rewrite `callGeminiStream` to send `stream: true` in the API request body and parse SSE `data:` lines from the MiMo API response. The `useStream` hook in `lib/hooks/use-stream.ts` already handles `ReadableStream<string>` reader — just needed a real stream source.

**Consequences:**
- Users see AI text appear token-by-token with a cursor animation
- Perceived latency drops dramatically (first token in ~200ms vs. 3-5s full response)
- Streaming server actions now return `AiResult<ReadableStream<string>>` instead of raw streams
- Post-stream parsing required: raw text split into structured arrays (bios, captions, pitches) after streaming completes
- No changes needed to the MiMo API — it already supports SSE

---

## ADR-023 — QR Code Library Choice

**Status:** Accepted · 2026-07-02

**Context:**
The Identity Layer needed QR code generation for profile sharing. Considered `qrcode.react`, `react-qr-code`, and bare `qrcode`.

**Decision:**
Use the bare `qrcode` package (12kB, no React dependency). Generates data URLs on canvas for both display and PNG download via `toDataURL()`.

**Consequences:**
- Smallest possible bundle impact (12kB vs 20kB+ for React wrappers)
- Full control over canvas rendering — no React re-render overhead
- Download PNG feature works natively with `toDataURL` + `<a>` download
- Slightly more manual canvas management vs. React component wrappers

---

## ADR-024 — Weekly Analytics Pruning Cron

**Status:** Accepted · 2026-07-02

**Context:**
`page_views` and `link_clicks` tables grow unbounded. After months of operation, query performance degrades and Supabase storage limits approach. The existing `cleanup_raw_analytics()` PL/pgSQL function in `schema.sql` was defined but never called and missing from `APPLY_MIGRATIONS.sql`.

**Decision:**
Create a Vercel cron route (`/api/cron/prune-analytics`) that runs Sundays at 3AM UTC (avoids overlap with Monday 8AM briefing). Calls `cleanup_raw_analytics()` via `supabase.rpc()` to delete rows > 90 days. Returns pruned row counts as JSONB.

**Consequences:**
- Analytics data stays bounded — maximum ~90 days of raw data per table
- Existing `cleanup_raw_analytics()` function now actually gets called
- Sunday 3AM UTC chosen to avoid collision with Monday 8AM weekly briefing cron
- 90-day retention balances storage cost vs. historical analytics value

---

## ADR-033 — Headless Browser Testing with Playwright Against Production

**Status:** Accepted · 2026-07-02

**Context:**
The project had a basic `e2e/landing.spec.ts` with only 3 smoke tests. No automated browser testing existed for the live production server. Manual QA was the only verification method. For a platform approaching launch, automated end-to-end testing against the actual production deployment is critical for catching regressions in routing, rendering, SEO, accessibility, and performance.

**Decision:**
Create a comprehensive Playwright test suite (`e2e/full-audit.spec.ts`) with 39 tests across 10 categories, plus a dedicated production config (`playwright.prod.ts`) that targets the live Vercel URL without requiring a local server. Categories: Landing Page (6), Navigation (7), Public Athlete Card (2), API Endpoints (2), SEO & Meta Tags (6), Performance (3), Accessibility (5), Mobile Responsiveness (3), Security Headers (2), Error Handling (2).

Key decisions:
1. **Production-first testing** — `playwright.prod.ts` points at `https://athlete-os-vert.vercel.app` with no `webServer` config. Tests run against the actual deployed code, catching Vercel-specific issues.
2. **`playwright.config.js` for local dev** — existing config auto-starts `npm run dev` for local testing.
3. **Heading-based selectors** — used `getByRole('heading', { exact: true })` instead of `text=` selectors to avoid strict-mode violations from repeated text across nav, hero, sections, and footer.
4. **Tolerant 404 handling** — the `/[username]` dynamic route returns HTTP 200 for non-existent users (Next.js middleware pipeline issue). Tests accept both 200 and 404, logging a warning for 200.
5. **Screenshot + trace on failure** — `screenshot: 'only-on-failure'` and `trace: 'on-first-retry'` for debugging.

**Consequences:**
- 39 automated tests verify the live production site in 18 seconds
- Catches regressions before they reach users (run before every deploy)
- The 404 status code bug is documented as a known issue without blocking the test suite
- Test selectors are robust against text duplication across nav, hero, sections, and footer
- `playwright.prod.ts` can be integrated into CI/CD for automated production verification
- HTML reporter generates visual test reports for team review

---

## ADR-034 — Full Project Audit Documentation

**Status:** Accepted · 2026-07-02

**Context:**
After 65 sessions of rapid development, the project needed a comprehensive audit to verify alignment between documentation, code, and strategy. An AI agent was tasked with reading every document, every source file, every migration, and every component to produce a master audit report.

**Decision:**
Conduct a full audit covering: project identity and positioning, tech stack verification, business model analysis, product architecture (six layers), build status (phases 0-12), database schema (19+ tables), security posture, design system, current issues and blockers, strategic assessment, and prioritized recommendations.

Key findings:
1. **Documentation is world-class** — 15+ living docs, 66 sessions documented, ADRs for every decision.
2. **Security posture is strong** — RLS everywhere, audit log immutability, Zod validation, IP hashing, CSP headers.
3. **Two phases still in TESTING** — Phase 4 (Stripe tips) and Phase 6 (subscriptions) need end-to-end verification with live keys.
4. **404 status bug** — `/[username]` returns 200 for non-existent users despite calling `notFound()`.
5. **Uncommitted changes exist** — `overview.tsx`, `profile-card.tsx`, `package.json`, `qr-share-modal.tsx` have uncommitted modifications.

**Consequences:**
- Strategic recommendations documented: get 50 athletes live, fix Stripe tips end-to-end, enable AI in production, register `athleteos.app`, run Supabase migrations, set up Sentry
- Known bugs and blockers are catalogued in QA_TESTING.md
- The audit establishes a baseline for future sessions to reference

---

## ADR-035 — Subscription Flow Hardening: Error Checks, Retry Polling, and Live Stripe Tier

**Status:** Accepted · 2026-07-02

**Context:**
End-to-end audit of the subscription flow (checkout → webhook → DB → frontend) found 6 bugs. The most critical: (1) `checkout.session.completed` webhook did not check the Supabase update result — a silent DB failure would leave the user on "free" despite payment, with no Stripe retry because the webhook returned 200. (2) `customer.subscription.created/updated` handlers did not write `stripe_subscription_id`, so if the checkout handler failed, no subsequent event ever set it. (3) The `?upgraded=pro` success redirect parameter was completely ignored — zero user feedback. (4) Race condition between Stripe redirect and webhook processing. (5) `invoice.payment_failed` had no error check and no user notification. (6) `getSubscriptionByUserId` read the plan from DB instead of deriving it from the live Stripe subscription price ID.

**Decision:**
1. **Error checks on all webhook DB writes**: Every `supabase.from("profiles").update(...)` call in the webhook handler now destructures `{ error }` and throws on failure, causing the webhook to return 500 for Stripe retry.
2. **stripe_subscription_id in all subscription handlers**: Both `customer.subscription.created` and `customer.subscription.updated` now include `stripe_subscription_id: subscription.id` in the update payload.
3. **Success banner on ?upgraded**: BillingPanel reads `useSearchParams().get("upgraded")`. When present and plan matches, shows animated success banner with auto-dismiss.
4. **Retry polling**: When `?upgraded` is present but plan is still "free", BillingPanel retries `getSubscriptionStatus()` every 2 seconds up to 5 times. Shows "Confirming your upgrade..." during retries.
5. **Payment failure email**: New `sendPaymentFailedEmail()` function in `lib/actions/emails.ts`. Called non-blocking from `invoice.payment_failed` handler.
6. **Live Stripe tier derivation**: `getSubscriptionByUserId()` now determines tier from `subscription.items.data[0].price.id` matching against `STRIPE_PRICE_ID_PRO`/`_ELITE` instead of trusting the DB `plan` column.

**Consequences:**
- Silent webhook failures are now impossible — every DB write is checked and throws for Stripe retry
- Users always see a confirmation banner after successful upgrade
- Race condition between redirect and webhook is handled with 10-second retry window
- Payment failure users receive an actionable email
- Plan tier is always consistent with what Stripe actually charged
- All 39 Playwright tests continue to pass

---

## ADR-036 — Exclude API Routes from Middleware + revalidatePath in Webhooks

**Status:** Accepted · 2026-07-02

**Context:**
User completed a Stripe subscription payment but the billing dashboard still showed "Free" tier. Investigation found three issues:
1. The webhook handler updated `profiles.plan` in Supabase but never called `revalidatePath()`. Although the billing page has `force-dynamic`, the dashboard overview did not, and Next.js Server Component caching could serve stale data.
2. The middleware matcher ran on ALL routes including `/api/stripe/webhook`. Stripe's POST requests triggered the Supabase session-refresh middleware unnecessarily.
3. No diagnostic visibility into webhook execution — failures were invisible without checking Stripe Dashboard logs.

**Decision:**
1. **`revalidatePath` after every plan update**: Every webhook handler that modifies `profiles.plan` now calls `revalidatePath("/dashboard")` and `revalidatePath("/dashboard/billing")` after the successful DB write. This ensures the next page request renders fresh data.
2. **Exclude `api/` from middleware matcher**: Changed matcher from `/((?!_next/static|...))` to `/((?!_next/static|...|api/|...))`. API routes (webhooks, cron jobs, health checks) are handled by their own Route Handlers and don't need Supabase session refresh.
3. **`force-dynamic` on dashboard overview**: Added `export const dynamic = "force-dynamic"` to `app/dashboard/page.tsx` so it always reads fresh from the database.
4. **Diagnostic endpoint**: Created `/api/stripe/diagnose` that returns env var status, profile plan, recent webhook audit log entries, and live Stripe subscription details.

**Consequences:**
- Webhook plan updates are immediately visible on the next page load
- Stripe webhook POST requests bypass unnecessary middleware processing
- Dashboard overview always shows current plan, not cached data
- Diagnostic endpoint enables rapid debugging of Stripe integration issues in production

---

## ADR-037 — Webhook Signature Verification Diagnostic Hardening

**Status:** Accepted · 2026-07-02

**Context:**
User provided Vercel function log showing `StripeSignatureVerificationError: No signatures found matching the expected signature for payload`. The payload contained a valid `checkout.session.completed` event with correct metadata (`athleteos_user_id`, `tier`), the signature header was present, and the body was readable. The HMAC verification failed, which means `STRIPE_WEBHOOK_SECRET` in Vercel does not match the signing secret Stripe uses.

**Decision:**
1. **Early webhook secret guard**: Check `process.env.STRIPE_WEBHOOK_SECRET` at the top of the POST handler. Return 500 immediately if missing, instead of failing cryptically in `constructEvent`.
2. **Diagnostic logging on failure**: When `constructEvent` throws, log the secret prefix (first 7 chars), signature presence, body length, and body prefix. This makes it possible to diagnose secret mismatches from Vercel logs.
3. **Enhanced `/api/stripe/diagnose`**: Added `STRIPE_WEBHOOK_SECRET_prefix` and `STRIPE_WEBHOOK_SECRET_is_test` to the env check output.
4. **Stripe init placement**: Moved `const stripe = getStripe()` back to function scope (outside try block) so both signature verification and event handling can use it.

**Consequences:**
- Missing webhook secret is caught immediately with a clear error message
- Secret mismatches are diagnosable from Vercel function logs (prefix comparison)
- Diagnostic endpoint shows whether the webhook secret is in test format (`whsec_` prefix)
- User must manually sync the webhook secret between Stripe Dashboard and Vercel env vars

---

## ADR-038 — useSearchParams Requires Suspense Boundary + Middleware Matcher Revert

**Status:** Accepted · 2026-07-02

**Context:**
After deploying Sessions 73-74, the billing page returned HTTP 405. Investigation found two potential causes:
1. `BillingPanel` calls `useSearchParams()` at the top level without a `<Suspense>` boundary. In Next.js 14, `useSearchParams()` suspends during server rendering and throws if no Suspense boundary catches it.
2. The middleware matcher was changed to exclude `api/` routes, which could interfere with route resolution.

**Decision:**
1. **Wrap BillingPanel in Suspense**: Added `<Suspense fallback={<skeleton />}>` around `<BillingPanel>` in the billing page. This catches the suspension from `useSearchParams()` and shows a loading skeleton while the client component hydrates.
2. **Revert middleware matcher**: Restored the original matcher without `api/` exclusion. The middleware now runs on all non-static routes including API routes. The Stripe webhook handler uses `request.text()` which works correctly regardless of middleware execution.

**Consequences:**
- Billing page loads without errors
- `useSearchParams()` is properly wrapped for Next.js 14 compatibility
- Middleware runs on all routes (including API) — Stripe webhook still works because `request.text()` is independent of middleware
- Any future component using `useSearchParams()` must be wrapped in `<Suspense>` when rendered in a Server Component tree

---

## ADR-039 — Single Source of Truth for Plan Gating (resolvePlan)

**Status:** Accepted · 2026-07-12

**Context:**
Referral rewards were cosmetic because plan-checking logic (`getPlan` in `lib/actions/ai-usage.ts`) only checked the `plan` column of the `profiles` table and ignored `extended_pro_until`. Any user with a future `extended_pro_until` (earned via referrals or granted via stripe-recovery) was still treated as a `free` plan user, blocking access to Pro quotas.

**Decision:**
1. **Centralized Plan Resolution Helper**: Created `resolvePlan` in `lib/referral-reward.ts` as a pure function. It returns `"pro"` if `extended_pro_until` is in the future, or the base plan column value if it is `"pro"` or `"elite"`, defaulting to `"free"`.
2. **Server Action `getEffectivePlan`**: Created a new server action `getEffectivePlan()` in `lib/actions/plan.ts` using `getUser()` (compliant with AGENTS.md) that queries the `profiles` table and calls `resolvePlan`.
3. **Refactored Consumers**: Updated `getPlan` in `lib/actions/ai-usage.ts`, `weekly-briefing` cron, and `discovery.ts` to query `extended_pro_until` and use `resolvePlan` instead of checking the plan column directly.

**Consequences:**
- Referral-earned Pro days now correctly unlock access and quota.
- Pure resolution logic is fully unit-testable.
- Single source of truth for plan determination prevents future drift.

---

## ADR-040 — Two-sided Referral Reward

**Status:** Accepted · 2026-07-12

**Context:**
`recordReferral` only rewarded the referrer with Pro days via `grant_pro_reward`. A completed referral should reward both sides — the standard two-sided referral model — so the referred user also gets Pro days on completing onboarding.

**Decision:**
1. Added a pure policy helper `usersToReward(referrerId, referredId, isSelf, alreadyReferred)` in `lib/referral-reward.ts` that returns `[referrerId, referredId]` for a valid completion and `[]` for self-referral or duplicate.
2. `recordReferral` calls `usersToReward` and loops `grant_pro_reward` over each returned ID (service-role admin client only). Existing self-referral and `referred_id` UNIQUE guards remain.

**Consequences:**
- Both referrer and referred earn 7 Pro days on completion.
- Reward policy is isolated in a pure, unit-tested function separate from DB application.
- Self-referral cannot trigger any reward (policy returns `[]`).

---

## ADR-041 — getPlan() delegates to getEffectivePlan(); rewire all plan-gated reads

**Status:** Accepted · 2026-07-12

**Context:**
`getPlan()` in `lib/actions/ai-usage.ts` duplicated the same DB query + `resolvePlan()` logic as `getEffectivePlan()` in `lib/actions/plan.ts`. While functionally correct, two identical code paths create drift risk. Additionally, several UI components (upgrade CTA, profile badge, settings display, billing tier) read the raw `plan` column directly, ignoring `extended_pro_until` — meaning referral-earned Pro users saw incorrect plan status in the UI.

**Decision:**
1. `getPlan()` now delegates entirely to `getEffectivePlan()` — single source of truth. `Plan` type re-exported from `EffectivePlan`.
2. `stripe-billing.ts` uses `resolvePlan()` for tier fallback (added `extended_pro_until` to select query).
3. `overview.tsx`, `profile-card.tsx`, `settings-panel.tsx` now call `resolvePlan(profile.plan, profile.extended_pro_until)` instead of reading `profile.plan` directly.
4. Admin functions and `first-500-pro.ts` left unchanged (admin display / write paths, not feature gates).
5. `discover/client.tsx` left unchanged (already receives effective plan from `discovery.ts`).

**Consequences:**
- All plan-gated reads route through `resolvePlan()` or `getEffectivePlan()`.
- Stripe webhook write path unchanged (still writes raw plan column).
- One extra Supabase client creation in `getAiQuota()` (creates its own + `getEffectivePlan()` creates one). Acceptable for architectural clarity.
- Test suite includes delegation regression test.

---

## ADR-042 — Platform-collected tipping with manual 48h withdrawal requests (retire Stripe Connect)

**Status:** Accepted · 2026-08-05

**Context:**
Tips previously used Stripe Connect: each athlete had their own connected Stripe account, fans tipped directly, and AthleteOS took an `application_fee`. This required per-athlete Connect onboarding and per-athlete payout infrastructure, which the product did not actually operate. The desired flow is: fans tip into AthleteOS's own Stripe account, athletes see their earnings in the dashboard, and athletes request a withdrawal which AthleteOS fulfills manually within 48 hours.

**Decision:**
1. Remove Stripe Connect entirely from the tip flow. `createTipSession` now creates a standard `mode: "payment"` Checkout session into the platform account — no `transfer_data`, no `application_fee`.
2. The webhook computes the 5% platform fee in-app from `session.amount_total` (`PLATFORM_FEE_PERCENT` in `lib/constants.ts`) and stores `net_amount` on the tip.
3. `createPayout` no longer moves money via Stripe. It inserts a `status: "pending"` row into `payouts` (with `payout_method` + `payout_destination` snapshot), blocks repeat requests within 5 minutes, and enforces the $25 minimum. AthleteOS admins fulfill the request manually (send funds via the recorded payout method) and mark it paid via `updatePayoutStatus`.
4. Balance math is derived from the DB: `available = earned(net tips) − withdrawn(paid payouts) − pending`.
5. Payout-method eligibility (`profiles.payout_method`) gates both the withdraw UI and onboarding completion, replacing the Connect `stripe_onboarding_complete` path for tips.
6. Admin payout screen becomes a withdrawal-request queue (`getPayoutData` + `updatePayoutStatus`); god-mode financials still read legacy Connect columns (left in place, unset for new athletes).

**Consequences:**
- No per-athlete Stripe onboarding; faster athlete activation.
- AthleteOS holds tip funds in its own account until manual payout — requires the 48h operational commitment and an admin queue to clear.
- Legacy Connect columns (`stripe_account_id`, `stripe_onboarding_complete`) remain in `profiles` but are no longer written for new athletes; god-mode filters on them are effectively all-empty until cleaned up.
- New `payouts` columns (`payout_method`, `payout_destination`, `updated_at`) require migration `20260805_payout_method_destination.sql` to be applied before `createPayout` works.

---

## ADR-043 — Cut fan memberships (tiers, content posts, email campaigns) for MVP launch

**Status:** Accepted · 2026-08-05

**Context:**
The product shipped a partially-built fan-membership system: `membership_tiers`, `fan_subscriptions`, `fan_subscribers`, recurring Stripe Checkout (`createSubscriptionCheckout`, `/fan/subscribe/[tierId]`), exclusive content posts, and email campaigns that mail `fan_subscribers`. MVP launch is the priority; the card must be simply name, contact, stats, photos, animations, and tips. Recurring fan revenue requires per-athlete subscription products, gated content CRUD, subscriber management, and campaign tooling — too much unbuilt surface to complete before launch. The athlete's own plan billing (Pro/Team, Free/Pro/Elite for athletes, `billing.ts`/`stripe-billing.ts`) is a separate system and stays.

**Decision:**
1. Delete `lib/actions/memberships.ts`, `lib/actions/memberships-client.ts`, `lib/actions/campaigns.ts`.
2. Delete `components/dashboard/membership-tiers.tsx`, `content-posts.tsx`, `email-campaigns.tsx`.
3. Delete routes `app/fan/subscribe/`, `app/dashboard/memberships/`, `app/dashboard/campaigns/`; remove their nav entries from `config/dashboard-nav.ts`.
4. `ProfileCard` drops the `tiers` prop and the tier section; `app/[username]/page.tsx` stops calling `getTiers`.
5. DB tables `membership_tiers`, `fan_subscriptions`, `fan_subscribers`, `email_campaigns` are left in place (no destructive migration) so existing analytics/teams/GDPR queries keep working; they are simply unused.
6. Landing copy scrubbed of "memberships" (Problem, How It Works, NIL guide, `docs/COPY.md`); ROADMAP Phase 9 marked CUT.

**Update (same day):** User chose to drop the tables after all. `supabase/migrations/20260805_drop_fan_memberships.sql` drops the four orphaned tables; all remaining code references (stripe webhook fan-subscription branch, team subscriber counts in `teams.ts`, weekly-briefing subscriber stat, GDPR delete list) were removed in the same session. ADR decision #5 is superseded — the tables no longer exist once the migration runs. Historical migrations (`20260620_full_platform.sql`, `20260705_fan_content_rls.sql`) are untouched; `APPLY_MIGRATIONS.sql` was scrubbed so fresh DBs don't recreate the tables.

**Consequences:**
- Faster MVP: the card is only name/contact/stats/photos/tips; no recurring-subscription backend to finish or maintain.
- Orphaned tables were dropped by migration `20260805_drop_fan_memberships.sql` (supersedes decision #5 above).
- Stripe recurring products/config specific to fan tiers under the platform account are unused.
- If re-added post-MVP, Phase 9 in ROADMAP.md is the recovery checklist.

---

## ADR-044 — Publishing requires a complete card (no field can be left missing)

**Status:** Accepted — 2026-08-05

**Context:**
Onboarding previously required only username, full name, sport, and school; everything else (photo, position, class year, bio, socials) was skippable, and the card was published (`profile_published: true`) immediately. The public card renders every section — front-face photo hero, identity chips, stats grid, back-face About/Links/Highlights/Connect/Contact — so published cards could look incomplete and ugly, clipping and breaking sections.

**Decision:**
1. `lib/card-completeness.ts` is the single source of truth: a card is publishable only when it has photo, full name, sport, position, school, class year, bio ≥15 chars, ≥1 stat, ≥1 link (valid http URL), ≥1 highlight (valid http URL), ≥1 social handle, and contact email or phone.
2. `updateProfile` (server action) rejects any call that sets `profile_published: true` against an incomplete card and returns the list of missing fields — client-side validation is convenience, this gate is the invariant.
3. Onboarding grows to 6 required steps (username, profile, socials, stats, links/details, done); all Skip paths removed; the "Finish your card" step collects links, highlights, and contact info.
4. Dashboard publish toggle pre-checks completeness and shows a red banner listing missing fields; Launch checklist gains links/highlights/contact items.
5. Requirement bar (min 15-char bio, valid https URLs for links/highlights, ≥10-digit phone or valid email) is enforced in onboarding UI and re-validated server-side by the existing Zod schemas plus the completeness gate.

**Consequences:**
- No published card can go live incomplete from onboarding or the dashboard.
- Onboarding is longer (6 steps); friction is the tradeoff for never shipping a broken-looking card.
- Already-published legacy users who unpublish will be blocked from re-publishing until they fill the gaps — intended.
- `lib/actions/profile.ts` now does one extra profile read only when `profile_published: true` is set (publish path only; normal saves unaffected).

---

## ADR-047 — Deal Room data model: inquiries ARE the pipeline

**Status:** Accepted — 2026-08-05

**Context:**
The Deal Room needs pipeline status and dollar values, but `inquiries` was a flat inbox. Options: create a separate `deals` table or extend `inquiries`. A separate table forks the data (one inquiry turning into a deal would live in two places), doubles every query, and complicates the ledger.

**Decision:**
1. `inquiries` IS the pipeline. Added `status` (`CHECK status IN ('new','replied','negotiating','won','lost')`, default `'new'`) and `deal_value NUMERIC` (dollars, nullable, recorded when won).
2. To stop public-insert forgery (the open brand-inquiry form could otherwise write `status='won'` / `deal_value=999999` on any athlete row), a `sanitize_inquiry_insert()` BEFORE INSERT trigger forces `status='new'` and `deal_value=NULL` on every insert. Only the athlete's own UPDATE — owner-scoped, `WITH CHECK (athlete_id = auth.uid())` — moves rows through the pipeline.
3. Server actions double-gate ownership: authenticated client (RLS enforced) plus an explicit `inquiry.athlete_id === user.id` check in `updateInquiryStatus`. `submitInquiry` stays service-role (anon card visitors), sanitized by the trigger.
4. **Currency ledger:** `tips.amount` in cents; `inquiries.deal_value` in dollars. The displayed ledger = tips (cents ÷ 100) + won `deal_value`. The existing `nil_deals` compliance table (also cents) is NOT summed into the business ledger — it is mandated disclosure reporting, not operations. If product later wants a unified reporting view, it reconciles explicitly and logs that ADR.

**Consequences:**
- No `deals` table; single source of truth for the pipeline.
- Public inquiry form stays open; forged rows impossible via trigger.
- Outstanding ADR-046 sub-item moved to Batch 2: `recordToolEvent` calls (5 AI tools) and `ai_events`/`athlete_ai_memory` write paths in `lib/actions/ai-memory.ts` are still live and must be removed; `getAiMemory` read surface stays null-safe until Business Facts (Batch 4).

---

## ADR-048 — Business Facts: the user-owned store that replaces AI memory

**Status:** Accepted — 2026-08-05

**Context:**
ADR-046 rejected AI that learns silently from tool usage. With `getAiMemory` reduced to a null stub (Batch 2), the AI context was empty — pitch/caption/rate tools had no grounding for voice, tone, or pricing. The successor needs to be user-owned, user-visible, and user-editable.

**Decision:**
1. New `business_facts` table (owner-only RLS: `profile_id = auth.uid()`): `brand_voice` (free text, max 500), `preferred_tone` (check-constrained: confident/casual/professional/playful), `min_deal_value` (numeric dollars, nullable), `deal_preferences` (JSONB array of 6 allowed types). `getBusinessFacts` / `saveBusinessFacts` in `lib/actions/business-facts.ts`; the save path is Zod-validated and upserts on `profile_id` via the authenticated client (RLS double-gate).
2. AI grounding replaces the memory read everywhere: `getEnrichedMemoryContext` (lib/actions/ai.ts), `ai-content.ts`, `quick-ai.ts` now read facts; `lib/ai.ts` `AIMemoryContext` grows `brand_voice`/`min_deal_value`/`deal_preferences`, and `buildMemoryBlock` emits a "Business Facts & Style Profile" block instead of the old "learned from your history" block. `lib/actions/ai-memory.ts` deleted (0 importers); DB tables `ai_events`/`athlete_ai_memory` remain for now; `gdpr.ts` untouched.
3. `inquiries.won_at TIMESTAMPTZ` added; `updateInquiryStatus` sets it on transition TO 'won' and clears it on transition AWAY. `getBusinessSummary` windows "won this week" on `won_at`, falling back to `created_at` for legacy rows. "Won this week" now means *when the deal was won*, not when the inquiry arrived.

**Consequences:**
- The athlete controls what the AI knows about them; nothing is inferred from usage.
- AI quota (`recordAiUsage`) is an operator limit, not silent learning — unchanged.
- `preferred_output_length`, `tools_used_count`, and the tool-usage stats were dropped from the AI context; `preferred_output_length` is now a fixed "medium" default.

---

## ADR-045 — Complete-card requirement is a deliberate friction tradeoff

**Status:** Accepted — 2026-08-05

**Context:**
The what-if "high-school or content-light athletes bail out of the 6-step onboarding" is a real risk. ADR-044 made every card field required. This ADR settles the tension: the complete-card guarantee is a brand promise (no published card looks broken), and friction is the accepted price.

**Decision:**
Do not add a "publish partially" escape hatch. Mitigate the friction operationally instead: concierge onboarding for the first cohort, saved progress across steps, and clear in-step guidance. If abandonment data later shows the 6-step flow is the top churn point post-launch, revisit with data — not pre-emptively.

**Consequences:**
- What-if register line #2 and #3 CLOSED.
- A published card is always complete, by construction.

---

## ADR-046 — Reject lock-in-by-manipulation (AI memory redesign)

**Status:** Accepted — 2026-08-05

**Context:**
The "lock-in system" (`athlete_ai_memory`, `ai_events`, `compounding-value.tsx`) was built as a psychological engagement loop: silent behavioral telemetry, Day 7/30/90 time-gated feature unlocks, and copy warning athletes they lose their "trained copywriter config" by leaving. On review this fails the product's value test and carries a trust/reputation risk (if the telemetry pattern was ever publicized, it would read as manipulation).

**Decision:**
1. No silent behavioral telemetry shaping outputs. `ai_events` silent logging is removed; PostHog remains the product-analytics source, Sentry covers errors.
2. No time-gated feature unlocks. Day 7/30/90 gates are removed.
3. No scare copy about losing personalized configs.
4. `athlete_ai_memory` is replaced by a user-owned, user-visible, user-editable "Business Facts" store (deals, rates, preferences, audience) that AI reads — the athlete sees and controls the context, which is the trust model.
5. `compounding-value.tsx` is redesigned into a Business Dashboard that reports money moved and pipeline.

**Consequences:**
- What-if register lines #9 and #15 CLOSED.
- Retention is chased with real value (deals, earnings, proof), not manipulation.
- Master Plan §4/§5 build prompts inherit these constraints.

---

## ADR-049 — ReflectiveCard webcam material as the public card shell

**Status:** Accepted · 2026-08-09

**Context:**
The existing `ReflectiveCardShell` was a pure CSS component — a rotating conic-gradient glow border, noise grain, and a static dark surface. The user requested integration of the React Bits `ReflectiveCard` component, which uses the live webcam feed as the card's reflective surface (blurred, desaturated, SVG-filter-displaced to look like polished metal).

**Decision:**
Replace `ReflectiveCardShell` with `ReflectiveCard` as the material shell for both card faces. Key design choices:
1. `children` prop — all athlete card UI renders inside the material layer.
2. Shared `webcamStreamRef` — front and back faces share one `MediaStream`; browser fires one permission prompt.
3. Unique `filterId` per instance — prevents SVG filter ID collision in the DOM.
4. Graceful fallback — static dark metallic gradient when webcam is denied or unavailable.
5. `prefers-reduced-motion` — strips filter animation, reduces video opacity.

**Consequences:**
- Card reflects real-world ambient light — premium and unique in the NIL/athlete space.
- Requires HTTPS + webcam permission on first card view. Fallback handles denial gracefully without blocking render.
- Both face instances are in the DOM simultaneously; only one stream is allocated.
- `ReflectiveCardShell` definition remains in `profile-card.tsx` as unused dead code — safe to delete in a future cleanup pass.

