# Graph Report - .  (2026-06-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 672 nodes · 1214 edges · 63 communities (49 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `467d9097`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Landing Page Components|Landing Page Components]]
- [[_COMMUNITY_Analytics and Tracking|Analytics and Tracking]]
- [[_COMMUNITY_User Profile Management|User Profile Management]]
- [[_COMMUNITY_AI Content Generation|AI Content Generation]]
- [[_COMMUNITY_Memberships and Tiers|Memberships and Tiers]]
- [[_COMMUNITY_Authentication Services|Authentication Services]]
- [[_COMMUNITY_Billing and Payments|Billing and Payments]]
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_Referrals and Pro Benefits|Referrals and Pro Benefits]]
- [[_COMMUNITY_Admin Waitlist Management|Admin Waitlist Management]]
- [[_COMMUNITY_Admin Data Operations|Admin Data Operations]]
- [[_COMMUNITY_Brand and Campaign Management|Brand and Campaign Management]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Root Layout and Metadata|Root Layout and Metadata]]
- [[_COMMUNITY_Team Management|Team Management]]
- [[_COMMUNITY_Admin Dashboard Shell|Admin Dashboard Shell]]
- [[_COMMUNITY_User Moderation Tools|User Moderation Tools]]
- [[_COMMUNITY_Inquiry Management System|Inquiry Management System]]
- [[_COMMUNITY_OG Image Generation|OG Image Generation]]
- [[_COMMUNITY_Admin User Statistics|Admin User Statistics]]
- [[_COMMUNITY_Strategic Architecture Decisions|Strategic Architecture Decisions]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Stripe Webhook Handler|Stripe Webhook Handler]]
- [[_COMMUNITY_Brand Assets and Design|Brand Assets and Design]]
- [[_COMMUNITY_Jest Testing Config|Jest Testing Config]]
- [[_COMMUNITY_Media Storage Management|Media Storage Management]]
- [[_COMMUNITY_Vercel Deployment Config|Vercel Deployment Config]]
- [[_COMMUNITY_Social Share Components|Social Share Components]]
- [[_COMMUNITY_Product Setup Guides|Product Setup Guides]]
- [[_COMMUNITY_Infrastructure ADRs|Infrastructure ADRs]]
- [[_COMMUNITY_ESLint Configuration|ESLint Configuration]]
- [[_COMMUNITY_Email Service Client|Email Service Client]]
- [[_COMMUNITY_Next.js Configuration|Next.js Configuration]]
- [[_COMMUNITY_Playwright E2E Testing|Playwright E2E Testing]]
- [[_COMMUNITY_Tailwind CSS Config|Tailwind CSS Config]]
- [[_COMMUNITY_Framework ADR|Framework ADR]]
- [[_COMMUNITY_Styling ADR|Styling ADR]]
- [[_COMMUNITY_Smooth Scroll ADR|Smooth Scroll ADR]]
- [[_COMMUNITY_Animation ADR|Animation ADR]]
- [[_COMMUNITY_Email Confirmation ADR|Email Confirmation ADR]]
- [[_COMMUNITY_CICD Workflow|CI/CD Workflow]]
- [[_COMMUNITY_Development Roadmap|Development Roadmap]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 89 edges
2. `verifyAdmin()` - 18 edges
3. `isAdmin()` - 16 edges
4. `compilerOptions` - 16 edges
5. `getAiQuota()` - 14 edges
6. `Profile` - 14 edges
7. `Reveal()` - 12 edges
8. `recordAiUsage()` - 12 edges
9. `checkQuota()` - 10 edges
10. `Logo()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `StripeStatusPage()` --calls--> `formatTimestamp()`  [INFERRED]
  app/stripe/status/page.tsx → components/admin/audit-log.tsx
- `lib/actions/auth.ts` --references--> `supabase/schema.sql`  [INFERRED]
  lib/actions/auth.ts → supabase/schema.sql
- `lib/actions/profile.ts` --references--> `supabase/schema.sql`  [INFERRED]
  lib/actions/profile.ts → supabase/schema.sql
- `lib/actions/ai.ts` --references--> `supabase/schema.sql`  [INFERRED]
  lib/actions/ai.ts → supabase/schema.sql
- `lib/actions/billing.ts` --references--> `supabase/schema.sql`  [INFERRED]
  lib/actions/billing.ts → supabase/schema.sql

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **AthleteOS Documentation Suite** — agents_md, readme_md, architecture_md, changelog_md, components_md, context_md, copy_md, database_md, vision_md [EXTRACTED 1.00]
- **AthleteOS Server Actions** — lib_actions_auth, lib_actions_profile, lib_actions_ai, lib_actions_billing, lib_actions_admin, lib_actions_analytics [EXTRACTED 1.00]
- **Core Strategic Documents** — vision_blueprint, roadmap_product, decisions_adr014 [EXTRACTED 1.00]
- **Monetization & Billing Stack** — decisions_adr018, decisions_adr025, roadmap_product [EXTRACTED 0.90]
- **AI Tooling & Quota System** — decisions_adr022, decisions_adr023, decisions_adr024 [EXTRACTED 0.95]

## Communities (63 total, 14 thin omitted)

### Community 0 - "Landing Page Components"
Cohesion: 0.07
Nodes (35): AthleteOS Platform, AIFeatures(), TOOLS, AnnouncementBar(), AthleteCard(), FAQ(), FAQS, Features() (+27 more)

### Community 1 - "Analytics and Tracking"
Cohesion: 0.06
Nodes (42): AnalyticsData, AnalyticsRange, getAnalytics(), getClientIp(), getRangeDate(), getReferrer(), getSupabaseServiceRole(), getUserAgent() (+34 more)

### Community 2 - "User Profile Management"
Cohesion: 0.06
Nodes (36): HighlightSchema, LinkSchema, Profile, ProfileResult, SocialSchema, StatSchema, updateProfile(), UpdateProfileSchema (+28 more)

### Community 3 - "AI Content Generation"
Cohesion: 0.11
Nodes (40): AiResult, checkQuota(), generateBios(), GenerateBiosSchema, generateBiosStream(), generateCaptionsAction(), GenerateCaptionsSchema, generateCaptionsStream() (+32 more)

### Community 4 - "Memberships and Tiers"
Cohesion: 0.07
Nodes (28): getServiceClient(), getTierForSubscription(), Tier, createContentPost(), CreatePostSchema, createSubscriptionCheckout(), createTier(), CreateTierSchema (+20 more)

### Community 5 - "Authentication Services"
Cohesion: 0.08
Nodes (26): AuthResult, getCurrentUser(), getServiceClient(), resendConfirmationEmail(), signIn(), signInWithGoogle(), signOut(), signUp() (+18 more)

### Community 6 - "Billing and Payments"
Cohesion: 0.08
Nodes (31): BillingResult, cancelSubscriptionAction(), CheckoutSchema, createCheckoutSessionAction(), createPortalSessionAction(), SubscriptionStatus, createConnectOnboarding(), getPayoutBalance() (+23 more)

### Community 7 - "Project Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, clsx, framer-motion, @google/generative-ai, lenis, lucide-react, next, react (+27 more)

### Community 8 - "Referrals and Pro Benefits"
Cohesion: 0.20
Nodes (15): assignFirst500ProBenefit(), checkProExpiry(), generateReferralCode(), getReferralStats(), trackReferral(), getStripeStatus(), StripeStatusResult, WebhookEvent (+7 more)

### Community 9 - "Admin Waitlist Management"
Cohesion: 0.11
Nodes (16): exportWaitlistCsv(), getAuditLogs(), getWaitlistEntries(), WaitlistEntry, AdminSettings(), AdminSettingsProps, SERVICES, ServiceStatus (+8 more)

### Community 10 - "Admin Data Operations"
Cohesion: 0.12
Nodes (16): AdminResult, AuditLogEntry, getAbuseStats(), getAllTipsSummary(), getPayoutData(), LogActionSchema, ToggleStatusSchema, UpdatePlanSchema (+8 more)

### Community 11 - "Brand and Campaign Management"
Cohesion: 0.15
Nodes (13): createBrandAccount(), CreateBrandSchema, CreateBriefSchema, createCampaignBrief(), getBrandAccount(), getCampaignBriefs(), getSavedAthletes(), getServiceClient() (+5 more)

### Community 12 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 13 - "Root Layout and Metadata"
Cohesion: 0.15
Nodes (13): inter, jsonLd, metadata, viewport, websiteJsonLd, SmoothScroll(), lib/actions/admin.ts, lib/actions/ai.ts (+5 more)

### Community 14 - "Team Management"
Cohesion: 0.16
Nodes (13): addTeamMember(), createTeam(), CreateTeamSchema, getMyTeams(), getServiceClient(), getTeam(), getTeamAnalytics(), getTeamInvites() (+5 more)

### Community 15 - "Admin Dashboard Shell"
Cohesion: 0.13
Nodes (13): getProfilesForReview(), getUsageStats(), getUserUsageList(), AdminShell(), AdminShellProps, NAV_ITEMS, NavId, STAT_CARDS (+5 more)

### Community 16 - "User Moderation Tools"
Cohesion: 0.23
Nodes (11): checkAdminRateLimit(), logAdminAction(), moderateProfile(), toggleUserStatus(), updateUserPlan(), verifyAdmin(), viewUser(), DetailProfile (+3 more)

### Community 17 - "Inquiry Management System"
Cohesion: 0.25
Nodes (9): getAthleteInquiries(), getInquiryCount(), getServiceClient(), submitInquiry(), SubmitInquirySchema, updateInquiryStatus(), UpdateStatusSchema, Inquiry (+1 more)

### Community 18 - "OG Image Generation"
Cohesion: 0.25
Nodes (5): fs, OUT, path, sharp, svgToPng()

### Community 19 - "Admin User Statistics"
Cohesion: 0.53
Nodes (5): getNewsletterCount(), getWaitlistCount(), listUsers(), sanitizeSearch(), AdminPage()

### Community 20 - "Strategic Architecture Decisions"
Cohesion: 0.33
Nodes (6): ADR-014: Adopt VISION.md as master strategic blueprint, ADR-018: Stripe Connect Express for athlete monetization, ADR-022: Google Gemini as AI provider, Quality Assurance Test Plan, Post-Landing Product Roadmap, AthleteOS Strategic Blueprint

### Community 21 - "Auth Middleware"
Cohesion: 0.47
Nodes (4): config, middleware(), serviceRole, updateSession()

### Community 22 - "Stripe Webhook Handler"
Cohesion: 0.53
Nodes (5): ALLOWED_EVENTS, getStripe(), getSupabaseServiceRole(), logWebhookEvent(), POST()

### Community 23 - "Brand Assets and Design"
Cohesion: 0.40
Nodes (5): Apple Icon (180x180), ADR-003: Single accent color: electric lime, Visual Tokens & Motion, Open Graph Image (1200x630), Twitter Image (1200x675)

### Community 25 - "Jest Testing Config"
Cohesion: 0.50
Nodes (3): config, createJestConfig, nextJest

### Community 26 - "Media Storage Management"
Cohesion: 0.83
Nodes (3): deleteContentMedia(), getSupabaseServiceRole(), uploadContentMedia()

### Community 27 - "Vercel Deployment Config"
Cohesion: 0.50
Nodes (3): buildCommand, framework, installCommand

### Community 29 - "Product Setup Guides"
Cohesion: 0.67
Nodes (3): AthleteOS Enhancement Summary, New Features Documentation, Production Setup Guide

## Knowledge Gaps
- **215 isolated node(s):** `extends`, `Props`, `ALLOWED_EVENTS`, `Athlete`, `Tier` (+210 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Referrals and Pro Benefits` to `Analytics and Tracking`, `User Profile Management`, `AI Content Generation`, `Memberships and Tiers`, `Authentication Services`, `Billing and Payments`, `Admin Waitlist Management`, `Admin Data Operations`, `Brand and Campaign Management`, `Team Management`, `Admin Dashboard Shell`, `User Moderation Tools`, `Inquiry Management System`, `Admin User Statistics`?**
  _High betweenness centrality (0.235) - this node is a cross-community bridge._
- **Why does `Logo()` connect `Analytics and Tracking` to `Landing Page Components`, `Admin Dashboard Shell`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `extends`, `Props`, `ALLOWED_EVENTS` to the rest of the system?**
  _226 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Landing Page Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07019230769230769 - nodes in this community are weakly interconnected._
- **Should `Analytics and Tracking` be split into smaller, more focused modules?**
  _Cohesion score 0.06110102843315184 - nodes in this community are weakly interconnected._
- **Should `User Profile Management` be split into smaller, more focused modules?**
  _Cohesion score 0.06462585034013606 - nodes in this community are weakly interconnected._
- **Should `AI Content Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.10993657505285412 - nodes in this community are weakly interconnected._