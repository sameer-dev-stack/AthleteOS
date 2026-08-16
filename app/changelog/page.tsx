import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — NIL CARD",
  description: "See what's new in NIL CARD. Features, improvements, and fixes.",
};

const entries = [
  {
    date: "August 13, 2026",
    tag: "Features",
    title: "NIL Value Engine goes live",
    items: [
      "AI-powered NIL valuation with editable rate cards",
      "3-in-1 pitch generator — brand, sponsor, and media pitches",
      "NIL value dashboard with a sidebar tab and Pro gating",
      "Interactive deal package calculator",
      "Resilient NIL metrics with graceful schema fallback",
    ],
  },
  {
    date: "August 11, 2026",
    tag: "Growth",
    title: "Launch offer for the first 500 athletes",
    items: [
      "First 500 athletes get a 3-month Pro trial",
      "Dismissible launch offer banner with clear trial terms",
    ],
  },
  {
    date: "August 10, 2026",
    tag: "Polish",
    title: "Profile card redesign",
    items: [
      "New premium profile card with a dynamic border glow",
      "ReflectiveCard material with webcam integration",
      "Gold verified badge across card, discovery, and billing",
      "Sport-aware card styling and refinements",
      "Discover page Pro spotlight strip",
      "Smoother card flip animation",
    ],
  },
  {
    date: "August 6, 2026",
    tag: "Platform",
    title: "Launch gate hardening and OG previews",
    items: [
      "Per-profile social share (OG) previews",
      "Business Facts store with AI grounding",
      "Funnel audit and URL/env hardening",
      "Unbuilt features now show \"Coming soon\" and redirect to the dashboard",
      "Null-safe database client and reduced dev service workers",
    ],
  },
  {
    date: "July 13, 2026",
    tag: "Platform",
    title: "Faster builds and stronger billing",
    items: [
      "Upgraded to Next.js 16.2 with Turbopack",
      "Stripe SDK updated and pinned with apiVersion sync",
      "Supabase SSR upgraded",
      "Sentry error tracking",
    ],
  },
  {
    date: "July 12, 2026",
    tag: "Growth",
    title: "Referral system, round two",
    items: [
      "Referral landing pages at /r/yourname",
      "Referral dashboard with funnel and leaderboard",
      "Two-sided rewards — both the referrer and the referred athlete earn Pro",
      "\"Invited by {Name}\" banner on the sign-up page",
    ],
  },
  {
    date: "July 7, 2026",
    tag: "Growth",
    title: "Referral system, launch checklist, and more",
    items: [
      "Referral links — invite other athletes with /r/yourname",
      "Gamified launch checklist on dashboard",
      "Share card button in dashboard header",
      "AI quota upgrade prompts with billing link",
      "Profile score SVG progress ring",
      "System status component on dashboard",
      "What's new banner for feature announcements",
      "Featured athlete spotlight on discover page",
      "Confetti on card publish",
      "Profile nudge email for incomplete onboarding",
      "Public changelog page",
      "Feature request board with community voting",
      "Landing page JSON-LD structured data for SEO",
    ],
  },
  {
    date: "July 6, 2026",
    tag: "Polish",
    title: "Legal pages, confetti, and SEO",
    items: [
      "Terms of service and privacy policy pages",
      "About, NIL guide, and help center pages",
      "Confetti celebration on card launch and waitlist signup",
      "Landing page structured data (JSON-LD) for search engines",
      "Improved 404 page with search and browse",
    ],
  },
  {
    date: "July 5, 2026",
    tag: "Security",
    title: "14-pass audit — 125+ bugs fixed",
    items: [
      "XSS, HTML injection, and IDOR vulnerabilities patched",
      "Race conditions and TOCTOU bugs resolved",
      "Auth bypass and privilege escalation fixes",
      "Stripe error message leakage prevented",
      "Memory leaks and stuck-loading states fixed",
      "CSP headers updated for analytics",
    ],
  },
  {
    date: "July 4, 2026",
    tag: "Features",
    title: "Stripe billing goes live",
    items: [
      "Pro plan ($14/mo) via Stripe",
      "Downgrade flow via Stripe Customer Portal",
      "Webhook for subscription lifecycle events",
      "Weekly email digest with AI-powered action items",
      "Web Share API for native mobile sharing",
      "Error boundaries for onboarding and dashboard",
    ],
  },
  {
    date: "July 3, 2026",
    tag: "Platform",
    title: "Full platform launch",
    items: [
      "Public athlete cards with flip animation",
      "Dashboard with 15+ modules",
      "AI toolkit — bio, captions, sponsor pitches, profile improver",
      "Discovery page with search and filters",
      "Admin panel with user management and analytics",
      "Tip receiving via Stripe Connect",
    ],
  },
];

const tagColors: Record<string, string> = {
  Growth: "bg-accent/15 text-accent border-accent/25",
  Polish: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  Security: "bg-red-500/15 text-red-400 border-red-500/25",
  Features: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  Platform: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

export default function ChangelogPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg pt-24 pb-20">
        <div className="container-tight">
          <span className="eyebrow">What&apos;s new</span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Changelog
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            We ship fast. Here&apos;s what we&apos;ve been building.
          </p>

          <div className="mt-12 space-y-8">
            {entries.map((entry) => (
              <div
                key={entry.date}
                className="relative rounded-2xl border border-white/[0.06] bg-[#111113] p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-xs text-ink-dim font-medium">{entry.date}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tagColors[entry.tag] || "bg-white/10 text-white/60 border-white/10"}`}>
                    {entry.tag}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">{entry.title}</h2>
                <ul className="mt-3 space-y-2">
                  {entry.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-ink-muted">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
