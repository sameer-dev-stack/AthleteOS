import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const REF_COOKIE = "athleteos_ref";
const REF_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type Props = { params: Promise<{ code: string }> };

export default async function ReferralRedirect({ params }: Props) {
  const { code } = await params;

  try {
    const serviceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: codeRow } = await serviceRole
      .from("referral_codes")
      .select("code")
      .ilike("code", code)
      .eq("is_active", true)
      .single();

    if (codeRow?.code) {
      const cookieStore = await cookies();
      cookieStore.set(REF_COOKIE, codeRow.code, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: REF_MAX_AGE,
      });
    }
  } catch (err) {
    console.error("[referral-redirect] error:", err);
  }

  redirect("/auth/sign-up");
}
