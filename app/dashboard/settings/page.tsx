import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/actions/profile";
import { redirect } from "next/navigation";
import { SettingsPanel } from "@/components/dashboard/settings-panel";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const profileResult = await getMyProfile();
  if (!profileResult.ok || !profileResult.data) redirect("/onboarding");

  return (
    <div>
      <h1 className="text-display-md font-bold text-white">Settings</h1>
      <p className="mt-2 text-sm text-ink-muted">Manage your account preferences</p>

      <div className="mt-8">
        <SettingsPanel profile={profileResult.data} user={user} />
      </div>
    </div>
  );
}
