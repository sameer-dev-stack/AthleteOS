# COMPONENTS.md — Component Reference

> Every component in `components/`, what it does, where it's used, and its props.

---

## Motion Primitives (`components/motion/`)

These are the reusable animation building blocks. All are `"use client"`. All respect `prefers-reduced-motion`.

### `<SmoothScroll>` — `components/smooth-scroll.tsx`
Wraps the app with Lenis smooth scroll. Hooks anchor link clicks to glide instead of jump.
- **Used by:** `app/layout.tsx` (single use, wraps `children`)
- **Props:** `children: React.ReactNode`
- **No props beyond children.** Lenis config is hardcoded inside.

### `<Reveal>` — `components/motion/reveal.tsx`
Single-element scroll-triggered fade + blur + lift entrance.
- **Props:**
  - `children: ReactNode`
  - `delay?: number` — seconds (default 0)
  - `y?: number` — pixels to lift from (default 24)
  - `amount?: number` — viewport amount to trigger (0–1, default 0.2)
  - `as?: "div" | "section" | "span" | "li" | "h2" | "h3" | "p"` — tag wrapper (default `"div"`)
  - `className?: string`

### `<RevealStagger>` — same file
Parent orchestrator for staggered child reveals.
- **Props:**
  - `children: ReactNode` — should contain `<RevealItem>`s
  - `staggerChildren?: number` — seconds (default 0.08)
  - `delayChildren?: number` — seconds (default 0)
  - `amount?: number` — default 0.2
  - `className?: string`

### `<RevealItem>` — same file
Child of `<RevealStagger>`. Inherits parent's timing.
- **Props:**
  - `children: ReactNode`
  - `y?: number` — pixels to lift (default 20)
  - `className?: string`

### `<Magnetic>` — `components/motion/magnetic.tsx`
Wraps an element to magnetically follow the cursor with spring physics. Use on primary CTAs.
- **Props:**
  - `children: ReactNode`
  - `strength?: number` — pull factor (default 0.35; 0.15–0.3 is typical)
  - `className?: string`

### `<Tilt>` — `components/motion/tilt.tsx`
3D perspective tilt that tracks cursor. Optional sheen overlay on top.
- **Props:**
  - `children: ReactNode`
  - `max?: number` — max rotation degrees (default 12; use 4–9 for subtle, 12+ for showy)
  - `scale?: number` — hover scale (default 1.02)
  - `perspective?: number` — CSS perspective px (default 1200)
  - `sheen?: boolean` — show cursor-following highlight (default true)
  - `className?: string`

### `<Counter>` — `components/motion/counter.tsx`
Number that counts up from 0 when scrolled into view.
- **Props:**
  - `to: number` — final value
  - `duration?: number` — seconds (default 1.8)
  - `prefix?: string` — e.g. `"$"`
  - `suffix?: string` — e.g. `"+"`
  - `format?: (n: number) => string` — custom formatter (defaults to `n.toLocaleString()`)
  - `className?: string`

### `<Spotlight>` — `components/motion/spotlight.tsx`
Cursor-following radial glow inside a container. Use on cards.
- **Props:**
  - `children: ReactNode`
  - `size?: number` — glow diameter in px (default 320)
  - `color?: string` — RGBA string (default `"rgba(198, 255, 61, 0.12)"`)
  - `className?: string`

### `<TypingText>` — `components/motion/typing-text.tsx`
Typewriter effect that cycles through an array of words with a blinking cursor. Respects `prefers-reduced-motion` (shows first word statically).
- **Props:**
  - `words: string[]` — words to cycle through
  - `className?: string`
  - `speed?: number` — ms per character typed (default 80)
  - `deleteSpeed?: number` — ms per character deleted (default 50)
  - `pauseDuration?: number` — ms pause at full word before deleting (default 2200)

### `<FloatingElements>` — `components/motion/floating-elements.tsx`
Decorative floating icons ($, NIL, %, 0x) scattered around the hero. Hidden on mobile, animated with framer-motion. Respects `prefers-reduced-motion`.
- **Props:** none

### `<AnimatedGradientBg>` — `components/motion/animated-gradient-bg.tsx`
Animated radial gradient blobs that drift slowly behind the hero. Respects `prefers-reduced-motion`.
- **Props:** none

### `<SocialProofAvatars>` — `components/motion/social-proof-avatars.tsx`
Row of 5 overlapping athlete avatar circles with stagger-in animation. Each has a hover tooltip showing the athlete's name.
- **Props:** none

---

## Section Components (`components/`)

Composed top-to-bottom in `app/page.tsx`.

### `<AnnouncementBar />` — `components/announcement-bar.tsx`
Thin top strip with beta signal + "Claim your spot" link.
- Server component. No props.

### `<Navbar />` — `components/navbar.tsx`
Sticky nav. Background blurs after `scrollY > 16`. Includes mobile hamburger menu with AnimatePresence slide animation.
- Client component. No props.
- State: `scrolled`, `open`
- Nav links: Product, How it works, AI, Pricing, FAQ

### `<Hero />` — `components/hero.tsx`
Main top section. Animated gradient background, floating decorative elements, typing-effect headline, social proof avatars with hover tooltips, trust badges, glow CTA, athlete card mockup.
- Server component (wraps client motion primitives).
- Contains `<Reveal>`, `<CardFlip>`, `<AnimatedGradientBg>`, `<FloatingElements>`, `<TypingText>`, `<SocialProofAvatars>`, `<TrustBadge>`, `<HeroCta>`, `<LiveWaitlistCount>`.

### `<AthleteCard />` — `components/athlete-card.tsx`
The product hero mockup. Phone-frame style with verified badge, stats, action tiles, latest highlight. Three floating receipts (brand deal, AI bio, tip notification) translate forward on Z-axis so they pop in 3D when the parent `<Tilt>` rotates.
- Server component. No props.
- Uses `transformStyle: preserve-3d` to enable 3D layering for floating elements.

### `<CardFlip />` — `components/card-flip.tsx`
Hover-activated hero card that replaces `<AthleteCard>` + `<Tilt>` in the landing page hero. On hover, three floating notification overlays fade in (AI Bio draft, tip notification, brand deal) with staggered delays. Main card lifts with enhanced glow.
- Client component (uses `useState`).
- State: `hovered`
- Used by: `components/hero.tsx`

### `<TrustStrip />` — `components/trust-strip.tsx`
Animated marquee of sport categories.
- Server component (wraps `<Reveal>`).
- Sport list hardcoded in `TRUST_ITEMS` array. Duplicated for infinite loop illusion.

### `<Problem />` — `components/problem.tsx`
4-cell grid of pain points (with `dangerouslySetInnerHTML` for HTML entities like `&rsquo;`).
- Server component.
- Wraps cards in `<Spotlight>` for cursor-follow glow.

### `<Solution />` — `components/solution.tsx`
Left: 4 pillar bullets. Right: a live profile preview card showing what athletes get.
- Server component.
- Right card wrapped in `<Tilt>` (no sheen, subtle 6° max).

### `<Features />` — `components/features.tsx`
9-tile bento grid (1 large + 8 smaller) showing product features.
- Server component.
- Each card uses `<Spotlight>` + hover lift.
- Internal `<FeatureCard>` helper.

### `<HowItWorks />` — `components/how-it-works.tsx`
4-step numbered process. Each step has `<Spotlight>` and ghost-number that lights up on hover.
- Server component.

### `<AIFeatures />` — `components/ai-features.tsx`
Left: copy + "free has limits" callout. Right: 4 AI tool cards + sample sponsor pitch panel.
- Server component.
- Tool cards use `<Spotlight>`. Sample pitch panel uses `<Tilt>`.

### `<Monetization />` — `components/monetization.tsx`
Left: 6 revenue stream tiles. Right: dashboard mockup with animated SVG chart + activity feed. Section has `id="monetize"`.
- Server component.
- Chart path uses CSS `animation: draw 2.5s ease-out forwards` w/ `stroke-dasharray` (keyframe defined in `globals.css`).
- Big numbers use `<Counter>`.

### `<Pricing />` — `components/pricing.tsx`
3-tier teaser (Free, Pro, Team). Pro card has the accent glow ring + "Most popular" badge.
- Server component.
- Each plan wrapped in `<Spotlight>` + `<Magnetic>` on CTA buttons.

### `<FAQ />` — `components/faq.tsx`
Accordion with 7 questions. Smooth height + opacity expansion via `<AnimatePresence>`. Icon toggles between Plus/Minus (no rotation animation).
- Client component (uses `useState`).
- State: `open: number | null`

### `<FinalCTA />` — `components/final-cta.tsx`
Big email-capture panel with backdrop grid + glowing accent orbs. Form swaps to success state via `<AnimatePresence>` with spring-in checkmark.
- Client component.
- State: `email`, `submitted`
- Form is **visual only** — `onSubmit` just flips `submitted` to `true`. No backend call.

### `<Footer />` — `components/footer.tsx`
Premium footer with:
- "Still scrolling?" mini-CTA strip + magnetic button
- Brand block + description + newsletter pill + magnetic socials
- 4 link columns (Product, For, Company, Resources)
- Status row with ping animation
- **`<ParallaxWordmark>`** — cinematic giant ATHLETEOS wordmark that drifts with mouse position (springed) and lights up in accent on hover
- Client component.

### `<Logo />` — `components/logo.tsx`
The small brand mark: lime square with a chart/bolt SVG glyph.
- Server component.
- **Props:** `className?: string` (for sizing overrides, merged via `cn()`), `style?: React.CSSProperties` (for dynamic background colors)

### `<PublicCard />` — `components/public-card.tsx`
The public-facing athlete card rendered at `/username`. Premium dark design with avatar, name + verified badge, sport/school/position, bio, stats grid, action links (tip + book), social links, highlights, and AthleteOS branding footer. Includes copy-link and native-share controls; native `navigator.share` is used when available, with clipboard fallback when unavailable. No QR renderer is included because no QR dependency exists in `package.json`.
- Client component (uses `useState` for copy/share feedback).
- **Props:** `profile: Profile`

### `<ProfileCard />` — `components/profile-card.tsx`
Premium flip-style public profile card with front/back faces. Features:
- Front: photo hero with AthleteOS logo overlay and top-bar Pro/Team plan badge, identity (name, verified badge, class year chip, sport/position/school, views/followers), unified 2x2 stats grid (NIL score + up to 3 stats)
- Back: bio, expandable links, highlight videos, Connect section (social icons + card share row separated by hairline rules), Contact/Inquiry buttons in a 2-column row, full-width "Support [Name]" tip CTA
- Framer Motion spring-based 3D flip animation with auto-return timer
- Rotating glow border via conic-gradient animation
- Photo carousel for multi-photo profiles
- **Used by:** `app/[username]/page.tsx`
- **Props:** `{ profile: Profile; totalViews?: number; totalFollowers?: number; nilScore?: number | null }`

### `<CardSection>` — `components/card-sections.tsx`
Reusable entrance animation wrapper using Framer Motion. Fades in and slides up with configurable delay.
- **Props:** `children: ReactNode`, `className?: string`, `delay?: number`

### `<StatItem>` — `components/card-sections.tsx`
Stats grid cell with icon, label, and value. Supports placeholder mode for empty states.
- **Props:** `value: string`, `label: string`, `accent: string`, `index: number`, `placeholder?: boolean`

### `<LinkCard>` — `components/card-sections.tsx`
Link card with icon, label, and arrow. Supports placeholder mode for empty states.
- **Props:** `label: string`, `url: string`, `accent: string`, `index: number`, `onClick?: () => void`, `placeholder?: boolean`

### `<HighlightCard>` — `components/card-sections.tsx`
Highlight/video card with play icon, title, and external link. Supports placeholder mode.
- **Props:** `title: string`, `url: string`, `accent: string`, `index: number`, `onClick?: () => void`, `placeholder?: boolean`

### `<InterestChip>` — `components/card-sections.tsx`
Interest tag chip with label. Supports placeholder mode with dashed border.
- **Props:** `label: string`, `accent: string`, `index: number`, `placeholder?: boolean`

### `<PhotoGallery>` — `components/photo-gallery.tsx`
Swipeable photo gallery with dot indicators. Supports multiple images with touch/swipe navigation.
- **Props:** `images: string[]`, `alt: string`, `accent: string`

### `<ShareSheet>` — `components/dashboard/share-sheet.tsx`
5-button share surface: native share + Copy + X/Twitter + WhatsApp + Email. Button class matches referral-card.tsx (`bg-accent/10 ... text-accent`).
- **Used by:** `components/dashboard/referral-card.tsx`, `app/dashboard/referrals/client.tsx`
- **Props:** `{ link: string; text: string }`

### `buildShareText()` — `lib/referral-display.ts`
Pure helper returning share copy string. Optionally personalized with referrer name.
- `buildShareText()` → `"Claim your free athlete card on AthleteOS"`
- `buildShareText("Ava")` → `"Ava invited you to Claim your free athlete card on AthleteOS"`

### `<AnalyticsPanel />` — `components/dashboard/analytics-panel.tsx`
Dashboard analytics panel for published profiles. Shows total views, unique visitors, link clicks, views-by-day bar chart, top referrers, top links, and top countries with 7d/30d/90d range controls.
- Client component (uses `useState` + `useEffect`).
- **Props:** `athleteId: string`

---

## UI Layer (`components/ui/`)

Currently empty. Reserved for shadcn-style atomic UI if/when introduced (e.g., `button.tsx`, `input.tsx`, `dialog.tsx`). Today, button styles live as Tailwind component classes (`.btn-primary`, `.btn-ghost` in `globals.css`).

---

## Utilities (`lib/`)

### `lib/utils.ts`
- `cn(...inputs: ClassValue[]) => string` — `clsx` + `tailwind-merge`. Use for combining conditional Tailwind classes safely.

### `lib/resend.ts`
- `resend` — Resend client instance configured with `RESEND_API_KEY`.

### `lib/storage.ts`
- `getStorage(): Promise<Storage>` — Returns Supabase Postgres storage (prod) or file-based storage (local dev).
- `Storage` interface: `addEmail(set, email, source?)`, `getCount(set)`, `isRateLimited(key, windowSec, max)`, `mode`.

### `lib/supabase/client.ts`
- `createClient()` — Browser client for client components.

### `lib/supabase/server.ts`
- `createClient()` — Server client for Server Actions and route handlers.

### `lib/supabase/middleware.ts`
- `updateSession(request: NextRequest)` — Refreshes Supabase session on every request.

### `lib/admin.ts`
- `ADMIN_EMAILS: string[]` — Canonical list of admin emails (single source of truth).
- `isAdmin(email: string | undefined): boolean` — Checks if an email is in the admin list.

### `lib/stripe.ts`
- `getStripe(): Stripe` — Lazy-initialized Stripe client singleton.
- `stripe: Stripe` — Proxy that defers to `getStripe()` on first access. Prevents build-time errors when `STRIPE_SECRET_KEY` is empty.

### `lib/profile-score.ts`
- `getProfileScore(profile: Profile): number` — Calculates weighted profile completion score (0-100).
- `PROFILE_FIELDS: ProfileField[]` — Weighted field definitions for scoring.

### `lib/actions/auth.ts`
- `signUp(prev, formData)` — Creates a new user account via Supabase Auth, then generates a confirmation token, stores it in `profiles.confirmation_token` with 24h expiry, and sends a confirmation email via Resend (`/api/auth/confirm-email`). Returns `{ ok, message, email }`.
- `signIn(prev, formData)` — Signs in with email/password. Returns "Email not confirmed" error when Supabase auth user is unconfirmed.
- `signInWithGoogle()` — Initiates Google OAuth flow.
- `signOut()` — Signs out and redirects to home.
- `resendConfirmationEmail(email)` — Looks up profile by email, generates a new token, stores it with 24h expiry, and sends confirmation email via Resend. Does not use `supabase.auth.resend()`.
- `getCurrentUser()` — Returns the current authenticated user.

### `lib/actions/emails.ts`
- `generateToken()` — Returns a random UUID token for email confirmation.
- `sendConfirmationEmail(email, token, confirmPath?)` — Sends a confirmation email via Resend API. Default path is `/api/confirm-waitlist`; pass `/api/auth/confirm-email` for account confirmation. Returns `{ ok, error? }`.

### `lib/actions/stripe.ts`
- `createStripeConnectLink(username: string)` — Creates Stripe Express onboarding link for athlete (5% platform fee).
- `getStripeDashboardLink(username: string)` — Creates Stripe Express login link.

### `lib/actions/stripe-status.ts`
- `getStripeStatus()` — Returns webhook endpoint health, last event, recent errors, total events. Admin-only, reads from `audit_log` table. No secrets exposed.

### `lib/stripe-billing.ts`
- `createCheckoutSession({ userId, email, tier })` — Creates Stripe Checkout session for Pro or Elite subscription.
- `createCustomerPortalSession({ customerId })` — Creates Stripe Customer Portal session for subscription management.
- `getSubscriptionByUserId(userId)` — Returns subscription status, tier, period end, customer ID from Stripe + profiles table.

### `lib/actions/profile.ts`
- `updateProfile(username: string, data: ProfileFormData)` — Updates profile with full Zod validation (all fields optional, URL validation on social/links).

### `lib/actions/billing.ts`
- `createCheckoutSessionAction(formData)` — Creates Stripe Checkout session (Zod validated tier: "pro" | "elite").
- `createPortalSessionAction()` — Opens Stripe Customer Portal for subscription management.
- `cancelSubscriptionAction()` — Sets `cancel_at_period_end` on active subscription for graceful downgrade.
- `getSubscriptionStatus()` — Returns combined subscription status + AI quota (plan, status, periodEnd, aiUsed, aiLimit, aiRemaining).

### `lib/actions/analytics.ts`
- `trackView(athleteId)` — Hashes viewer IP with SHA-256 + salt, deduplicates per athlete per 24h window, inserts into `page_views`. Returns `{ ok, deduped }`.
- `trackLinkClick(athleteId, linkLabel, linkUrl)` — Hashes viewer IP, inserts into `link_clicks`. Returns `{ ok }`.
- `getAnalytics(athleteId, range)` — Returns aggregated analytics: totalViews, uniqueVisitors, totalClicks, topReferrers, geoBreakdown, viewsByDay, topLinks. All hashing and aggregation server-side; raw IP never exposed.

### `lib/actions/admin.ts`
- `getWaitlistEntries()` — Fetches all waitlist entries (admin only).
- `getWaitlistCount()` — Returns waitlist count (admin only).
- `getNewsletterCount()` — Returns newsletter count (admin only).
- `exportWaitlistCsv()` — Exports waitlist as CSV string.
- `listUsers(search?, page?, pageSize?)` — Paginated user list with optional search.
- `getAuditLogs(page?, pageSize?)` — Paginated audit log entries.
- `viewUser(userId)` — Full user profile + Stripe subscription status.
- `updateUserPlan(userId, plan)` — Change user plan (rate-limited).
- `toggleUserStatus(userId, active)` — Suspend/activate user (rate-limited).
- `logAdminAction(action, targetType, targetId?, metadata?)` — Write audit log entry.
- `getAdminConfig()` — Read `admin-config.json` from project root, returns null if absent.

---

## God Mode Admin Components (`components/admin/god-mode/`)

Premium Vite-ported admin modules. All are `"use client"`. All fetch data from `/api/admin/*` catch-all route.

### `<UserManagement>` — `components/admin/god-mode/UserManagement.tsx`
Full user management with search, pagination, detail modal, and admin actions. Features:
- Paginated user list with debounced search across name, email, username
- Detail modal with profile overview, admin overrides, activity timeline, and quick actions
- Actions: suspend/unsuspend (requires reason), verify/revoke badge, publish/unpublish, plan override (free/pro/elite), role change (user/admin)
- Toast notifications for success/error feedback on all actions
- Confirmation modal with loading state and "Processing..." spinner during async operations
- **Used by:** `components/admin/admin-shell.tsx` (Users tab)
- **Props:** none
- **State:** `users`, `selectedProfileId`, `modalOpen`, `modalConfig`, `reason`, `toast`, `actionLoading`

### `<AbuseDashboard>` — `components/admin/god-mode/AbuseDashboard.tsx`
Abuse detection and rate limit monitoring. Displays flagged accounts, suspicious activity patterns, and rate limit violations.
- **Used by:** `components/admin/god-mode/` (Abuse tab)
- **Props:** none

### `<AuditLogViewer>` — `components/admin/god-mode/AuditLogViewer.tsx`
Paginated audit log viewer with filtering by action type and date range. Shows actor, target, metadata, and timestamp.
- **Used by:** `components/admin/admin-shell.tsx` (Audit tab)
- **Props:** none

### `<FinancialsMonitor>` — `components/admin/god-mode/FinancialsMonitor.tsx`
Platform revenue dashboard showing total revenue, tip volume, Stripe Connect status, payout summaries, and recent transactions. Highest-value admin module — platform revenue, tip totals, and Stripe Connect compliance flow through it.
- **Used by:** `components/admin/admin-shell.tsx` (Financials tab)
- **Props:** none

### `<ComplianceQueue>` — `components/admin/god-mode/ComplianceQueue.tsx`
NIL deal disclosure review queue. Shows pending deals awaiting admin clearance, cleared/rejected history, and bulk action controls.
- **Used by:** `components/admin/admin-shell.tsx` (Compliance tab)
- **Props:** none

### `<UsageMonitor>` — `components/admin/god-mode/UsageMonitor.tsx`
AI usage monitoring dashboard. Displays per-plan quota consumption, active users, tool breakdown, and quota exhaustion alerts.
- **Used by:** `components/admin/admin-shell.tsx` (Usage tab)
- **Props:** none

### `<AnalyticsOverview>` — `components/admin/god-mode/AnalyticsOverview.tsx`
Platform-wide analytics overview. Aggregate views, clicks, referrers, geographic distribution, and growth trends across all athlete cards.
- **Used by:** `components/admin/admin-shell.tsx` (Analytics tab)
- **Props:** none

### `<PlatformSettings>` — `components/admin/god-mode/PlatformSettings.tsx`
Platform configuration panel. Feature flags, system toggles, maintenance mode controls, and platform-wide settings.
- **Used by:** `components/admin/admin-shell.tsx` (Settings tab)
- **Props:** none

### Types — `components/admin/god-mode/types.ts`
Shared type definitions for all god-mode modules: `Profile`, `AuditLog`, `NilDeal`, `RateLimit`, and other admin-specific interfaces.

### API Client — `components/admin/god-mode/supabase.ts`
Frontend API client for admin endpoints. Maps god-mode module calls to `/api/admin/*` catch-all route. Not an actual Supabase client — uses `fetch` against the Next.js route handler.

---

## Legacy Admin Components (`components/admin/`)

### `<AdminShell>` — `components/admin/admin-shell.tsx`
Full admin workspace layout with sidebar navigation and content area. Sidebar has: Logo + brand mark, nav items (Dashboard, Users, Waitlist, Audit, Settings), user card with email and sign out. Main pane renders stat cards (Dashboard), AdminTabs (Users/Waitlist/Audit), or AdminSettings (Settings). Manages active nav state client-side.
- **Used by:** `app/admin/page.tsx`
- **Props:**
  - `user: { email: string; id: string }` — current admin user
  - `stats: { totalUsers: number; waitlistCount: number; newsletterCount: number; activeUsers: number }` — dashboard metrics

### `<AdminTabs>` — `components/admin/admin-tabs.tsx`
Tab navigation component for the admin dashboard. Switches between Dashboard, Users, Waitlist, Audit Log, and Settings views. Active tab highlighted with accent color. Accepts `initialTab` to set default active tab from parent.
- **Used by:** `components/admin/admin-shell.tsx`, `app/admin/page.tsx`
- **Props:** `initialTab?: "dashboard" | "users" | "waitlist" | "audit" | "settings"` (default: "users")
- **State:** `activeTab`

### `<AdminSettings>` — `components/admin/admin-settings.tsx`
Admin settings panel showing platform status (connected services), admin access info, and quick links to operational dashboards. Accepts optional `user` prop for AdminShell compatibility.
- **Used by:** `components/admin/admin-tabs.tsx`, `components/admin/admin-shell.tsx`
- **Props:**
  - `user?: { email: string; id: string }` — current admin user (optional, shows account info when provided)

### `<UserTable>` — `components/admin/user-table.tsx`
Full user management table with debounced search (email, name, username), server-side pagination (20/page), and inline action dropdown. Actions: view user details (modal), change plan (free/pro/elite), suspend/unsuspend. Mutations call `updateUserPlan()` and `toggleUserStatus()` server actions with optimistic local state updates.
- **Used by:** `components/admin/admin-tabs.tsx`
- **Props:** none
- **Features:** Search, pagination, plan dropdown, suspend toggle, detail modal with full profile + Stripe status

### `<AuditLog>` — `components/admin/audit-log.tsx`
Paginated audit log table showing recent admin actions. Columns: action badge (color-coded), actor ID, target details, metadata, timestamp. Uses `getAuditLogs()` server action.
- **Used by:** `components/admin/admin-tabs.tsx`
- **Props:** none
- **Features:** Pagination, action badges with icons, target rendering

### `<WaitlistTable>` — `components/admin/waitlist-table.tsx`
Client component that displays the waitlist in a searchable table with CSV export.
- **Used by:** `components/admin/admin-tabs.tsx`
- **Props:** none
- **Features:** Search by email, CSV export, confirmed/pending status badges, loading state, and empty state for no entries

### `<SignOutButton>` — `components/admin/sign-out-button.tsx`
Client component that renders a sign out button.
- **Used by:** `components/admin/sign-out-button.tsx` (standalone), also inline sign out in `AdminShell`
- **Props:** none

---

### `<DashboardContent>` — `components/dashboard/dashboard-content.tsx`
Client wrapper for the authenticated dashboard. Lifts profile state so profile edits and AI-generated bio drafts stay in sync across `DashboardEditor` and `AIToolkit`. Conditionally renders `AnalyticsPanel` when `profile.profile_published` is true.
- **Used by:** `app/dashboard/page.tsx`
- **Props:**
  - `profile: Profile`
  - `quota: { used: number; limit: number; remaining: number; plan?: string }`
  - `subscription: SubscriptionStatus`

---

## Avatar & Profile Components

### `<AvatarUpload>` — `components/avatar-upload.tsx`
Reusable avatar upload with camera overlay, file preview, and Supabase Storage integration.
- **Used by:** `app/onboarding/page.tsx`
- **Props:**
  - `currentUrl: string | null` — current avatar URL
  - `userId: string` — user ID for storage path
  - `onUpload: (url: string) => void` — callback with new URL
  - `size?: "sm" | "md" | "lg"` — avatar size (default "md")

### `<DashboardAvatar>` — `components/dashboard-avatar.tsx`
Dashboard wrapper for AvatarUpload. Saves directly to profile.
- **Used by:** `app/dashboard/page.tsx`
- **Props:**
  - `userId: string`
  - `avatarUrl: string | null`
  - `fullName: string | null`

### `<TipButton>` — `components/tip-button.tsx`
Stripe-powered tip button with preset amounts ($5, $10, $25, $50) and glass morphism bottom sheet modal. Solid lime gradient with heart icon on the card; full modal with amount selection on tap.
- **Used by:** `components/profile-card.tsx`
- **Props:**
  - `athleteId: string` — athlete profile ID
  - `athleteName: string` — athlete name for display
  - `accentColor?: string` — theme accent color (default "#C6FF3D")

### `<ProfileCard />` — `components/profile-card.tsx`
Premium standard-sized (360x504px) interactive trading card with 3D flip animation.
- **Front Face**: Rotating photo carousel with crossfade transitions and page indicators (for profiles with multiple photos), name, sport/position badge, school, 3 key stats in a compact grid, verified/plan badges overlay, and flip hint.
- **Back Face**: Detailed information section containing bio, social links, external links, highlights video pills, contact button, and Stripe Connect tip button.
- **Features**: Smooth 3D spring card-flip animation via Framer Motion, 10-second idle return timer to front face, stopPropagation on interaction buttons/links to prevent card flipping.
- **Used by:** `app/[username]/page.tsx`
- **Props:** `{ profile: Profile }`
- **State:** `flipped`, `copied`, `photoIdx`, `hintVisible`

---

## Dashboard Components (`components/dashboard/`)

### `<DashboardEditor>` — `components/dashboard/profile-editor.tsx`
Tabbed profile editor with 7 sections (Bio, Stats, Links, Social, Highlights, Contact, Theme). Client component with local form state and optimistic save via `updateProfile` server action. Theme tab includes `<ThemePicker>` for accent color and layout customization.
- **Used by:** `app/dashboard/page.tsx`
- **Props:**
  - `profile: Profile` — current profile data
  - `onSaved?: (profile: Profile) => void` — optional callback when profile is saved (used for syncing parent state)

### `<AnalyticsPanel>` — `components/dashboard/analytics-panel.tsx`
Dashboard analytics panel for published profiles. Shows total views, unique visitors, link clicks, views-by-day bar chart, top referrers, top links, and top countries with 7d/30d/90d range controls.
- **Used by:** `components/dashboard/dashboard-content.tsx`
- **Props:**
  - `athleteId: string`

### `<ProfileScore>` — `components/dashboard/profile-score.tsx`
Profile completion score with circular progress indicator and breakdown of completed fields.
- **Used by:** `app/dashboard/page.tsx`
- **Props:**
  - `profile: Profile` — current profile data

### `<AIBioBuilder>` — `components/dashboard/ai-bio-builder.tsx`
AI-powered bio generator. Form with Sport, School, Position (pre-filled from profile) and Tone dropdown. Generates 3 polished bio variations via Google Gemini. Each result has "Use this draft" (saves to profile and syncs the dashboard profile state) and "Copy" buttons.
- **Used by:** `components/dashboard/ai-toolkit.tsx`
- **Props:**
  - `profile: Profile` — current profile data (for pre-filling form and passing existing bio)
  - `onQuotaChange: (quota) => void` — callback to update parent quota state
  - `onProfileChange: (profile) => void` — callback to sync the parent profile state after applying a draft
  - `disabled: boolean` — disables generation when quota exhausted

### `<AIPitchWriter>` — `components/dashboard/ai-pitch-writer.tsx`
AI-powered sponsor pitch writer. Form with Brand name, Audience size, Engagement rate, Goal. Sport/school/position pre-filled from profile. Generates 3 pitch variations with subject lines + 3-paragraph bodies. Each output has "Use this draft" (copies to clipboard) and "Copy".
- **Used by:** `components/dashboard/ai-toolkit.tsx`
- **Props:**
  - `profile: Profile` — current profile data
  - `onQuotaChange: (quota) => void` — callback to update parent quota state
  - `disabled: boolean` — disables generation when quota exhausted

### `<AICaptionGenerator>` — `components/dashboard/ai-caption-generator.tsx`
AI-powered social caption generator. Form with Post context (win/sponsorship/training/milestone/personal) and Tone dropdown. Generates 3 captions with hashtags. Each output has "Use this draft" (copies to clipboard) and "Copy".
- **Used by:** `components/dashboard/ai-toolkit.tsx`
- **Props:**
  - `profile: Profile` — current profile data
  - `onQuotaChange: (quota) => void` — callback to update parent quota state
  - `disabled: boolean` — disables generation when quota exhausted

### `<AIProfileOptimizer>` — `components/dashboard/ai-profile-optimizer.tsx`
AI-powered profile analysis. One-click scans current profile and returns scored critique, optimized bio (under 280 chars), and 3-5 actionable suggestions. "Apply optimized bio" button saves to profile.
- **Used by:** `components/dashboard/ai-toolkit.tsx`
- **Props:**
  - `profile: Profile` — current profile data
  - `onQuotaChange: (quota) => void` — callback to update parent quota state
  - `disabled: boolean` — disables generation when quota exhausted

### `<AIRateHelper>` — `components/dashboard/ai-rate-helper.tsx`
AI-powered NIL pricing guidance. Form with Audience size, Engagement rate, Niche, Past deals. Generates structured pricing guidance with specific dollar ranges and disclaimer. Copy button.
- **Used by:** `components/dashboard/ai-toolkit.tsx`
- **Props:**
  - `profile: Profile` — current profile data
  - `onQuotaChange: (quota) => void` — callback to parent quota state
  - `disabled: boolean` — disables generation when quota exhausted

### `<AIToolkit>` — `components/dashboard/ai-toolkit.tsx`
Unified parent component for all AI tools. Tab navigation across Bio Builder, Pitch Writer, Captions, Optimizer, Rate Helper, and **Vault**. Shows visible quota state and passes updated quota back to children after each successful generation. Upgrade prompt appears when exhausted. Vault tab shows saved asset count badge.
- **Used by:** `app/dashboard/ai/client.tsx`
- **Props:**
  - `profile: Profile` — current profile data
  - `quota: { used: number; limit: number; remaining: number; plan?: string }` — initial AI quota from `getAiQuota()`
  - `onProfileChange: (profile) => void` — syncs parent profile state after a bio draft is used
  - `savedAssetsCount?: number` — count of saved assets for vault tab badge

### `<AiAssetVault>` — `components/dashboard/ai-asset-vault.tsx`
Full-featured vault for saved AI-generated outputs. Filter tabs (All/Bio/Pitch/Caption/Optimize/Rate), asset cards with tool-type badges, inline editing, copy-to-clipboard, star toggle, delete with confirmation. Empty state when no assets saved.
- **Used by:** `components/dashboard/ai-toolkit.tsx` (Vault tab)
- **Props:**
  - `profile: Profile` — current profile data

### `<QRShareModal>` — `components/dashboard/qr-share-modal.tsx`
Glassmorphic modal for sharing athlete profile via QR code. Generates QR using `qrcode` package on a canvas element. Features Copy Link and Download PNG buttons. Backdrop blur consistent with dashboard UI.
- **Used by:** `components/dashboard/profile-card.tsx`, `components/dashboard/overview.tsx`
- **Props:**
  - `open: boolean` — controls modal visibility
  - `onClose: () => void` — callback to close modal
  - `profileUrl: string` — the public profile URL to encode in the QR

### `<ThemePicker>` — `components/dashboard/theme-picker.tsx`
Profile card theme customization interface. Allows selection of accent color (5 options: lime, cyan, magenta, amber, emerald) and layout style (3 options: compact, classic, wide). Live preview shows bottom-sheet card layout with selected accent. Save button disabled when no changes. Calls `updateTheme()` server action and invokes `onSaved` callback with updated profile data.
- **Used by:** `components/dashboard/profile-editor.tsx` (Theme tab)
- **Props:**
  - `profile: Profile` — current profile data with `theme_accent` and `theme_layout` fields
  - `onSaved: (profile: Profile) => void` — callback invoked after successful theme save

### `<TipEarnings>` — `components/dashboard/tip-earnings.tsx`
Displays athlete's tip earnings summary and payout status. Shows total tips received, tip count, and available balance via `getBalanceSummary`. Payment-method setup banner via `PaymentMethodSetup` when no payout method is set, "Manage payouts" link to `/dashboard/billing` when set. Empty state shown when no tips received yet.
- **Used by:** `components/dashboard/overview.tsx`
- **Props:**
  - `earnings?: TipEarnings | null`
  - `balance?: BalanceSummary | null`
  - `loading?: boolean`

### `<PayoutManagement>` — `components/admin/payout-management.tsx`
Admin withdrawal-request queue. Lists pending payout requests (athlete email, amount, payout method, requested time) with Mark paid / Failed actions via `updatePayoutStatus`. Shows aggregate stat cards (total tips, total revenue, requests, awaiting fulfillment) via `getAllTipsSummary`.
- **Used by:** `app/admin/*`
- **Props:** none

### `<InquiryInbox>` — `components/dashboard/inquiry-inbox.tsx`
Unified Deal Room & Business Inbox. Displays total business revenue ledger (`Tips Total + Won Deals Total`), inbound brand inquiries with a 5-stage pipeline selector (`New` → `Replied` → `Negotiating` → `Won` → `Lost`), dollar deal value input for won deals, and direct email reply links. Empty state prompts card sharing.
- **Used by:** `components/dashboard/overview.tsx`
- **Props:** none

### `<BusinessDashboard>` — `components/dashboard/business-dashboard.tsx`
Business Operations summary card for the right sidebar. Displays 7-day revenue (tips + won deals), total won deals count, active pipeline counts (new/negotiating), and quick CTA buttons ("Open Deal Room", "Share"). Clean empty state when zero revenue exists.
- **Used by:** `components/dashboard/overview.tsx`
- **Props:**
  - `themeAccent?: string` — accent color (default `"#C6FF3D"`)
  - `username?: string | null` — athlete handle for card sharing link

### `<BillingPanel>` — `components/dashboard/billing-panel.tsx`
Subscription billing panel showing current plan badge, AI usage bar, pricing cards, and upgrade/manage buttons. Integrates with Stripe Checkout for upgrades and Customer Portal for management. Includes loading states for checkout, portal, and cancel operations. Error display for failed operations. Graceful downgrade via `cancel_at_period_end`.
- **Used by:** `app/dashboard/page.tsx`
- **Props:**
  - `subscription: SubscriptionStatus` — current subscription status from `getSubscriptionStatus()` (plan, status, currentPeriodEnd, aiUsed, aiLimit, aiRemaining)

### `<AnalyticsPanel>` — `components/dashboard/analytics-panel.tsx`
Analytics display for athlete card performance. Shows 3 summary cards (total views, unique visitors, link clicks), bar chart of views by day, top referrers, top links, and top countries. Range selector (7d/30d/90d). Only rendered when profile is published.
- **Used by:** `components/dashboard/dashboard-content.tsx`
- **Props:**
  - `athleteId: string` — athlete profile ID for querying analytics

### `<EmptyState>` — `components/dashboard/empty-state.tsx`
Reusable empty state component with icon, title, description, and optional CTA button. Used across dashboard sections when no data exists yet.
- **Used by:** `components/dashboard/profile-editor.tsx`, `components/dashboard/tip-earnings.tsx`, `components/dashboard/analytics-panel.tsx`
- **Props:**
  - `icon: LucideIcon` — icon component to display
  - `title: string` — heading text
  - `description: string` — body text
  - `action?: { label: string; onClick: () => void }` — optional CTA button

### `<ShareSheet>` — `components/dashboard/share-sheet.tsx`
Reusable share surface: native share (falls back to copy), Copy, X/Twitter, WhatsApp, and Email deep links for a given referral link. `"use client"` and fully presentational — share URLs are built by the pure `buildShareLinks(link, text)` helper in `lib/share-links.ts` (TDD-covered). Button styling matches `referral-card.tsx` (`bg-accent/10 ... text-accent`). `navigator.clipboard`/`navigator.share` wrapped in try/catch; `target="_blank"` links use `rel="noopener noreferrer"`.
- **Used by (planned):** `app/dashboard/referrals/client.tsx` (T10 will swap the inline share block for this component)
- **Props:**
  - `link: string` — full referral URL to share
  - `text: string` — share message/caption

---

## Auth Pages (`app/auth/`)

### `<ReferralInviteBanner />` — `components/auth/referral-invite-banner.tsx`
Client component shown on `/auth/sign-up`. Reads the `athleteos_ref` cookie (non-httpOnly, set by middleware on `/r/[code]`) and calls `GET /api/referral/referrer?code=` to resolve the referrer's display name, then renders a pill: `"Invited by {Name}"` or the generic `"You've been invited"` fallback (`bg-accent/10`, `text-accent`, `rounded-full`). **Leak-safe (T13):** the name is sanitized through `sanitizeReferrerName` so an email-shaped `full_name` is never displayed; it falls back to the generic invite. Renders nothing when the cookie is absent or the lookup fails. No props.
- **Used by:** `app/auth/sign-up/page.tsx` (between the logo block and the `<h1>`)
- Uses the pure `buildInvitedBy()` helper from `lib/referral-display.ts`

### `<ProcessingOverlay />` — `components/auth/processing-overlay.tsx`
Client component (T14) shown as a full-screen `bg-bg` overlay during the signup submit→route transition. Renders a `text-accent` `Loader2` spinner + "Processing…". `show` prop toggles it; no props beyond `show: boolean`. Wired in `app/auth/sign-up/page.tsx` (set on submit, released only on the error path so it stays until navigation).

### `<PasswordField />` — `components/auth/password-field.tsx`
Client password input (T15) with a show/hide eye toggle (`Eye`/`EyeOff` from lucide-react). The toggle is `type="button"` (never submits), has an `aria-label`, and uses `nextPasswordInputType` from `lib/auth-copy` to flip the input type. Props: `id`, `name`, `autoComplete` (new-password on signup / current-password on signin), `placeholder`. Shared by both auth forms so they never drift.
- **Used by:** `app/auth/sign-up/page.tsx`, `app/auth/sign-in/page.tsx`

### `lib/auth-copy.ts` — `accountCreatedCopy(email)`, `nextPasswordInputType(isVisible)`, `securedNote()`
Pure, TDD-able copy/helper module (T14/T15) for the auth surface. `accountCreatedCopy` builds the verification screen wording; `nextPasswordInputType` flips the password input type for the toggle; `securedNote()` returns `"Secured by 256-bit encryption · No card required"` (rendered under each auth submit button). Keeps user-facing auth copy in one testable place.
- **Used by:** `app/auth/account-created/page.tsx`, `components/auth/password-field.tsx`, `app/auth/sign-up/page.tsx`, `app/auth/sign-in/page.tsx`

### `/api/referral/referrer` — `app/api/referral/referrer/route.ts`
Route Handler (nodejs) that resolves a referral code to the referrer's display name for the sign-up banner. Reads `?code=`, looks up `referral_codes.user_id` then `profiles.full_name` via service-role, and returns `{ name }`. **Leak-safe (T13):** the returned name is passed through `sanitizeReferrerName`, so an email-shaped `full_name` becomes `null` and never crosses the wire. Fails closed to `{ name: null }`.
- **Used by:** `components/auth/referral-invite-banner.tsx`

### `/auth/sign-up` — `app/auth/sign-up/page.tsx`
Email/password sign-up form + Google OAuth button. Calls `signUp` or `signInWithGoogle`. On success, redirects to `/auth/account-created`. Renders `<ReferralInviteBanner />` above the headline when a referral cookie is present.

### `/auth/sign-in` — `app/auth/sign-in/page.tsx`
Email/password sign-in form + Google OAuth button. Calls `signIn` or `signInWithGoogle`. On success, redirects to `/admin`.

### `/auth/callback` — `app/auth/callback/route.ts`
Handles OAuth callback (Google) and email confirmation. Exchanges code for session.

### `/auth/confirm` — `app/auth/confirm/route.ts`
Verifies email confirmation token via Supabase `verifyOtp`.

### `/auth/error` — `app/auth/error/page.tsx`
Displays authentication error messages. Rebuilt in Session 44 as a client component to handle hash-based errors (e.g., `otp_expired`) and provide an immediate "Resend Link" recovery form using the `resendVerification` server action.
- Client component.
- Features: Hash fragment parsing, specific error messaging, resend email form.

### `/auth/welcome` — `app/auth/welcome/page.tsx`
Post-confirmation welcome page with success message.

---

## Stripe Pages

### `/stripe/status` — `app/stripe/status/page.tsx`
Admin-only page showing Stripe webhook health. Displays: webhook endpoint status (configured/not), total events, successful count, error count, last event details, recent errors table, and configuration summary. Uses `getStripeStatus()` Server Action. Auth-gated to admin users only.

---

## Referral Landing Page (`app/r/[code]/`)

### `/r/[code]` — `app/r/[code]/page.tsx`
Branded referral landing page. Replaces the old bare redirect to `/auth/sign-up`. Server Component that:
- Looks up the referral code + referrer profile (service-role client, server-only)
- Sets `athleteos_ref` cookie (30d, non-httpOnly, secure in prod, sameSite lax) via `cookies().set()` during render
- Calls `trackReferralClick` with IP from `headers()` and user-agent
- Renders a dark, single-accent (#C6FF3D) landing with personalized invite ("{name} invited you to AthleteOS") or generic CTA for invalid/expired codes
- CTA `<Link>` goes to `/auth/sign-up`
- Pure helper `resolveReferrerView()` in `lib/referral-landing.ts` handles the view logic
- Uses `dynamic = "force-dynamic"` (personalized content)
- **No emojis. No second accent. Dark only.**
- **Props:** `{ params: Promise<{ code: string }> }`
- **Security:** SUPABASE_SERVICE_ROLE_KEY only referenced in this Server Component, never shipped to client

## Referral Dashboard (`app/dashboard/referrals/`)

### `/dashboard/referrals` — `app/dashboard/referrals/page.tsx` + `app/dashboard/referrals/client.tsx`
Server Component fetches four datasets in parallel (`getReferralStats`, `getReferralHistory`, `getReferralFunnel`, `getReferralLeaderboard`) and passes them as props to the presentational `"use client"` component `ReferralsPageClient`.
- **`page.tsx`:** Server Component, redirects unauthenticated users to `/auth/sign-in` via `getMyProfile()`. No client data fetching.
- **`client.tsx` (`ReferralsPageClient`):** presentational only. Renders: share link (copy + native share), stats grid, Pro status, click→conversion funnel, "How It Works", recent referrals history, and a top-referrers leaderboard. Uses pure helpers `proUntilLabel` / `statusLabel` from `lib/referral-display.ts`.
- **T10:** replace the inline share action with the reusable `<ShareSheet link text>` component (built in T9, `components/dashboard/share-sheet.tsx`). Share block is isolated, no re-architect needed.
- **Styling:** matches `components/dashboard/referral-card.tsx` classes (`rounded-2xl border border-white/[0.06] bg-[#111113]`, `text-accent`, `ink-dim`, `ink-muted`, `text-white`).
- **No emojis. No second accent. Dark only.**


---

## Public Discovery Portal (`app/discover/`)

### `<DiscoverClient>` — `app/discover/client.tsx`
Interactive athlete discovery explorer for brands and sponsors. Public (no auth required). Features:
- Sticky header with AthleteOS logo and sign-in/get-started links
- Hero section with "Find your next brand athlete" headline
- Search bar with real-time text search (350ms debounce) across name, sport, school, username
- Expandable filter panel: sport dropdown (populated from DB), school input, position input, min-followers range slider (0–100K)
- Active filter count badge on Filters toggle button
- Responsive card grid (1/2/3/4 columns) with staggered Framer Motion entrance
- Each `AthleteCard`: avatar with fallback, name, verified badge, plan badge, sport/school/position chips, bio excerpt, follower count, "View card" hover CTA
- Loading skeletons, empty state with clear-filters CTA
- Pagination with page buttons and prev/next
- Bottom CTA: "Are you an athlete? Claim your card"
- **Used by:** `app/discover/page.tsx`
- **Props:**
  - `initialAthletes: DiscoveryAthlete[]` — first page of results from server
  - `initialTotal: number` — total matching athlete count
  - `sports: string[]` — sorted list of all sports for dropdown

### `<AthleteCard>` — `app/discover/client.tsx` (internal)
Individual athlete preview card within the discovery grid. Linked to `/{username}` public profile.
- **Props:**
  - `athlete: DiscoveryAthlete` — athlete data
  - `index: number` — position in grid (for stagger animation delay)
- **Design:** `bg-[#111113]`, `border-white/[0.06]`, accent hover glow, `rounded-2xl`

---

## Composition Map (in `app/page.tsx`)

```tsx
<main>
  <AnnouncementBar />
  <Navbar />
  <Hero />
  <TrustStrip />
  <Problem />
  <Solution />
  <Features />
  <HowItWorks />
  <AIFeatures />
  <Monetization />
  <Pricing />
  <FAQ />
  <FinalCTA />
  <Footer />
</main>
```

Order is fixed and represents the conversion funnel:
1. Hook → 2. Validate (sport categories) → 3. Pain → 4. Solution → 5–9. Proof of capability → 10. Money → 11. Pricing → 12. Objection handling → 13. Final ask → 14. Brand close.

---

## Mobile Primitives (`components/mobile/`)

These are client-only components for native-feel mobile interactions. All use Framer Motion and respect `prefers-reduced-motion`.

### `<PullToRefresh>` — `components/mobile/pull-to-refresh.tsx`
Wraps page content to enable iOS-style pull-to-refresh. Shows a spinning icon and triggers a callback when the pull threshold is met.
- **Used by:** `components/dashboard/overview.tsx`
- **Props:**
  - `children: ReactNode`
  - `onRefresh: () => Promise<void>` — async function called on release past threshold
  - `threshold?: number` — pull distance in px to trigger refresh (default 80)

### `<SwipeCards>` — `components/mobile/swipe-cards.tsx`
Horizontal swipe navigation between child elements. Renders dot indicators and supports touch/swipe gestures for card carousels.
- **Used by:** `components/dashboard/overview.tsx` (metrics strip on mobile)
- **Props:**
  - `children: ReactNode[]` — each child is a swipeable slide
  - `onIndexChange?: (index: number) => void`
  - `className?: string`

### `<BottomSheet>` — `components/mobile/bottom-sheet.tsx`
iOS-style bottom sheet modal. Slides up from bottom with spring animation, supports drag-to-dismiss, backdrop blur, and safe area padding.
- **Used by:** `components/navbar.tsx` (mobile menu)
- **Props:**
  - `open: boolean`
  - `onClose: () => void`
  - `children: ReactNode`
  - `title?: string`

### `useHaptic` — `components/mobile/use-haptic.ts`
Hook providing haptic feedback via `navigator.vibrate()`. Falls back gracefully on devices without vibration support.
- **Used by:** `components/navbar.tsx`, `components/dashboard/overview.tsx`, `components/mobile/pull-to-refresh.tsx`, `components/mobile/swipe-cards.tsx`, `components/mobile/bottom-sheet.tsx`
- **Returns:**
  - `vibrate(pattern)` — raw vibration
  - `lightTap()` — 8ms tap (button presses)
  - `mediumTap()` — 15ms tap (toggles, confirmations)
  - `heavyTap()` — 25ms tap (destructive actions)
  - `success()` — short pattern (completed actions)
  - `error()` — double-pulse pattern (failures)

---

## Layout Components (`components/layout/`)

### `<Sidebar>` — `components/layout/sidebar.tsx`
Dashboard sidebar navigation with collapsible desktop mode and mobile overlay drawer. Sections are grouped by `dashboardNavSections` config. Active route highlighted with accent color and dot indicator. Includes logo, user section with avatar/initials, and sign-out button.
- **Used by:** `app/dashboard/layout.tsx`
- **Props:**
  - `profile: Profile` — current user profile
  - `email: string` — user email for display
- **State:** `collapsed` (desktop toggle), `mobileOpen` (mobile overlay)
- **Features:** Collapsible from 240px to 68px, mobile hamburger trigger, Escape key closes mobile overlay, route change auto-closes mobile

### `<Header>` — `components/layout/header.tsx`
Sticky dashboard header with breadcrumbs, search modal, notification bell, and user avatar dropdown. Breadcrumbs auto-generated from pathname using `dashboardNavItems` and `dashboardNavSections`. Search opens via Cmd+K/Ctrl+K and filters nav items.
- **Used by:** `app/dashboard/layout.tsx`
- **Props:**
  - `profile: Profile` — current user profile
  - `email: string` — user email for display
- **State:** `mobileMenuOpen`, `searchOpen`, `searchQuery`, `dropdownOpen`
- **Features:** Cmd+K search, notification dot with accent color, dropdown with profile/settings/billing links, mobile drawer navigation

### `<BottomNav>` — `components/layout/bottom-nav.tsx`
Fixed mobile bottom navigation bar with 5 tabs: Home, Analytics, AI, Profile, More. Haptic feedback on tap via `navigator.vibrate()`. Active tab shows accent-colored icon with glowing dot indicator below. Respects safe area for iPhone notch.
- **Used by:** `app/dashboard/layout.tsx` (hidden on md+ screens)
- **Props:** none
- **Features:** 8ms haptic vibration on tap, glow indicator under active tab, backdrop blur, safe-area-inset-bottom padding

---

## Error Components

### `<ErrorIllustration>` — `components/error-illustration.tsx`
Branded error page graphic. Displays error code (e.g., "404", "500") in a large accent-tinted box with subtle glow halo. Server component.
- **Used by:** `app/not-found.tsx`, `app/error.tsx`
- **Props:**
  - `code: string` — error code to display
  - `className?: string`

---

## Dashboard Components (`components/dashboard/`)

### `<SettingsPanel>` — `components/dashboard/settings-panel.tsx`
Full settings interface with 7 collapsible accordion sections: Account, Appearance, Notifications, Connected Accounts, Security, Data & Privacy, Danger Zone. Single-section open at a time. Theme section includes accent color picker (8 colors) with save. Security section has password change with show/hide toggle. Danger Zone has 3-step deletion flow with "DELETE" confirmation.
- **Used by:** `app/dashboard/settings/page.tsx`
- **Props:**
  - `profile: Profile` — current profile data
  - `user: { email?: string; id: string; created_at?: string }` — auth user
- **State:** `openSection`, `toast`, `accent`, `darkModePref`, `emailPrefs`, `newPassword`, `confirmPassword`, `showPassword`, `deleteStep`, `deleteConfirmText`
- **Features:** Accent color picker, email notification toggles, password change, data export (JSON), 3-step account deletion, toast notifications

### `<SocialAccountsEditor>` — `components/dashboard/social-accounts-editor.tsx`
Handles linking and status management of social network profiles (Instagram, TikTok, Twitter/X, YouTube). Connected platforms run asynchronous Apify scraping jobs with status polling. Private accounts trigger public profile warnings.
- **Used by:** `app/dashboard/nil/client.tsx`
- **Props:**
  - `accounts: SocialAccount[]` — connected accounts list
  - `themeAccent: string` — electric lime accent color
  - `onUpdate: () => void` — refresh callback

### `<NilMetricsStrip>` — `components/dashboard/nil-metrics-strip.tsx`
Displays analytics metrics cards (Views, Clicks, CTR, Tips Earned, Followers) with green/red trend delta indicators showing week-over-week growth or decline.
- **Used by:** `app/dashboard/nil/client.tsx`
- **Props:**
  - `cardViews: number`
  - `linkClicks: number`
  - `clickThroughRate: number`
  - `tipsAmount: number`
  - `followersTotal: number`
  - `themeAccent: string`
  - `followerDelta?: number`
  - `engagementDelta?: number`

---

## UI Components (`components/ui/`)

### `<ProfileCardSkeleton>` — `components/profile-card-skeleton.tsx`
Loading skeleton matching the ProfileCard layout. Shimmer animations on a dark background. Shown via React Suspense while the page loads.
- **Used by:** `app/[username]/page.tsx` (Suspense fallback)
- **Props:** none

### `<DashboardSkeleton>` — `components/ui/dashboard-skeleton.tsx`
Full-page skeleton loading state for the dashboard. Mirrors the exact layout of `DashboardOverview` with placeholder shapes.
- **Used by:** Can be used in `Suspense` boundaries on dashboard pages
- **Props:** None

### `<Skeleton>` / `<SkeletonCard>` / `<SkeletonCircle>` / `<SkeletonText>` — `components/ui/skeleton.tsx`
Base skeleton primitives with shimmer animation. Used throughout dashboard for loading states.
- **Used by:** `components/dashboard/overview.tsx`, `components/dashboard/todays-digest.tsx`, and many more

### `<VerificationBanner>` — `components/verification-banner.tsx`
Fixed top-center success banner shown after email verification. Reads `?verified=1` from the URL and auto-dismisses after 6s. Single accent `#C6FF3D`.
- **Used by:** `app/onboarding/page.tsx`, `app/dashboard/page.tsx`
- **Props:** none
- **Self-wraps in `<Suspense>`** so it can use `useSearchParams` in dynamic pages.

---

Last updated: 2026-07-11 (QA-002 fix)
