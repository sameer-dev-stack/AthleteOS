import { redirect } from "next/navigation";
import Link from "next/link";
import { getMyProfile } from "@/lib/actions/profile";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { InquiryInbox } from "@/components/dashboard/inquiry-inbox";
import { BarChart3, AlertCircle } from "lucide-react";

export default async function AnalyticsPage() {
  const profileResult = await getMyProfile();

  if (!profileResult.ok || !profileResult.data) {
    redirect("/onboarding");
  }

  const profile = profileResult.data;
  const accentColor = profile.theme_accent || "#C6FF3D";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Analytics & Inbox</h1>
        <p className="mt-1.5 text-sm text-white/40">
          Track card visitor counts, unique views, top external link clicks, and brand inquiries.
        </p>
      </div>

      {!profile.profile_published ? (
        <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#0D0D0F] p-8 text-center max-w-xl">
          <AlertCircle className="mx-auto h-8 w-8 text-white/35" />
          <h3 className="mt-4 text-sm font-bold text-white">Profile is draft</h3>
          <p className="mt-2 text-xs text-white/40 leading-relaxed">
            Detailed visitor analytics and brand inquiries are only active once your card is published. Publish your card to start tracking data.
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
          <AnalyticsPanel athleteId={profile.id} themeAccent={accentColor} />
          <InquiryInbox />
        </div>
      )}
    </div>
  );
}
