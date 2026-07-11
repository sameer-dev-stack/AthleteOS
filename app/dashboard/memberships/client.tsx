"use client";

import { Users, FileText } from "lucide-react";
import { MembershipTiers } from "@/components/dashboard/membership-tiers";
import { ContentPosts } from "@/components/dashboard/content-posts";
import type { Profile } from "@/lib/actions/profile";

export function MembershipsClient({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Memberships</h1>
        <p className="mt-1.5 text-sm text-white/40">
          Create tiers, publish exclusive content, and grow your subscriber base.
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-white">Membership Tiers</h2>
        </div>
        <MembershipTiers athleteId={profile.id} />
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-white">Content Posts</h2>
        </div>
        <ContentPosts athleteId={profile.id} />
      </div>
    </div>
  );
}
