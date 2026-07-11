"use client";

import { SocialScheduler } from "@/components/dashboard/social-scheduler";

type Props = {
  socialAccounts: { platform: string; handle: string }[];
};

export function ScheduleClient({ socialAccounts }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Social Scheduler
        </h1>
        <p className="mt-1.5 text-sm text-white/40">
          Plan, schedule, and manage your social media content across platforms.
        </p>
      </div>
      <div className="max-w-6xl">
        <SocialScheduler socialAccounts={socialAccounts} />
      </div>
    </div>
  );
}
