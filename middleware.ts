import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

const serviceRole = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : null;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next();
  }

  // Intercept Supabase email-confirmation authorization codes that land on a
  // non-callback path (e.g. the root landing page) and forward them to the
  // auth callback route so the session is established and the user is routed
  // into the app instead of being stranded on the marketing page.
  const code = request.nextUrl.searchParams.get("code");
  if (code && pathname !== "/auth/callback") {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  if (pathname === "/auth/signin") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    return NextResponse.redirect(url);
  }
  if (pathname === "/auth/signup") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-up";
    return NextResponse.redirect(url);
  }

  const isAdminPath = pathname === "/admin" || (pathname.startsWith("/admin/") && !pathname.startsWith("/admin-settings"));
  const isProtectedPath =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname === "/teams" ||
    pathname.startsWith("/teams/") ||
    pathname === "/brands" ||
    pathname.startsWith("/brands/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/analytics" ||
    pathname.startsWith("/analytics/");

  // Single Supabase client for all non-admin paths — avoids double-client cookie loss
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (isAdminPath) {
    if (!user) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { data: profile } = await serviceRole!
      .from("profiles")
      .select("role, suspended")
      .eq("id", user.id)
      .single();

    const authorized = profile?.role === "admin" || isAdmin(user.email);
    if (!authorized) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (profile?.suspended) {
      const suspendedUrl = request.nextUrl.clone();
      suspendedUrl.pathname = "/suspended";
      return NextResponse.redirect(suspendedUrl);
    }

    return supabaseResponse;
  }

  if (user) {
    const { data: profile } = await serviceRole!
      .from("profiles")
      .select("suspended, onboarding_completed")
      .eq("id", user.id)
      .single();

    if (profile?.suspended) {
      const suspendedUrl = request.nextUrl.clone();
      suspendedUrl.pathname = "/suspended";
      return NextResponse.redirect(suspendedUrl);
    }

    if (pathname === "/onboarding" && profile?.onboarding_completed) {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashUrl);
    }

    // Block incomplete profiles from accessing anything except /onboarding, auth,
    // and public profile pages (/:username single-segment paths).
    const isPublicProfile = /^\/[a-zA-Z0-9_-]+$/.test(pathname) && !pathname.startsWith("/_next");
    if (
      !profile?.onboarding_completed &&
      pathname !== "/onboarding" &&
      !pathname.startsWith("/auth/") &&
      !pathname.startsWith("/onboarding/") &&
      !isPublicProfile
    ) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = "/onboarding";
      return NextResponse.redirect(onboardingUrl);
    }
  } else if (isProtectedPath) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/auth/sign-in";
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Referral attribution: a visitor landing on /r/<code> gets the athleteos_ref
  // cookie so the signup flow can credit the referrer. Cookies can only be set
  // in middleware/route handlers, NOT in a Server Component render — so this
  // lives here, not in app/r/[code]/page.tsx. Placed after the Supabase auth
  // client's setAll so the cookie isn't wiped by the response reassignment.
  const refMatch = pathname.match(/^\/r\/([A-Za-z0-9]+)$/);
  if (refMatch) {
    const refCode = refMatch[1];
    const { data: codeRow } = await serviceRole!
      .from("referral_codes")
      .select("code, is_active")
      .ilike("code", refCode)
      .single();
    if (codeRow?.is_active) {
      supabaseResponse.cookies.set("athleteos_ref", codeRow.code, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
