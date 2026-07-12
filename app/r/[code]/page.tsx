import { headers } from "next/headers";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { hashIp } from "@/lib/referral-click";
import { resolveReferrerView } from "@/lib/referral-landing";

export const dynamic = "force-dynamic";
// The athleteos_ref cookie is set in middleware (cookies can't be set in a
// Server Component render). This page only renders the branded landing and
// records the click via the service-role client.
export const runtime = "nodejs";

type Props = { params: Promise<{ code: string }> };

export default async function ReferralLanding({ params }: Props) {
  const { code } = await params;

  const serviceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Server-only: this component runs on the server, never shipped to client
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: codeRow } = await serviceRole
    .from("referral_codes")
    .select("code, is_active, user_id")
    .ilike("code", code)
    .single();

  let profile: { full_name: string | null; avatar_url: string | null } | null =
    null;
  if (codeRow?.user_id) {
    const { data: p } = await serviceRole
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", codeRow.user_id)
      .single();
    profile = p;
  }

  const view = resolveReferrerView(
    code,
    codeRow ? { code: codeRow.code, isActive: codeRow.is_active } : null,
    profile
  );

  if (view.valid && codeRow) {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = h.get("user-agent") ?? null;
    // The referral cookie is set in middleware (cookies can't be set in a
    // Server Component render). Record the click here with the client we
    // already have. Wrapped so analytics failures never break the landing render.
    try {
      await serviceRole.from("referral_clicks").insert({
        code: codeRow.code,
        referrer_id: codeRow.user_id,
        ip_hash: hashIp(ip, process.env.ANALYTICS_IP_HASH_SECRET),
        user_agent: ua ?? null,
      });
    } catch {}
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#111113] p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">
          AthleteOS
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white">
          {view.valid
            ? view.referrerName
              ? `${view.referrerName} invited you to AthleteOS`
              : "You've been invited to AthleteOS"
            : "Join AthleteOS"}
        </h1>
        <p className="mt-3 text-ink-dim">
          The operating system for student-athletes. Build your brand, track
          your NIL value, and grow your audience.
        </p>
        <Link
          href="/auth/sign-up"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
        >
          Claim your free athlete card
        </Link>
        <p className="mt-4 text-xs text-ink-muted">Free to start. No card required.</p>
      </div>
    </main>
  );
}
