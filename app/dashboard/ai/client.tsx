"use client";

import { useRouter } from "next/navigation";
import { AIToolkit } from "@/components/dashboard/ai-toolkit";
import type { Profile } from "@/lib/actions/profile";

type Props = {
  profile: Profile;
  quota: { used: number; limit: number; remaining: number; plan?: string };
  savedAssetsCount: number;
};

export function AIToolkitClient({ profile, quota, savedAssetsCount }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">AI Toolkit</h1>
        <p className="mt-1.5 text-sm text-white/40">
          Generate professional bios, social media captions, brand pitch letters, and NIL pricing estimates.
        </p>
      </div>
      <div className="max-w-4xl">
        <AIToolkit
          profile={profile}
          quota={quota}
          savedAssetsCount={savedAssetsCount}
          onProfileChange={() => {
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
