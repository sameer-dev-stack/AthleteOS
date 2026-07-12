# Referral System — Context-Engineered Coding Prompts

> Paste each prompt into your coding agent (or dispatch as a subagent). Each is self-contained.
> Prerequisite (manual, already filed): `supabase/migrations/20260712_referral_extend.sql` → run via `psql` on the direct 5432 connection.
> Project rules (AGENTS.md) apply to every prompt: Server Components by default (`"use client"` only when hooks/effects/handlers needed); Zod-validate DB writes; RLS on every table scoped to `auth.uid()`; `getUser()` not `getSession()` in Server Components; never expose service-role key client-side; single accent `#C6FF3D` (no second accent); dark-only; no emojis in code/copy; smallest possible change; comments only explain *why*.
> Reference plan: `.hermes/plans/2026-07-12_110000-referral-system.md`

---

## PROMPT T1 — GDPR cleanup in `lib/actions/gdpr.ts`

**Context:** `deleteAccount` currently deletes user-linked rows across ~16 tables but **omits** referral data, leaving orphaned PII after "deletion" (PROJECT.md D1). The referral tables: `referral_clicks` (col `referrer_id`), `referrals` (`referrer_id`, `referred_id` UNIQUE), `referral_codes` (`user_id`).

**Files:** Modify `lib/actions/gdpr.ts`

**Do:** Inside the `deleteAccount` function, in the block where other user-linked rows are deleted via the service-role client (variable likely named `admin` or `supabaseAdmin`), add:
```ts
// referral data removed with account (GDPR) — referred_id unique = one referral per person
await admin.from("referral_clicks").delete().eq("referrer_id", userId);
await admin.from("referrals").delete().or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
await admin.from("referral_codes").delete().eq("user_id", userId);
```
Place these alongside the existing deletes (same try/catch pattern). Do not change the function's return shape.

**Constraints:** Use the existing service client variable; do not introduce a new Supabase client. Keep the `referred_id` UNIQUE semantics in mind (one row per referred user).

**Verify:** `npm run lint && npm run build` clean. Grep `referral` in gdpr.ts shows the 3 deletes.

---

## PROMPT T2 — Centralize referral constants

**Context:** `lib/actions/referrals.ts` hardcodes `const REWARD_DAYS = 7;` (line 7) and a local `chars` string inside `generateCode()`. These should live in `lib/constants.ts` (PROJECT.md D2/D3-style dedupe). `lib/constants.ts` already exports `PLATFORM_FEE_PERCENT`, `MINIMUM_PAYOUT_CENTS`, etc.

**Files:** Modify `lib/constants.ts`; Modify `lib/actions/referrals.ts`

**Do:**
1. Append to `lib/constants.ts`:
```ts
export const REFERRAL_REWARD_DAYS = 7;        // referrer Pro days per completed referral
export const REFERRED_BONUS_DAYS = 7;         // referred user Pro days (two-sided)
export const REFERRAL_WINDOW_DAYS = 30;       // cookie/attribution window
export const REFERRAL_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
```
2. In `lib/actions/referrals.ts`: add `import { REFERRAL_REWARD_DAYS, REFERRAL_CODE_CHARS } from "@/lib/constants";` and DELETE `const REWARD_DAYS = 7;`. Replace `reward_days: REWARD_DAYS` with `reward_days: REFERRAL_REWARD_DAYS`. In `generateCode()`, replace `const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";` with `const chars = REFERRAL_CODE_CHARS;`.

**Constraints:** No behavior change. Do not touch `generateCode()` loop logic.

**Verify:** `npm run lint && npm run build` clean. Grep confirms no local `REWARD_DAYS`/`chars` redefinition remains.

---

## PROMPT T3 — Click tracking action + wire into `/r/[code]`

**Context:** There is no click funnel. `app/r/[code]/route.ts` sets the `athleteos_ref` cookie (30d, non-httpOnly) then redirects to `/auth/sign-up`. It uses a service-role Supabase client and selects `referral_codes`. The `referral_clicks` table already exists (migration `20260712_referral_extend.sql`) with columns: `code`, `referrer_id`, `ip_hash`, `user_agent`. Never store raw IP — hash it.

**Files:** Modify `lib/actions/referrals.ts`; Modify `app/r/[code]/route.ts`

**Do:**
1. In `lib/actions/referrals.ts`, add (reuse the existing `createAdmin()` helper already in the file):
```ts
import crypto from "crypto";

function hashIp(ip: string | null): string | null {
  const secret = process.env.ANALYTICS_IP_HASH_SECRET;
  if (!ip || !secret) return null; // fail-open to null, never store raw IP
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

export async function trackReferralClick(code: string, ip: string | null, ua: string | null) {
  try {
    const admin = createAdmin();
    const { data: row } = await admin
      .from("referral_codes")
      .select("user_id, code")
      .ilike("code", code)
      .eq("is_active", true)
      .single();
    if (!row) return;
    await admin.from("referral_clicks").insert({
      code: row.code,
      referrer_id: row.user_id,
      ip_hash: hashIp(ip),
      user_agent: ua ?? null,
    });
  } catch (err) {
    console.error("[referrals] trackReferralClick error:", err);
  }
}
```
2. In `app/r/[code]/route.ts`, after the `response.cookies.set(REF_COOKIE, codeRow.code, {...})` block (inside the `try`), add:
```ts
await trackReferralClick(
  codeRow.code,
  _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  _request.headers.get("user-agent")
);
```
Keep the existing `import` of server actions or add `import { trackReferralClick } from "@/lib/actions/referrals";` at top.

**Constraints:** IP must be hashed (never raw). Use `x-forwarded-for` header for IP. Do not break the existing cookie/redirect flow.

**Verify:** `npm run lint && npm run build` clean. After applying SQL, a click on `/r/<code>` inserts one `referral_clicks` row.

---

## PROMPT T4 — `getEffectivePlan` helper

**Context:** `lib/actions/ai-usage.ts` `getPlan()` returns `free` unless `plan` column is `pro`/`elite`; it **ignores** `profiles.extended_pro_until`, so referral-earned Pro days unlock nothing (the core bug). We add a single source of truth.

**Files:** Create `lib/actions/plan.ts`

**Do:** Create the file:
```ts
"use server";

import { createClient } from "@/lib/supabase/server";

export type EffectivePlan = "free" | "pro" | "elite";

export async function getEffectivePlan(): Promise<EffectivePlan> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "free";

    const { data } = await supabase
      .from("profiles")
      .select("plan, extended_pro_until")
      .eq("id", user.id)
      .single();

    const plan = data?.plan;
    if (plan === "pro" || plan === "elite") return plan;

    const until = data?.extended_pro_until;
    if (until && new Date(until).getTime() > Date.now()) return "pro";
    return "free";
  } catch (err) {
    console.error("[plan] getEffectivePlan error:", err);
    return "free";
  }
}
```

**Constraints:** Uses `getUser()` (never `getSession()`). Returns `pro` when `extended_pro_until` is in the future OR `plan` is pro/elite.

**Verify:** `npm run lint && npm run build` clean.

---

## PROMPT T5 — Wire `getEffectivePlan` into plan gates

**Context:** `getPlan()` in `lib/actions/ai-usage.ts` must delegate to `getEffectivePlan()` so referral Pro is honored. Other code may gate features by the `plan` column and must also use the effective plan.

**Files:** Modify `lib/actions/ai-usage.ts`; Inspect (grep) `billing.ts`, `middleware.ts`, and any feature-flag code.

**Do:**
1. In `lib/actions/ai-usage.ts`, replace the `getPlan` body to delegate:
```ts
import { getEffectivePlan } from "@/lib/actions/plan";

export async function getPlan(): Promise<Plan> {
  return getEffectivePlan();
}
```
(Keep the `Plan` type export and `QUOTA_CONFIG` as-is.)
2. Grep the repo for: `profiles.plan`, `getPlan(`, `plan === "pro"`, `plan === 'pro'`, `plan === "elite"`, `plan === 'elite'`, `== "pro"`, `=== "elite"`. For each hit that **gates a feature/surface by plan**, replace the plan-column read with `getEffectivePlan()` (or pass the effective plan through). Do NOT touch the Stripe webhook (`app/api/stripe/webhook`) which *sets* `plan` — that writes the column directly and must stay. `middleware.ts` currently gates by `onboarding_completed`/`suspended`/`role`, not plan — if no plan gate exists there, leave it.

**Constraints:** Highest-risk integration step — every place that decides Pro/Elite access must honor `extended_pro_until`. Don't over-reach into non-plan logic.

**Verify:** `npm run lint && npm run build` clean. Grep shows `getPlan` now calls `getEffectivePlan`; no remaining feature gate reads `plan` column directly without effective-plan fallback (except the webhook writer).

---

## PROMPT T6 — Two-sided reward in `recordReferral`

**Context:** `recordReferral` in `lib/actions/referrals.ts` rewards only the referrer via `admin.rpc("grant_pro_reward", { referrer_uuid: codeRow.user_id })`. Standard referral models reward both sides. `profiles.extended_pro_until` exists for all users.

**Files:** Modify `lib/actions/referrals.ts`

**Do:** In `recordReferral`, immediately after the existing referrer reward call:
```ts
const { error: rpcErr } = await admin.rpc("grant_pro_reward", { referrer_uuid: codeRow.user_id });
if (rpcErr) console.error("[referrals] grant_pro_reward error:", rpcErr);
```
add:
```ts
// two-sided: referred user also earns Pro (standard referral model)
const { error: referredRpcErr } = await admin.rpc("grant_pro_reward", { referrer_uuid: user.id });
if (referredRpcErr) console.error("[referrals] grant_pro_reward (referred) error:", referredRpcErr);
```
Keep the existing self-referral block (`codeRow.user_id === user.id`) and duplicate block (`existingReferral`) unchanged.

**Constraints:** `user.id` is the referred (current) user — confirmed by the `getUser()` call at top of `recordReferral`. Both get 7 days (function default).

**Verify:** `npm run lint && npm run build` clean. After SQL + a test referral, both users' `extended_pro_until` advance 7 days.

---

## PROMPT T7 — Funnel + leaderboard actions

**Context:** Dashboard needs click→conversion funnel and a referrer leaderboard. `referral_clicks` (col `code`, `referrer_id`) and `referrals` (`referrer_id`, `status`) exist. `profiles` has `full_name`, `avatar_url`.

**Files:** Modify `lib/actions/referrals.ts`

**Do:** Add (reuse `createAdmin()` and `createClient()` already in file):
```ts
export type ReferralFunnel = { clicks: number; signups: number; conversions: number };

export async function getReferralFunnel(): Promise<ReferralFunnel> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { clicks: 0, signups: 0, conversions: 0 };
    const admin = createAdmin();
    const { data: codeRow } = await admin.from("referral_codes").select("code").eq("user_id", user.id).single();
    const code = codeRow?.code;
    if (!code) return { clicks: 0, signups: 0, conversions: 0 };
    const { count: clicks } = await admin.from("referral_clicks").select("id", { count: "exact", head: true }).eq("code", code);
    const { count: conversions } = await admin.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", user.id).eq("status", "completed");
    const conv = conversions ?? 0;
    return { clicks: clicks ?? 0, signups: conv, conversions: conv };
  } catch (err) {
    console.error("[referrals] getReferralFunnel error:", err);
    return { clicks: 0, signups: 0, conversions: 0 };
  }
}

export type LeaderboardEntry = { id: string; name: string; avatar: string | null; referrals: number };

export async function getReferralLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  try {
    const admin = createAdmin();
    const { data } = await admin.from("referrals").select("referrer_id").eq("status", "completed");
    if (!data || data.length === 0) return [];
    const counts = new Map<string, number>();
    data.forEach((r) => counts.set(r.referrer_id, (counts.get(r.referrer_id) ?? 0) + 1));
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    const ids = top.map((t) => t[0]);
    const { data: profiles } = await admin.from("profiles").select("id, full_name, avatar_url").in("id", ids);
    const pm = new Map(profiles?.map((p) => [p.id, p]) ?? []);
    return top.map(([id, referrals]) => ({
      id,
      name: pm.get(id)?.full_name ?? "Athlete",
      avatar: pm.get(id)?.avatar_url ?? null,
      referrals,
    }));
  } catch (err) {
    console.error("[referrals] getReferralLeaderboard error:", err);
    return [];
  }
}
```

**Constraints:** Aggregate in JS (small N). Don't add a SQL view. Keep return shapes exported for the dashboard component.

**Verify:** `npm run lint && npm run build` clean.

---

## PROMPT T8 — `/dashboard/referrals` page + dashboard component

**Context:** `components/dashboard/referral-card.tsx` links to `/dashboard/referrals` which **does not exist** (404). Build the page (Server Component) + a client dashboard. Existing pattern: server components fetch via `createClient()` and pass props to client components; `referral-card.tsx` uses classes `rounded-2xl border border-white/[0.06] bg-[#111113] p-5`, `text-accent`, `ink-dim`, `ink-muted`. Actions available: `getReferralStats`, `getReferralHistory`, `getReferralFunnel`, `getReferralLeaderboard` (T7). Types: `ReferralStats`, `ReferralHistoryEntry` already exported from `referrals.ts`.

**Files:** Create `app/dashboard/referrals/page.tsx`; Create `components/dashboard/referral-dashboard.tsx`

**Do:**
1. `app/dashboard/referrals/page.tsx` (Server Component):
```tsx
import {
  getReferralStats,
  getReferralHistory,
  getReferralFunnel,
  getReferralLeaderboard,
  type ReferralStats,
  type ReferralHistoryEntry,
  type ReferralFunnel,
  type LeaderboardEntry,
} from "@/lib/actions/referrals";
import { ReferralDashboard } from "@/components/dashboard/referral-dashboard";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const [stats, history, funnel, leaderboard] = await Promise.all([
    getReferralStats(),
    getReferralHistory(),
    getReferralFunnel(),
    getReferralLeaderboard(10),
  ]);
  return (
    <div className="container-wide py-8">
      <h1 className="text-2xl font-semibold text-white mb-6">Referrals</h1>
      <ReferralDashboard
        stats={stats as ReferralStats}
        history={history as ReferralHistoryEntry[]}
        funnel={funnel as ReferralFunnel}
        leaderboard={leaderboard as LeaderboardEntry[]}
      />
    </div>
  );
}
```
2. `components/dashboard/referral-dashboard.tsx` (`"use client"`): accept props `stats`, `history`, `funnel`, `leaderboard`. Render, using the same dark/accent classes as `referral-card.tsx`:
   - **Share block:** link (`stats.referralLink`) + `<ShareSheet link={stats.referralLink} text="Claim your free athlete card on AthleteOS" />` (built in T9).
   - **Funnel:** `funnel.clicks` → `funnel.conversions` (e.g. "X clicks, Y conversions").
   - **Stats grid:** `totalReferrals`, `completedReferrals`, `pendingReferrals`, `proDaysEarned`, `extendedProUntil` (format date or "Active" if future).
   - **History list:** map `history` → name (`referred_name`), sport (`referred_sport`), `status`, `created_at` (formatted).
   - **Leaderboard:** map `leaderboard` → avatar (`avatar` or placeholder), `name`, `referrals` count, ranked.
   No emojis. Single accent `#C6FF3D`. Match `referral-card.tsx` styling exactly.

**Constraints:** Server Component fetches; client component is presentational. Don't add new accent colors. Keep it the smallest UI that covers the 5 sections.

**Verify:** `npm run lint && npm run build` clean. `/dashboard/referrals` renders for an authed user (no 404).

---

## PROMPT T9 — Share sheet component

**Context:** Sharing is currently copy-only in `referral-card.tsx` (`handleShare` uses `navigator.share` or copy). Standard apps offer native + X + WhatsApp + Email. `lucide-react` is available project-wide.

**Files:** Create `components/dashboard/share-sheet.tsx`

**Do:** Create a client component:
```tsx
"use client";

import { useState } from "react";
import { Share2, Copy, Check, Twitter, MessageCircle, Mail } from "lucide-react";

export function ShareSheet({ link, text }: { link: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  async function native() {
    if (navigator.share) {
      try { await navigator.share({ title: "Join AthleteOS", text, url: link }); } catch {}
    } else copy();
  }

  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(text + " " + link)}`;
  const email = `mailto:?subject=${encodeURIComponent("Join AthleteOS")}&body=${encodeURIComponent(text + " " + link)}`;

  const btn = "flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20";

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={native} className={btn}><Share2 className="h-3 w-3" /> Share</button>
      <button onClick={copy} className={btn}>{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy"}</button>
      <a href={tweet} target="_blank" rel="noopener noreferrer" className={btn}><Twitter className="h-3 w-3" /> X</a>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={btn}><MessageCircle className="h-3 w-3" /> WhatsApp</a>
      <a href={email} className={btn}><Mail className="h-3 w-3" /> Email</a>
    </div>
  );
}
```
(If `Twitter`/`MessageCircle` icon names differ in the installed `lucide-react` version, use `search_files` to confirm exact exports; do not invent.)

**Constraints:** Client component. Reuses `bg-accent/10` pattern from `referral-card.tsx`. No emojis. Opens social intents in new tab with `rel="noopener noreferrer"`.

**Verify:** `npm run lint && npm run build` clean. (Icon import names exist in `lucide-react`.)

---

## PROMPT T10 — Wire `ShareSheet` into card + dashboard

**Context:** `components/dashboard/referral-card.tsx` has a `handleShare` function and a "Share" button using copy/native only. The new dashboard (T8) should also use `ShareSheet`.

**Files:** Modify `components/dashboard/referral-card.tsx`; Modify `components/dashboard/referral-dashboard.tsx`

**Do:**
1. In `referral-card.tsx`: add `import { ShareSheet } from "@/components/dashboard/share-sheet";`. Replace the "Share" `<button onClick={handleShare}>` (and you may delete `handleShare`) with `<ShareSheet link={stats.referralLink} text="Claim your free athlete card on AthleteOS" />`. Keep `handleCopy` for the Copy button in the link row (that stays).
2. In `referral-dashboard.tsx` (T8): import and render `<ShareSheet link={stats.referralLink} text="Claim your free athlete card on AthleteOS" />` in the share block.

**Constraints:** Don't remove the link-row Copy button (different UX). Only swap the share-action button for `ShareSheet`.

**Verify:** `npm run lint && npm run build` clean. Both the dashboard card and the referrals page show the 5-button share sheet.

---

## PROMPT T11 — Unit tests (extract pure helper first)

**Context:** Zero referral tests exist. `getEffectivePlan` (T4) mixes DB + date logic. Extract the date/plan decision into a pure helper so it's unit-testable.

**Files:** Create `lib/referral-reward.ts`; Modify `lib/actions/plan.ts`; Create `__tests__/referrals.test.ts`

**Do:**
1. Create `lib/referral-reward.ts` (pure, no `"use server"`):
```ts
export type Plan = "free" | "pro" | "elite";

export function resolvePlan(plan: string | null | undefined, extendedProUntil: string | null | undefined): Plan {
  if (plan === "pro" || plan === "elite") return plan;
  if (extendedProUntil && new Date(extendedProUntil).getTime() > Date.now()) return "pro";
  return "free";
}
```
2. In `lib/actions/plan.ts` `getEffectivePlan`, replace the inline decision with:
```ts
import { resolvePlan } from "@/lib/referral-reward";
// ...
return resolvePlan(data?.plan, data?.extended_pro_until);
```
3. Create `__tests__/referrals.test.ts`:
```ts
import { resolvePlan } from "@/lib/referral-reward";

const future = new Date(Date.now() + 86400000).toISOString();
const past = new Date(Date.now() - 86400000).toISOString();

describe("resolvePlan", () => {
  it("returns pro/elite directly", () => {
    expect(resolvePlan("pro", null)).toBe("pro");
    expect(resolvePlan("elite", null)).toBe("elite");
  });
  it("returns pro when extended_pro_until is future", () => {
    expect(resolvePlan("free", future)).toBe("pro");
  });
  it("returns free when extended_pro_until is past or null", () => {
    expect(resolvePlan("free", past)).toBe("free");
    expect(resolvePlan("free", null)).toBe("free");
    expect(resolvePlan(null, null)).toBe("free");
  });
});
```

**Constraints:** `resolvePlan` is pure (no DB, no Supabase import) — testable in jsdom. `getEffectivePlan` stays a server action.

**Verify:** `npm test` → referral tests PASS. `npm run lint && npm run build` clean.

---

# PART 2 — ORCHESTRATION PROMPT (Use Subagents)

> Paste this to dispatch the coding tasks as parallel/sequential subagents. Each subagent gets the matching prompt above + this repo context.

```
You are executing the AthleteOS referral-system build (plan: .hermes/plans/2026-07-12_110000-referral-system.md).

Repo: D:\Projects\AthleteOS-main — Next.js 14 App Router + Supabase + TypeScript, dark-only, single accent #C6FF3D.
Hard rules (AGENTS.md): Server Components by default; "use client" only when hooks/effects/handlers needed;
Zod-validate DB writes; RLS on every table; getUser() not getSession() in Server Components; never expose
service-role key client-side; no second accent color; no light mode; no emojis in code/copy; smallest change;
comments only explain why.

Prerequisite already done (apply manually, not via agent): run supabase/migrations/20260712_referral_extend.sql
on the direct 5432 Supabase connection.

Execute these tasks IN ORDER (each depends on prior where noted). For each, use the matching context-engineered
prompt in docs/REFERRAL_CODING_PROMPTS.md (T1..T11):
  T1  GDPR cleanup in lib/actions/gdpr.ts
  T2  Constants in lib/constants.ts + use in referrals.ts
  T3  trackReferralClick action + wire into app/r/[code]/route.ts
  T4  Create lib/actions/plan.ts (getEffectivePlan)
  T5  Wire getEffectivePlan into getPlan + grep plan gates
  T6  Two-sided reward in recordReferral
  T7  getReferralFunnel + getReferralLeaderboard
  T8  app/dashboard/referrals/page.tsx + components/dashboard/referral-dashboard.tsx
  T9  components/dashboard/share-sheet.tsx
  T10 Wire ShareSheet into referral-card.tsx + referral-dashboard.tsx
  T11 Extract lib/referral-reward.ts + tests (__tests__/referrals.test.ts)

After EACH task: run `npm run lint && npm run build`. Both must pass before moving on.
T11 also runs `npm test`. Do NOT commit. Report which tasks passed verification.
If a prompt's assumption is wrong (e.g. icon name, function var name), read the actual file first and adapt —
never guess. Surface blockers immediately.
```

---

# PART 3 — PUSH TO GIT PROMPT

> Paste this after all tasks pass lint/build/test.

```
Commit and push the referral-system build to origin/main.

1. Run `npm run lint && npm run build` — both must be clean (they were verified per-task; re-run to be safe).
2. Stage only the referral-related changes (do NOT commit the live `env`/`env.local` — they are gitignored anyway):
   git add supabase/migrations/20260712_referral_extend.sql \
           lib/actions/gdpr.ts lib/constants.ts lib/actions/referrals.ts \
           lib/actions/plan.ts lib/referral-reward.ts lib/actions/ai-usage.ts \
           app/r/\[code\]/route.ts app/dashboard/referrals/page.tsx \
           components/dashboard/referral-dashboard.tsx components/dashboard/share-sheet.tsx \
           components/dashboard/referral-card.tsx __tests__/referrals.test.ts
   (Adjust the list if a task touched additional files — `git status` first.)
3. Commit:
   git commit -m "feat(referrals): complete two-sided referral system with real Pro reward, dashboard, share, funnel"
4. Push:
   git push origin main
5. Do NOT push if lint/build/test fail. Do NOT include secrets. Report the commit hash.

Note: AGENTS.md also requires updating docs/CHANGELOG.md, docs/COMPONENTS.md, docs/DECISIONS.md for this change.
Add a CHANGELOG entry: "Referral system: two-sided reward, getEffectivePlan unlocks referral Pro,
/dashboard/referrals page, share sheet, click funnel, leaderboard, GDPR cleanup." Then commit that too.
```
