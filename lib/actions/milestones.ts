"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

function getAdmin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type Milestone = {
  id: string;
  profile_id: string;
  milestone_type: string;
  title: string;
  description: string | null;
  value: number | null;
  achieved_at: string;
};

const MILESTONE_DEFINITIONS: Record<string, { title: string; description: (val?: number) => string }> = {
  first_tip: {
    title: "First tip received!",
    description: (v) => `You earned your first $${((v || 0) / 100).toFixed(2)} tip.`,
  },
  first_100_views: {
    title: "100 profile views",
    description: () => "Your athlete card has been viewed 100 times.",
  },
  first_1000_views: {
    title: "1,000 profile views",
    description: () => "Your athlete card has been viewed 1,000 times.",
  },
  first_10000_views: {
    title: "10,000 profile views",
    description: () => "Your athlete card has been viewed 10,000 times.",
  },
  first_link_click: {
    title: "First link click",
    description: () => "Someone clicked a link on your card.",
  },
  profile_50_percent: {
    title: "Profile halfway there",
    description: () => "Your profile completion score hit 50%.",
  },
  profile_100_percent: {
    title: "Profile complete!",
    description: () => "Your profile is 100% complete.",
  },
  first_ai_save: {
    title: "First AI output saved",
    description: () => "You saved your first AI-generated content.",
  },
  nil_score_20: {
    title: "NIL score: Growing",
    description: () => "Your NIL value score reached 20+.",
  },
  nil_score_50: {
    title: "NIL score: Established",
    description: () => "Your NIL value score reached 50+.",
  },
  nil_score_80: {
    title: "NIL score: Elite",
    description: () => "Your NIL value score reached 80+.",
  },
  first_brand_inquiry: {
    title: "First brand inquiry",
    description: () => "A brand reached out to you for the first time.",
  },
  streak_7_days: {
    title: "7-day streak",
    description: () => "You've been active on NIL CARD for 7 consecutive days.",
  },
};

/**
 * Award a milestone to an athlete. Idempotent — won't double-award.
 * Returns { awarded: true } if this is a new milestone, { awarded: false } if already exists.
 */
export async function awardMilestone(
  profileId: string,
  milestoneType: string,
  value?: number
): Promise<{ awarded: boolean; milestone?: Milestone }> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== profileId) return { awarded: false };

    const admin = getAdmin();
    const def = MILESTONE_DEFINITIONS[milestoneType];
    if (!def) return { awarded: false };

    const { data: existing } = await admin
      .from("milestones")
      .select("id")
      .eq("profile_id", profileId)
      .eq("milestone_type", milestoneType)
      .limit(1);

    if (existing && existing.length > 0) return { awarded: false };

    const { data, error } = await admin
      .from("milestones")
      .insert({
        profile_id: profileId,
        milestone_type: milestoneType,
        title: def.title,
        description: def.description(value),
        value: value ?? null,
      })
      .select()
      .single();

    if (error) {
      // Unique constraint violation = concurrent insert won the race — not an error
      if (error.code === "23505") return { awarded: false };
      console.error("[milestones] awardMilestone failed:", error.message);
      return { awarded: false };
    }

    return { awarded: true, milestone: data as Milestone };
  } catch {
    return { awarded: false };
  }
}

/**
 * Get all milestones for the current athlete, newest first.
 */
export async function getMilestones(): Promise<{ ok: boolean; data?: Milestone[]; error?: string }> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const admin = getAdmin();
    const { data, error } = await admin
      .from("milestones")
      .select("*")
      .eq("profile_id", user.id)
      .order("achieved_at", { ascending: false });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Milestone[] };
  } catch {
    return { ok: false, error: "Failed to load milestones" };
  }
}

/**
 * Get the count of milestones earned.
 */
export async function getMilestoneCount(): Promise<number> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const admin = getAdmin();
    const { count } = await admin
      .from("milestones")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id);

    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Check and award milestones based on current state.
 * Called after key events (tip received, view tracked, profile updated, etc.)
 */
export async function checkMilestones(profileId: string): Promise<Milestone[]> {
  const awarded: Milestone[] = [];

  try {
    const admin = getAdmin();

    // Check view milestones
    const { count: totalViews } = await admin
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", profileId);

    const views = totalViews || 0;
    if (views >= 100) {
      const r = await awardMilestone(profileId, "first_100_views");
      if (r.awarded && r.milestone) awarded.push(r.milestone);
    }
    if (views >= 1000) {
      const r = await awardMilestone(profileId, "first_1000_views");
      if (r.awarded && r.milestone) awarded.push(r.milestone);
    }
    if (views >= 10000) {
      const r = await awardMilestone(profileId, "first_10000_views");
      if (r.awarded && r.milestone) awarded.push(r.milestone);
    }

    // Check click milestones
    const { count: totalClicks } = await admin
      .from("link_clicks")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", profileId);

    if ((totalClicks || 0) >= 1) {
      const r = await awardMilestone(profileId, "first_link_click");
      if (r.awarded && r.milestone) awarded.push(r.milestone);
    }

    // Check tip milestones
    const { count: tipCount } = await admin
      .from("tips")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", profileId)
      .eq("status", "succeeded");

    if ((tipCount || 0) >= 1) {
      const { data: firstTip } = await admin
        .from("tips")
        .select("amount")
        .eq("athlete_id", profileId)
        .eq("status", "succeeded")
        .order("created_at", { ascending: true })
        .limit(1);

      const r = await awardMilestone(profileId, "first_tip", firstTip?.[0]?.amount);
      if (r.awarded && r.milestone) awarded.push(r.milestone);
    }

    // Check brand inquiry milestones
    const { count: inquiryCount } = await admin
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", profileId);

    if ((inquiryCount || 0) >= 1) {
      const r = await awardMilestone(profileId, "first_brand_inquiry");
      if (r.awarded && r.milestone) awarded.push(r.milestone);
    }

    // Check AI save milestones
    const { count: assetCount } = await admin
      .from("ai_saved_assets")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId);

    if ((assetCount || 0) >= 1) {
      const r = await awardMilestone(profileId, "first_ai_save");
      if (r.awarded && r.milestone) awarded.push(r.milestone);
    }

  } catch (err) {
    console.error("[milestones] checkMilestones error:", err);
  }

  return awarded;
}
