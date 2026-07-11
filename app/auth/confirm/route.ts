import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const email = searchParams.get("email");

  if (token && type === "signup" && email) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (!error) {
      return NextResponse.redirect(
        `${origin}/auth/welcome?message=Email confirmed! You can now sign in.`
      );
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/error?message=Invalid or expired confirmation link`
  );
}
