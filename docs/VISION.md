# VISION.md — AthleteOS Strategic Blueprint

> **Master vision document. Read by every agent at session start.**
> This defines the product thesis, business model, build order, and operating rules.
> Every feature decision should reference this document.

---

## Core Positioning

**AthleteOS is the business operating system for athletes.**

Not a digital card. Not a link-in-bio. Not a marketplace.
The card is the front-end identity layer. The real value is the system behind it:
brand positioning, monetization rails, AI-assisted execution, analytics,
sponsor readiness, and admin oversight.

**Core promise:**
> An athlete signs up once, gets a premium public identity page,
> gets guided toward revenue opportunities, and upgrades when they need
> more reach, more AI help, or more monetization tools.

---

## Six Connected Layers

| Layer | What it does | Why it matters |
|-------|-------------|----------------|
| **Identity** | Public athlete card/profile, QR share, links, stats, media, contact, verified badge | Gives the athlete a polished home page and makes the product instantly understandable |
| **Monetization** | Tips, memberships, bookings, paid shoutouts, affiliate links, digital offers | Creates revenue on day one instead of waiting for brand deals |
| **AI Copilot** | Bio writer, pitch writer, caption generator, rate guidance, profile optimizer | Saves athletes time and turns confusion into action |
| **Growth** | Analytics, conversion tracking, CTA testing, social performance prompts | Makes Pro feel like a business tool, not just a profile page |
| **Marketplace** (later) | Brand discovery, sponsor briefs, verified inbound leads, campaign matching | Expands ARPU after athlete adoption exists |
| **Control** | God Mode admin, moderation, payouts, abuse detection, plan controls, usage metering | Protects margins and keeps the whole machine under your control |

---

## Three Customer Types

| Customer | How they pay | When to build |
|----------|-------------|---------------|
| **Athletes** | Brand tools, AI help, customization, analytics, monetization utilities | **Phase 1** — supply side, identity layer |
| **Fans / Supporters** | Subscriptions, support tiers, exclusive content, shoutouts, digital access | **Phase 2** — after athlete adoption |
| **Brands / Teams / Schools** | Discovery, verified profiles, campaign tools, bulk onboarding, data access | **Phase 3** — after quality athlete profiles exist |

**Sequence matters:** Athletes first (supply + identity), then fans (monetization),
then brands (marketplace expansion). Never start with a marketplace.

---

## AI Strategy

AI is **task-based, capped, and monetized** — not an open-ended chatbot.

### MVP AI Features (build order)

1. **AI Bio Builder** — turns raw athlete info into a polished NIL-ready profile
2. **Sponsor Pitch Writer** — drafts outreach messages customized to sport, niche, audience, goals
3. **Caption Generator** — short post copy for launches, wins, partnerships, CTAs
4. **Profile Optimizer** — suggests better hooks, CTA placement, monetization blocks, cleaner copy
5. **Rate/Readiness Helper** — structured guidance on pricing logic and sponsor readiness (with disclaimers)

### Metering Structure

| Plan | AI Actions/Month |
|------|-----------------|
| Free | 5–10 |
| Pro | 100–300 + better templates |
| Team/Agency | Pooled quotas, admin workflows, exports, managed analytics |

AI is a **conversion trigger**, not a cost center.

---

## Revenue Model

Hybrid recurring + transactional:

- Athlete subscription revenue
- Fan/supporter membership revenue
- Transaction fees on bookings, shoutouts, and paid interactions
- Upsells for premium themes, verified badges, custom domains, exports, analytics
- Later B2B revenue from teams, collectives, schools, brand tools

### Pricing Ladder

| Tier | Price (placeholder) | What it includes |
|------|--------------------|------------------|
| **Free** | $0 | One card, limited links, limited AI (5–10/mo), basic support |
| **Pro Athlete** | $14/mo | More customization, analytics, better monetization blocks, more AI (100–300/mo) |
| **Elite Athlete** | $29/mo | Everything in Pro + advanced sponsor kit, custom branding, priority review |
| **Team/Collective** | Custom | Bulk onboarding, admin dashboard, shared branding, exports, usage oversight |

**Psychology:** Free gets them in. Pro feels like a business upgrade.
Elite feels like ambition/status. Team becomes the bigger-ticket offer.

---

## Go-To-Market

### First Wedge
Underserved athletes who want to look serious but don't have agent-level help:
- Smaller-school athletes
- Women's sports athletes
- Athletes with engaged niche audiences

### GTM Path
1. Founder-led onboarding with a few early athletes
2. Turn first profiles into case studies
3. Push waitlist landing page + DM-based recruiting
4. Offer free setup / concierge onboarding for first cohort
5. Capture testimonials, earnings snapshots, profile makeovers
6. Launch referral loops: athletes invite teammates, coaches, friends

**Landing page sells transformation, not features:**
"Look pro, get discovered, monetize faster."
First 20–50 athletes are more important than vanity traffic — they become your proof.

---

## Build Order (Highest-Probability Roadmap)

1. ✅ Landing page + real waitlist (DONE)
2. ✅ Auth + admin dashboard (DONE)
3. 🔜 **Athlete onboarding** — sign-up flow, profile creation
4. 🔜 **Public athlete card** — `athleteos.app/username`
5. 🔜 **First monetization feature** — tips or paid link blocks
6. 🔜 **AI Bio Builder + Sponsor Pitch Writer**
7. 🔜 **Subscription/paywall + usage metering**
8. 🔜 **God Mode admin** — billing, moderation, usage visibility
9. 🔜 **Analytics + refinement**
10. 🔜 **Fan memberships**
11. 🔜 **Brand-side tools** (later)

**Rule:** Do not start with a full marketplace. Start with a useful single-player
product that already helps one athlete make money or look sponsor-ready.

---

## Operating Rules

1. **Keep scope brutally narrow at first.**
2. **Every feature must answer:** "Does this help an athlete make money, look more professional, or save meaningful time?"
3. **Treat AI usage like inventory** — meter it and gate it.
4. **Build billing, moderation, and usage visibility into God Mode from the beginning.**
5. **Focus on conversion metrics:** profile completion, CTA clicks, upgrade rate, revenue per athlete, activation time.

**Your advantage** is not inventing NIL. Your advantage is combining custom-stack execution with a stronger product thesis: identity + monetization + structured AI + admin control.

---

## Failure Points to Avoid

| Risk | Mitigation |
|------|-----------|
| Building too much before getting athlete usage | Ship the card fast, then iterate |
| Making AI expensive without enough monetization | Meter AI strictly, monetize from day one |
| Starting with a marketplace before supply exists | Single-player product first |
| Weak onboarding that fails to make athlete look good fast | Concierge onboarding for early users |
| No proof of revenue for the user (kills retention) | Track and show earnings from day one |

**Counter strategy:** Ship the card fast → Add one monetization win fast →
Add AI only where it leads to visible output → Track upgrades and earnings
from day one → Use concierge/manual operations behind the scenes early.

---

## Mission Statement

> **Build the default business identity for ambitious athletes who want to turn attention into income.**

Not "build an app." Not "an NIL AI tool." Not "a digital card startup."
The default business identity for athletes who take their career seriously.

---

## Reference

| Document | What it covers |
|----------|---------------|
| `CONTEXT.md` | Product/brand context, target users, positioning |
| `ROADMAP.md` | Implementation phases with status |
| `DECISIONS.md` | Architecture decision records |
| `VISION.md` | This file — master strategic blueprint |

---

Last updated: 2026-06-08
