import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { hashIp } from "@/lib/referral-click";
import { resolveReferrerView } from "@/lib/referral-landing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const serviceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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

  const headline = view.valid
    ? view.referrerName
      ? `${view.referrerName} invited you to NIL CARD`
      : "You've been invited to NIL CARD"
    : "Join NIL CARD";

  return {
    title: "You're invited to NIL CARD",
    openGraph: {
      title: headline,
      description:
        "The operating system for student-athletes. Build your brand, track your NIL value, and grow your audience.",
      images: ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: headline,
      description:
        "The operating system for student-athletes. Build your brand, track your NIL value, and grow your audience.",
      images: ["/twitter-image.png"],
    },
  };
}

export default async function ReferralLanding({ params }: Props) {
  const { code } = await params;

  const serviceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
    try {
      await serviceRole.from("referral_clicks").insert({
        code: codeRow.code,
        referrer_id: codeRow.user_id,
        ip_hash: hashIp(ip, process.env.ANALYTICS_IP_HASH_SECRET),
        user_agent: ua ?? null,
      });
    } catch {}
  }

  const headline = view.valid
    ? view.referrerName
      ? `${view.referrerName} invited you to NIL CARD`
      : "You've been invited to NIL CARD"
    : "Join NIL CARD";

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-[420px] rounded-3xl border border-white/[0.06] bg-card p-10 text-center shadow-[0_1px_0_0_rgba(255,255,255,0.04) inset,0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)]">
        <p className="eyebrow justify-center">NIL CARD</p>
        <h1 className="mt-5 text-[1.65rem] font-bold leading-tight text-ink">
          {headline}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          The operating system for student-athletes. Build your brand, track
          your NIL value, and grow your audience.
        </p>
        <Link
          href={`/auth/sign-up?ref=${encodeURIComponent(code)}`}
          className="btn-primary mt-7 w-full"
        >
          Claim your free athlete card
        </Link>
        <p className="mt-4 text-xs text-ink-dim">
          Free to start. No card required.
        </p>
      </div>
    </main>
  );
}
