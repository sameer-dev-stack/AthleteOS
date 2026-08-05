# CARD_FEATURE.md — The Athlete Card

> Report on the Card feature: philosophy, description, and direction.
> The Card is the front-end identity layer of AthleteOS and the single most
> important surface in the product. Everything else (monetization, AI, growth,
> admin) exists to feed it or profit from it.

Last updated: 2026-07-11

---

## 1. Philosophy

### 1.1 The Card is the wedge, not the product

AthleteOS is positioned as *the business operating system for athletes* — not a
digital card, not a link-in-bio, not a marketplace. But the Card is deliberately
the first thing every athlete gets and the first thing every visitor sees. It is
the wedge that makes the entire platform instantly understandable.

The reasoning is drawn straight from the strategic blueprint (`VISION.md`):

> "Not a digital card. Not a link-in-bio. Not a marketplace. The card is the
> front-end identity layer. The real value is the system behind it."

So the Card carries two jobs at once. On the surface it is a beautiful, shareable
public identity page. Underneath, it is the container that surfaces monetization
(tips, memberships, inquiries), AI output (bio, optimization), and analytics
(views, clicks, NIL score). The Card is where the athlete's "business" becomes
visible and where a visitor is converted into a fan, a tipper, or a brand lead.

### 1.2 Identity first, revenue immediately

The Card belongs to the **Identity** layer — the first of the six connected
layers of AthleteOS. Identity is built in Phase 1 because it is the supply side:
without a polished athlete profile there is nothing to monetize and nothing for
brands to discover. Identity is intentionally sequenced before fans and before
brands.

But identity alone does not retain athletes — proof of revenue does. That is why
the Card does not wait for a "profile complete" milestone to start earning. Tips,
membership tiers, and brand inquiry buttons live directly on the Card so an
athlete can receive money on day one. This directly answers the core promise:
sign up once, get a premium public identity, get guided toward revenue.

### 1.3 Make the athlete look serious in under a minute

The first go-to-market wedge is underserved athletes who want to look serious but
don't have agent-level help — smaller-school athletes, women's-sports athletes,
and athletes with engaged niche audiences. The Card's entire visual language
(premium dark theme, single electric-lime accent `#C6FF3D`, phone-frame mockup,
glow borders, 3D flip) exists to make a 19-year-old with a phone photo look like
a sponsored professional. The landing page sells *transformation, not features*:
"look pro, get discovered, monetize faster." The Card is the proof of that
transformation.

### 1.4 Every element must earn its place

The operating rule for the whole product applies with full force to the Card:
every element must help the athlete *make money, look more professional, or save
meaningful time.* Vanity widgets that do none of those things do not belong on
the Card. This is why the Card front is ruthless about what it shows — name,
sport, school, a NIL score, three stats, social proof — and pushes the deeper
content (bio, links, highlights, monetization) to the back face, revealed on tap.

---

## 2. Description

### 2.1 Two distinct "cards"

There are two things called a "card" in the codebase, and it is worth separating
them clearly:

1. **The marketing mockup** — `components/athlete-card.tsx`. A static, hardcoded
   "Maya Reyes / Stanford" showcase card used inside the landing-page hero. It is
   wrapped in a `<Tilt>` for 3D depth, decorated with floating "receipt" cards (a
   brand deal, an AI-drafted bio, a tip notification) and exists purely to *sell*
   the concept. It is not connected to real data.

2. **The real public Card** — `components/profile-card.tsx`, rendered at the
   route `/[username]`. This is the live, data-driven athlete card the product
   actually ships. When this report says "the Card," it means this one unless
   stated otherwise.

There is also `components/public-card.tsx`, which is dead code (not imported) per
`ARCHITECTURE.md`, and `components/onboarding/card-preview.tsx`, a live preview
shown while an athlete fills out onboarding.

### 2.2 Anatomy of the public Card

**Route:** `/[username]` · **Component:** `components/profile-card.tsx` ·
**Fixed dimensions:** 360 × 504 (`CARD_W` / `CARD_H` in `lib/constants.ts`),
mobile-first and responsive down to `calc(100vw - 32px)`.

The Card is a single element with a **3D flip animation** (Framer Motion spring)
between a front and back face. The front is the hook; the back is the depth.

**Front face — the hook:**
- Photo hero (top ~66%) with a crossfade carousel when multiple photos exist.
- AthleteOS logo/wordmark, plus QR-share and share/copy buttons.
- Name, an animated "Active" presence dot, sport · position pill, school + class
  year (FR/SO/JR/SR).
- Social proof row: total views, total followers, stat count.
- Verified badge and plan badge (Pro/Team) overlays.
- **NIL Score badge** — a 0–100 score with a qualitative label (Emerging →
  Growing → Established → Strong → Elite).
- Stats row: up to three sport-aware stats with matching icons (GPA, 40-yd, PPG,
  yards, TD, catch %, etc.).
- A pulsing "Tap to see more" flip hint.

**Back face — the depth:**
- Compact header (avatar + name + sport/school) and a "Flip" affordance.
- **Bio** ("About"), quality-gated so junk/placeholder bios are hidden.
- **Links** — up to 6, showing 2 by default with a "Show all" expander; each
  click is tracked.
- **Highlights** — up to 6 video links (YouTube/TikTok/Hudl-style), tracked.
- **Social icons** — Instagram, X/Twitter, TikTok, YouTube with brand colors on
  hover.
- **Monetization row** — membership tiers, a Contact modal (email/phone with
  copy + mailto/tel), a "Send Inquiry" brand-lead form, and a Tip button.
- Share buttons (Twitter/Facebook/LinkedIn) and a "Powered by AthleteOS" footer.

**Behavioral details worth noting:**
- **Auto-return:** the back face flips back to the front after 10s of inactivity,
  with the timer reset on mouse/touch movement — so a shared Card always
  re-presents its best face.
- **View tracking is de-duplicated** with a ref guard so re-renders don't inflate
  counts (`trackView` fires once on mount).
- **Theming:** a per-profile `theme_accent` (default `#C6FF3D`) recolors the
  entire Card — glow, badges, stat values, buttons — while staying inside the
  single-accent dark-only design system.
- **Data quality guards:** stats and bios are sanitized and filtered
  (repeated-character junk, over-long values, emails-as-bios) so a sloppy profile
  still renders cleanly.

### 2.3 Data flow

```
Server Component  app/[username]/page.tsx
  → getPublicProfile(username)          // profile + stats + links + highlights + tiers
  → <ProfileCard ... nilScore totalViews totalFollowers tiers />
  → trackView(profile.id) on mount      // analytics
  → trackLinkClick(profile.id, ...)     // on each outbound click
```

The Card is server-rendered for speed and SEO, then hydrated as a client
component for the flip, carousel, modals, and tracking. Backing fields live on
the `profiles` table: `username`, `profile_published`, `theme_accent`,
`theme_layout`, `nil_score`, and the related stats/links/highlights/tiers.

### 2.4 The supporting cast

The Card doesn't stand alone. It is wired to:
- **NIL Score engine** (`nil-score-card.tsx`, `nil_value_metrics`) — the animated
  radial gauge and the 0–100 score shown on the Card.
- **QR sharing** (`qr-share-modal.tsx`, `qrcode` package) — canvas QR for the
  Card URL.
- **Analytics** (`page_views`, `link_clicks`) — every view and outbound click is
  captured for the dashboard.
- **Dynamic OG images** (`@vercel/og`) + **JSON-LD Person schema** + sitemap
  entry — so a shared Card renders a rich preview and is indexable.
- **Card strength digest** — a bi-weekly cron (`/api/cron/card-digest`, Mondays
  10:00 UTC) emailing published athletes their current score, trend, and top
  quick wins to drive them back to improve the Card.
- **Onboarding card preview** — a live preview of the Card during sign-up so the
  athlete sees the payoff before finishing.

---

## 3. Direction

The Card is functionally shipped (Phase 3 "DONE" in the roadmap), so direction is
about deepening it, not building it from zero. The intended trajectory:

### 3.1 Customization & premium tiers
- **Theme picker** beyond accent color: layout variants (`theme_layout` already
  exists in the schema) and a limited premium palette.
- **Elite Card Custom Layout** is an explicit Day-90 compounding-value unlock —
  advanced layouts are a status/upsell lever for the Elite tier, not a free
  default.
- Premium themes, verified badges, and **custom domains** are named revenue
  upsells in the pricing ladder.

### 3.2 Profile strength engine
- Score the Card 0–100 with actionable suggestions and "complete your profile"
  prompts (the NIL Score is the current expression of this).
- Tighten the loop: digest email → dashboard quick wins → athlete edits → higher
  score → more conversions. The digest cron is the first half of this loop.

### 3.3 Deeper monetization on the Card
- Expand the on-card action set toward the full Monetization layer: bookings,
  paid shoutouts, affiliate links, and digital offers, alongside the existing
  tips, memberships, and inquiries.
- ~~Tier-gated content blocks on the Card for fan memberships (Phase 2).~~ — CUT 2026-08-05 (ADR-043); MVP card is name/contact/stats/photos/tips only.

### 3.4 Discovery & brand readiness
- The public **discovery portal** (responsive card grid, SEO-indexed) turns the
  population of Cards into a browseable directory — the on-ramp to the eventual
  brand/marketplace layer (Phase 3 of the customer sequence).
- Better OG/share assets and sponsor-facing "brand readiness" framing so a Card
  doubles as a pitch asset.

### 3.5 Guardrails on direction
Per the vision's failure-point analysis, the Card's evolution must resist
over-building: ship fast, iterate on real athlete usage, keep AI metered, and
never let the Card's polish outrun proof of revenue. The rule stands — *ship the
card fast, add one monetization win fast, track upgrades and earnings from day
one.*

---

## 4. Quick reference

| Aspect | Detail |
|--------|--------|
| Public route | `/[username]` |
| Main component | `components/profile-card.tsx` |
| Marketing mockup | `components/athlete-card.tsx` (static, hero) |
| Onboarding preview | `components/onboarding/card-preview.tsx` |
| Dimensions | 360 × 504 (`CARD_W` / `CARD_H`) |
| Layer | Identity (Phase 1) |
| Key fields | `username`, `profile_published`, `theme_accent`, `theme_layout`, `nil_score` |
| Analytics | `page_views`, `link_clicks` (via `trackView` / `trackLinkClick`) |
| Retention loop | `/api/cron/card-digest` (bi-weekly strength digest) |
| Design constraint | Dark only, single accent `#C6FF3D` |

---

## 5. Related documents

| Document | What it covers |
|----------|----------------|
| `VISION.md` | Strategic blueprint, six layers, build order |
| `PRODUCT_SPECIFICATION.md` | Section 5.4 Public Athlete Card, schema, SEO |
| `ARCHITECTURE.md` | Component map, data flow, analytics pipeline |
| `ROADMAP.md` | Phase 3 Public Athlete Card + profile strength engine |
| `DESIGN_SYSTEM.md` | Tokens, accent, motion primitives |
