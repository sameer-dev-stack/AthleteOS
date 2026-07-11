import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const REF_COOKIE = "athleteos_ref";
const REF_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

type Props = { params: Promise<{ username: string }> };

export default async function ReferralRedirect({ params }: Props) {
  const { username } = await params;

  const serviceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: profile } = await serviceRole
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .single();

  if (!profile?.username) {
    redirect("/auth/sign-up");
  }

  const cookieStore = await cookies();
  cookieStore.set(REF_COOKIE, profile.username, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REF_MAX_AGE,
  });

  redirect("/auth/sign-up");
}
