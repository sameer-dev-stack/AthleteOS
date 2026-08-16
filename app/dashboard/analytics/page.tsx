import { redirect } from "next/navigation";
import Link from "next/link";
import { getMyProfile } from "@/lib/actions/profile";
import { getAnalyticsData } from "@/lib/actions/analytics";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { resolvePlan } from "@/lib/referral-reward";
import { BarChart3, AlertCircle } from "lucide-react";

export default async function AnalyticsPage() {
  const profileResult = await getMyProfile();

  if (!profileResult.ok || !profileResult.data) {
    redirect("/onboarding");
  }

  const profile = profileResult.data;
  const isPro = resolvePlan(profile.plan, profile.extended_pro_until) !== "free";
  const accentColor = profile.theme_accent || "#C6FF3D";
  const defaultRange = isPro ? "30d" : "7d";
  const initialAnalytics = await getAnalyticsData(profile.id, defaultRange);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Analytics</h1>
        <p className="mt-1.5 text-sm text-white/40">
          Track card visitor counts, unique views, and top external link clicks.
        </p>
      </div>

      {!profile.profile_published ? (
        <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#0D0D0F] p-8 text-center max-w-xl">
          <AlertCircle className="mx-auto h-8 w-8 text-white/35" />
          <h3 className="mt-4 text-sm font-bold text-white">Profile is draft</h3>
          <p className="mt-2 text-xs text-white/40 leading-relaxed">
            Detailed visitor analytics are only active once your card is published. Publish your card to start tracking data.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/profile"
              className="inline-flex rounded-xl px-4 py-2 text-xs font-bold text-bg transition-colors duration-200"
              style={{ backgroundColor: accentColor }}
            >
              Go to Profile Settings
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8 max-w-5xl">
          <AnalyticsPanel athleteId={profile.id} initialData={initialAnalytics} themeAccent={accentColor} isPro={isPro} />
        </div>
      )}
    </div>
  );
}
