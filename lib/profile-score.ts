import type { Profile } from "@/lib/actions/profile";

export function getProfileCompletion(profile: Profile): {
  score: number;
  missing: string[];
} {
  const checks: { field: string; filled: boolean }[] = [
    { field: "Full name", filled: !!profile.full_name },
    { field: "Sport", filled: !!profile.sport },
    { field: "School", filled: !!profile.school },
    { field: "Position", filled: !!profile.position },
    { field: "Class year", filled: !!profile.class_year },
    { field: "Bio", filled: !!profile.bio },
    { field: "Avatar", filled: !!profile.avatar_url },
    { field: "Stats", filled: (profile.stats?.length || 0) > 0 },
    { field: "Links", filled: (profile.links?.length || 0) > 0 },
    { field: "Social", filled: Object.keys(profile.social || {}).length > 0 },
    { field: "Highlights", filled: (profile.highlights?.length || 0) > 0 },
  ];

  const filled = checks.filter((c) => c.filled).length;
  const score = Math.round((filled / checks.length) * 100);
  const missing = checks.filter((c) => !c.filled).map((c) => c.field);

  return { score, missing };
}
