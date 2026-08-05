# MASTER_PLAN.md — AthleteOS Pre-Launch Strategy Lock

> **The contract for all build prompts.** Every prompt given to the builder agent
> references a section of this document. Nothing gets built that is not in here;
> nothing gets cut that is not in here. Changes to this doc happen only through
> discussion with the founder, recorded in `docs/DECISIONS.md`.
> Status: **RATIFIED 2026-08-05** — founder delegated Open Points A–D to the
> core team (Prompter + Builder). Decisions in §9 are binding.

---

## 1. Locked Facts (not up for debate)

1. **Pre-launch.** Phase 25 (production deployment) is NEXT. Every feature built so far is unvalidated.
2. **The card is the front door, not the moat.** Link-in-bio clones exist and are free. The card gets an athlete in; it does not keep them.
3. **The moat is the athlete's business data** — deals, inquiries, real rates, earnings — accumulating over time, plus the team/collective side of the market.
4. **No lock-in by manipulation.** Silent behavioral telemetry, time-gated unlocks (Day 7/30/90), and scare copy ("you'll lose your trained config") are rejected. They punish good users, create trust risk, and are not a product.
5. **Every feature must pass the value test:** *Does this help an athlete make money, look professional, or save meaningful time this week?* Features that fail it are cut, regardless of how built they are.
6. **No mocking the user.** Components that show fake/MOCK data (marketplace) are removed until real data exists, or moved behind admin.
7. **The 6-step onboarding + completeness gate stays.** A published card is always complete. Accepted tradeoff: more onboarding friction (ADR-045).

---

## 2. The Core Loop (what the product must become)

Identity → Inbound → Deals & Earnings → AI that operates → Weekly proof

1. **Identity** — the public card (`/username`), QR/share, OG images. Built. Keep.
2. **Inbound** — every inquiry, tip, and brand message lands in ONE deal room: an inbox with athlete context, suggested reply drafts (AI, using the athlete's real stats/rates), and status tracking (new → replied → negotiating → won/lost).
3. **Deals & Earnings** — a ledger the athlete owns: deal value, rate, brand, status, payout. This is the proof-of-value and the source of truth for the data moat. "This week: 3 inquiries, 1 deal won, $250 pending" beats any gamification.
4. **AI that operates, not decorates** — AI reply drafting, pitches built from real deal history, pricing advice from real rates. Keep: Pitch Writer, Rate Helper, Captions, Asset Vault. Bio Builder folds into onboarding. No new standalone AI toys.
5. **Weekly proof** — the digest reports money moved and pipeline, not "days on platform."

**The retention metric that matters:** does an athlete open the app weekly because money moves through it?

---

## 3. The Wedge (RATIFICATION REQUIRED — see Open Points)

**Recommendation:** founder-led cohort of ~20 individual athletes (VISION GTM):
smaller-school athletes, women's sports, niche audiences — athletes who want to
look serious and have no agent-level help. Concierge onboarding for the first
cohort (founder personally helps). First-dollar loop: publish card → share QR →
tips + inquiries arrive → deal room closes the first deal → that deal is the
retention moment.

The team/collective tier (Phase 11) is the **scale path, not the launch path** —
B2B sales cycles are long and the product must prove itself single-player first.

---

## 4. Cut / Keep / Redesign (FIRST PASS — RATIFICATION REQUIRED)

### KEEP — core, money rails, proof
- Public card, QR share, OG images, share buttons
- Onboarding (6 required steps, completeness gate)
- Tips: `tip-button`, `balance-overview`, `payment-method-setup`, withdraw flow, webhook
- `inquiry-inbox` / inquiries (seed of the deal room)
- `dashboard-overview`, `analytics-panel` (views/clicks/tips), `profile-score`
- `dashboard-editor` (7 tabs), `settings-panel`, `billing-panel`
- AI: Pitch Writer, Rate Helper, Captions, Asset Vault, Bio Builder (folded into onboarding)
- `social-accounts-editor` (verified accounts feed the NIL score)
- NIL score card + history (differentiator)
- `launch-checklist`, `referral-card`, `system-status`, God Mode admin

### CUT — pre-launch (does not pass the value test)
- **Sponsorship marketplace** (1541L, MOCK data) — delete or hide behind admin until real demand exists
- **Social scheduler** — scheduling is a product, not a feature; cut
- **Email campaigns** (fan newsletters) — noise pre-launch; keep only transactional emails
- **Smart AI actions** — evaluate, likely cut (gimmick, not a loop)
- **`ai_events` silent logging** — remove; PostHog already covers product analytics; Sentry covers errors
- **`athlete_ai_memory` silent telemetry** — replaced by Business Facts (§5)
- **Membership tiers / content posts** — verify fully removed (ADR-043), no leftovers

### REDESIGN
- **`compounding-value.tsx`** → **Business Dashboard**: earnings to date, pipeline (inquiries/deals by stage), audience growth, week-over-week "money moved." No day-counting, no scare copy, no time-gated unlocks.
- **NIL score inputs** — keep the score, but its inputs must be transparent and, where possible, deal-informed.

---

## 5. Data Moat Redesign — "Business Facts"

Replace silent telemetry with a **user-owned, user-visible, user-editable** facts store:

- A `business_facts`-style record the athlete can open and edit: deals won/lost (brand, value, rate, date), pricing history, preferred tone, audience stats, saved AI outputs.
- All AI prompts are built from these facts — the athlete SEES the system using their data, which is the trust model.
- Compounding is real, not cosmetic: every deal logged makes pitch/pricing AI measurably better.
- RLS: owner-only read/write (same as existing profile pattern). No service-role writes from the client.

---

## 6. Pricing (RATIFICATION REQUIRED — see Open Points)

**Recommendation:** keep the existing ladder (Free $0 / Pro $14 / Elite $29 / Team custom),
with one change: free tier must never look degraded (card quality is the brand), and
monetization pressure comes from deal-room capacity, AI quota, and analytics — not
from card features. Team tier is the real-revenue conversation later.

---

## 7. What-if Register

Every scenario raised, with resolution. OPEN items are worked in discussion before
the dependent build prompt ships.

| # | What-if | Resolution | Status |
|---|---------|-----------|--------|
| 1 | Athletes never return after publishing | Deal room + weekly proof makes the app a money destination, not an artifact | CLOSED (by design) |
| 2 | 6-step onboarding abandons users | Concierge for first cohort; progress is saved; accepted tradeoff (ADR-045) | CLOSED |
| 3 | HS athletes lack stats/highlights | Complete-card gate stands; concierge fills gaps; publish = quality promise | CLOSED |
| 4 | Tips are tiny ($20–50/mo total) | Accepted. Tips are the wedge + proof, not revenue. Revenue = subscriptions + teams | CLOSED |
| 5 | No athlete pays for Pro | OPEN — pricing thread (Open Point C) |
| 6 | Payout volume creates compliance burden | Fine at small scale (manual 48h); revisit KYC/tax at scale | CLOSED (deferred) |
| 7 | AI outputs feel generic | AI uses real Business Facts; human-in-the-loop; vault for reuse | OPEN — verified in build |
| 8 | Metered AI feels nickel-and-dimed | Generous free quota; metering is cost control, not a sales tool | CLOSED |
| 9 | Silent memory is exposed → trust disaster | Redesign to visible Business Facts | CLOSED (by redesign) |
| 10 | Referral loops go nowhere | Founder-led GTM first; referrals after proof exists | CLOSED |
| 11 | Coach/team adoption | Team tier exists; timing = post-launch push | OPEN — timing |
| 12 | Compliance office flags tips | Verification + rules-aware copy; keep simple pre-launch | OPEN — low priority |
| 13 | Opendorse adds a free card | Moat is data + deal room, not the card | CLOSED |
| 14 | 50-component dashboard gets 1% adoption | Cut list (§4) | CLOSED (pending ratification) |
| 15 | Lock-in system becomes a public scandal | Rejected pre-emptively (ADR-046) | CLOSED |
| 16 | Endless pre-launch building | Build order has an explicit launch gate (Phase 25) | CLOSED |

---

## 8. Build Order After Ratification

1. **Cut/redesign pass** — ✅ **DONE (Batch 1).** §4 CUT items deleted (~100 kB), routes/nav cleaned, silent-telemetry write paths still pending (Batch 2), CompoundingValue deleted (Business Dashboard lands with the Deal Room data).
2. **Deal Room** — ⏳ In progress (Batch 1 delivered the unified inbox + pipeline on `inquiries`; ADR-047). Remaining: Business Facts wiring (Batch 4).
3. **Business Dashboard** — ⏳ BATCH 2 (replaces the empty spot where CompoundingValue rendered; sources: tips, inquiry pipeline, page_views).
4. **AI operates** — Batch 4: reply drafting + pitch/rate re-grounding on Business Facts.
5. **Launch gate** — production deploy (Phase 25), UAT, monitor.
6. **Team tier** — post-launch push.

**Rule:** a prompt ships only when every OPEN what-if its section depends on is CLOSED.

---

## 9. Open Points — RESOLVED (ratified 2026-08-05, founder delegation)

- **A. Wedge — RATIFIED:** individual-athlete cohort (~20, founder-led concierge). First-dollar = tips + inquiries; the deal room closes the first deal. Teams/collectives are the post-launch scale path, not the launch path.
- **B. Cut list — RATIFIED as written** (§4). No saves.
- **C. Free tier — RATIFIED:** Free withholds deal-room capacity (3 active deals), AI quota (5–10/mo, existing), advanced analytics presets (7/30/90d), and exports. Card quality never degrades on Free — the card is the brand.
- **D. Build order — RATIFIED with refinement:** Batch 1 cut pass → Batch 2 data foundations + Deal Room (schema + inbox + ledger) → Batch 3 Business Dashboard (consumes deal/pipeline data) → Batch 4 AI grounding (Business Facts into pitch/rate/reply-draft) → Batch 5 launch gate + funnel polish. The ledger's schema precedes the dashboard because the dashboard reports on it.

---

Last updated: 2026-08-05 (draft for ratification)
