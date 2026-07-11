import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          const admin = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          const { error: profileError } = await admin
            .from("profiles")
            .upsert(
              {
                id: user.id,
                email: user.email ?? "",
                full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
                avatar_url: user.user_metadata?.avatar_url ?? null,
                onboarding_completed: false,
              },
              { onConflict: "id" }
            );

          if (!profileError) {
            return NextResponse.redirect(`${origin}/onboarding?verified=1`);
          }

          console.error("[auth] profile upsert failed", profileError.message);
          return NextResponse.redirect(`${origin}/auth/error?message=Could not create profile`);
        }

        // Admin users bypass onboarding check
        if (isAdmin(user.email)) {
          return NextResponse.redirect(`${origin}/admin?verified=1`);
        }

        if (!profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding?verified=1`);
        }

        // Fully onboarded users land on the dashboard rather than the landing page.
        // Only honor an explicit ?next= target when it was not the default root.
        const target = next !== "/" ? next : "/dashboard";
        return NextResponse.redirect(`${origin}${target}?verified=1`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
