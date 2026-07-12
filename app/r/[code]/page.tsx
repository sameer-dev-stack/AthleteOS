import { cookies, headers } from "next/headers";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { trackReferralClick } from "@/lib/actions/referrals";
import { resolveReferrerView } from "@/lib/referral-landing";

const REF_COOKIE = "athleteos_ref";
const REF_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const dynamic = "force-dynamic";

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
    // Set referral cookie (httpOnly: false — read client-side at signup)
    (await cookies()).set(REF_COOKIE, codeRow.code, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REF_MAX_AGE,
    });

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = h.get("user-agent") ?? null;
    await trackReferralClick(codeRow.code, ip, ua);
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
