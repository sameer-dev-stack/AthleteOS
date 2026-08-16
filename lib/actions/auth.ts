"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin as checkIsAdmin } from "@/lib/admin";
import { isDisposableEmail } from "@/lib/referral-reward";
import { generateToken, sendConfirmationEmail } from "./emails";

export type AuthResult = {
  ok: boolean;
  message: string;
  isAdmin?: boolean;
  email?: string;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nilcard.app";
const CONFIRM_EXPIRY_HOURS = 24;

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function signUp(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  try {
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { ok: false, message: "Email and password are required." };
    }

    if (password.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters." };
    }

    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) {
      return { ok: false, message: "Please enter a valid email address." };
    }

    // Anti-cheat: temporary/disposable addresses are the primary vehicle for
    // promo-farming and referral fraud — reject them at the door (consistent
    // with the referral reward rules).
    if (isDisposableEmail(email)) {
      return { ok: false, message: "Temporary/disposable email addresses are not allowed." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { email_confirm: false },
      },
    });

    if (error) {
      console.error("[auth] signup failed", error.message);
      if (error.message.includes("rate limit")) {
        return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
      }
      if (error.message.includes("already registered")) {
        return { ok: false, message: "An account with this email already exists. Try signing in instead." };
      }
      return { ok: false, message: error.message };
    }

    const isConfirmed = data.user?.identities?.[0]?.identity_data?.email_verified === true;

    if (!isConfirmed && data.user) {
      const token = await generateToken();
      const expires = new Date(Date.now() + CONFIRM_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
      const admin = getServiceClient();

      const { error: upsertError } = await admin.from("profiles").upsert(
        {
          id: data.user.id,
          email,
          confirmation_token: token,
          confirmation_token_expires: expires,
          email_confirmed: false,
        },
        { onConflict: "id" }
      );

      if (upsertError) {
        console.error("[auth] profile upsert failed", upsertError.message);
      }

      sendConfirmationEmail(email, token, "/api/auth/confirm-email").catch((err) => {
        console.error("[auth] confirmation email failed", err);
      });
    }

    return {
      ok: true,
      message: isConfirmed
        ? "Account created! Signing in..."
        : "Account created! Check your email for a confirmation link.",
      email: isConfirmed ? undefined : email,
    };
  } catch (err) {
    console.error("[auth] unexpected signup error", err);
    return {
      ok: false,
      message: "Something went wrong creating your account. Please try again.",
    };
  }
}

export async function signIn(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { ok: false, message: "Email and password are required." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[auth] signin failed", error.message);
    if (error.message.includes("rate limit")) {
      return { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };
    }
    if (error.message.includes("Email not confirmed")) {
      return { ok: false, message: "Please confirm your email before signing in. Check your inbox for the confirmation link." };
    }
    return { ok: false, message: "Invalid email or password." };
  }

  const admin = checkIsAdmin(email);

  return { ok: true, message: "Signed in.", isAdmin: admin };
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();

  // Host allowlist: never trust x-forwarded-host blindly — it is attacker
  // controllable and would let an attacker steer the OAuth redirect to their
  // own domain (session-token theft). Allow only the configured site URL and
  // localhost (dev).
  const headersList = await headers();
  const siteHost = new URL(SITE_URL).host;
  const forwardedHost = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const host = forwardedHost ? forwardedHost.split(",")[0].trim() : siteHost;
  const hostName = host.replace(/:\d+$/, "");
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  const origin =
    hostName === siteHost || hostName === "localhost" || hostName === "127.0.0.1"
      ? `${proto}://${host}`
      : SITE_URL;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("[auth] google oauth failed", error.message);
    redirect("/auth/error?message=Google sign-in failed");
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[auth] signOut failed", err);
  }
  revalidatePath("/");
  redirect("/");
}

export async function resendConfirmationEmail(
  email: string
): Promise<AuthResult> {
  if (!email) {
    return { ok: false, message: "Email is required." };
  }

  const cleanEmail = email.toLowerCase().trim();
  const admin = getServiceClient();

  const { data: profile, error: lookupError } = await admin
    .from("profiles")
    .select("id, email_confirmed")
    .eq("email", cleanEmail)
    .single();

  if (lookupError || !profile) {
    return { ok: false, message: "No account found with this email." };
  }

  if (profile.email_confirmed) {
    return { ok: false, message: "Email is already confirmed. Try signing in." };
  }

  const token = await generateToken();
  const expires = new Date(Date.now() + CONFIRM_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      confirmation_token: token,
      confirmation_token_expires: expires,
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("[auth] failed to store confirmation token", updateError.message);
    return { ok: false, message: "Failed to send confirmation email. Please try again." };
  }

  const result = await sendConfirmationEmail(cleanEmail, token, "/api/auth/confirm-email");
  if (!result.ok) {
    console.error("[auth] resend confirmation email failed", result.error);
    return { ok: false, message: "Failed to send confirmation email. Please try again." };
  }

  return { ok: true, message: "Confirmation email sent. Please check your inbox." };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function resetPassword(
  email: string
): Promise<AuthResult> {
  if (!email) {
    return { ok: false, message: "Email is required." };
  }

  const cleanEmail = email.toLowerCase().trim();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: `${SITE_URL}/auth/reset-password`,
  });

  if (error) {
    console.error("[auth] resetPassword failed", error.message);
    return { ok: false, message: "Failed to send reset email. Please try again." };
  }

  return { ok: true, message: "Password reset link sent. Please check your inbox." };
}

export async function updatePassword(
  password: string
): Promise<AuthResult> {
  if (!password) {
    return { ok: false, message: "Password is required." };
  }

  if (password.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[auth] updatePassword failed", error.message);
    return { ok: false, message: "Failed to update password. Please try again." };
  }

  return { ok: true, message: "Password updated successfully." };
}
