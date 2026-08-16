import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { getWaitlistCount, getNewsletterCount, listUsers } from "@/lib/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAuthorized = profile?.role === "admin" || isAdmin(user.email);
  if (!isAuthorized) {
    redirect("/");
  }

  const [waitlistResult, newsletterResult, usersResult, activeResult] =
    await Promise.all([
      getWaitlistCount(),
      getNewsletterCount(),
      listUsers(undefined, 1, 1),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("suspended", false),
    ]);

  const stats = {
    totalUsers: usersResult.ok && usersResult.data ? usersResult.data.total : 0,
    waitlistCount: waitlistResult.data ?? 0,
    newsletterCount: newsletterResult.data ?? 0,
    activeUsers: activeResult.error ? 0 : (activeResult.count ?? 0),
  };

  return (
    <AdminShell
      user={{ email: user.email!, id: user.id }}
      stats={stats}
    />
  );
}
