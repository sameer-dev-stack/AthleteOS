"use client";

import { useRouter } from "next/navigation";
import { DashboardEditor } from "@/components/dashboard/profile-editor";
import type { Profile } from "@/lib/actions/profile";

export function ProfileEditorClient({ profile }: { profile: Profile }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Edit Profile</h1>
        <p className="mt-1.5 text-sm text-white/40">
          Customize your public card theme, layout, stats, and social links.
        </p>
      </div>
      <div id="profile-editor">
        <DashboardEditor
          profile={profile}
          onSaved={() => {
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
