import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/actions/profile";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const profileResult = await getMyProfile();

  if (!profileResult.ok || !profileResult.data) {
    throw new Error("Failed to load profile. Please try again.");
  }

  const profile = profileResult.data;

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="relative min-h-screen bg-bg">
      {/* Sidebar Navigation */}
      <Sidebar profile={profile} email={user.email || ""} />

      {/* Header bar */}
      <Header profile={profile} email={user.email || ""} />

      {/* Main dashboard content */}
      <main className="md:pl-[240px] min-h-[calc(100vh-4rem)] flex flex-col pb-20 md:pb-0 transition-[padding] duration-200">
        <div className="flex-1 px-4 py-8 md:px-8 max-w-7xl w-full mx-auto animate-page-in">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
