"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CreateTeamSchema = z.object({
  name: z.string().min(1).max(100),
  school: z.string().max(100).optional(),
  sport: z.string().max(50).optional(),
});

const UpdateRoleSchema = z.object({
  role: z.enum(["admin", "coach", "athlete"]),
});

export async function createTeam(
  name: string,
  school?: string,
  sport?: string
): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  const parsed = CreateTeamSchema.safeParse({ name, school, sport });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("team_accounts")
    .insert({
      name: parsed.data.name,
      school: parsed.data.school ?? null,
      sport: parsed.data.sport ?? null,
      admin_user_id: user.id,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/teams");
  return { ok: true, data };
}

export async function getMyTeams(): Promise<{ ok: boolean; data?: Record<string, unknown>[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("team_accounts")
      .select("*, team_members(id)")
      .eq("admin_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, error: error.message };

    const teamsWithCount = (data ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      memberCount: Array.isArray(t.team_members) ? t.team_members.length : 0,
      team_members: undefined,
    }));

    return { ok: true, data: teamsWithCount };
  } catch (err) {
    console.error("[teams] getMyTeams error:", err);
    return { ok: false, error: "Failed to load teams" };
  }
}

export async function getTeam(teamId: string): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const supabase = getServiceClient();

    // Check if user is team admin
    const { data: team } = await supabase
      .from("team_accounts")
      .select("*")
      .eq("id", teamId)
      .single();

    if (!team) return { ok: false, error: "Team not found" };
    if (team.admin_user_id !== user.id) return { ok: false, error: "Not authorized" };

    const { count } = await supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId);

    return { ok: true, data: { ...team, memberCount: count ?? 0 } };
  } catch (err) {
    console.error("[teams] getTeam error:", err);
    return { ok: false, error: "Failed to load team" };
  }
}

export async function addTeamMember(
  teamId: string,
  athleteId: string,
  role: "admin" | "coach" | "athlete" = "athlete"
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data: team } = await supabase
      .from("team_accounts")
      .select("id")
      .eq("id", teamId)
      .eq("admin_user_id", user.id)
      .single();

    if (!team) return { ok: false, error: "Not authorized" };

    const parsed = UpdateRoleSchema.safeParse({ role });
    if (!parsed.success) return { ok: false, error: "Invalid role" };

    const { error } = await supabase
      .from("team_members")
      .insert({ team_id: teamId, athlete_id: athleteId, role: parsed.data.role });

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/teams/${teamId}`);
    return { ok: true };
  } catch (err) {
    console.error("[teams] addTeamMember error:", err);
    return { ok: false, error: "Failed to add member" };
  }
}

export async function updateTeamMemberRole(
  teamId: string,
  athleteId: string,
  role: "admin" | "coach" | "athlete"
): Promise<{ ok: boolean; error?: string }> {
  try {
    const parsed = UpdateRoleSchema.safeParse({ role });
    if (!parsed.success) return { ok: false, error: "Invalid role" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data: team } = await supabase
      .from("team_accounts")
      .select("id")
      .eq("id", teamId)
      .eq("admin_user_id", user.id)
      .single();

    if (!team) return { ok: false, error: "Only team admins can change roles" };

    const { error } = await supabase
      .from("team_members")
      .update({ role: parsed.data.role })
      .eq("team_id", teamId)
      .eq("athlete_id", athleteId);

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/teams/${teamId}`);
    return { ok: true };
  } catch (err) {
    console.error("[teams] updateTeamMemberRole error:", err);
    return { ok: false, error: "Failed to update role" };
  }
}

export async function removeTeamMember(
  teamId: string,
  athleteId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated" };

    const { data: team } = await supabase
      .from("team_accounts")
      .select("id")
      .eq("id", teamId)
      .eq("admin_user_id", user.id)
      .single();

    if (!team) return { ok: false, error: "Not authorized" };

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("athlete_id", athleteId);

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/teams/${teamId}`);
    return { ok: true };
  } catch (err) {
    console.error("[teams] removeTeamMember error:", err);
    return { ok: false, error: "Failed to remove member" };
  }
}

export async function getTeamMembers(
  teamId: string,
  page = 1,
  pageSize = 20
): Promise<{ ok: boolean; data?: Record<string, unknown>[]; total?: number; error?: string }> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const supabase = getServiceClient();

  // Allow admins, coaches, or members to view roster
  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!team) return { ok: false, error: "Team not found" };

  const isAdmin = team.admin_user_id === user.id;
  if (!isAdmin) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("athlete_id", user.id)
      .single();

    if (!membership) return { ok: false, error: "Not authorized" };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("team_members")
    .select("*, profiles(id, full_name, username, avatar_url, sport, school, plan)", { count: "exact" })
    .eq("team_id", teamId)
    .order("joined_at", { ascending: false })
    .range(from, to);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [], total: count ?? 0 };
}

export async function inviteTeamMember(
  teamId: string,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) return { ok: false, error: "Invalid email" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: team } = await supabase
    .from("team_accounts")
    .select("id, name")
    .eq("id", teamId)
    .eq("admin_user_id", user.id)
    .single();

  if (!team) return { ok: false, error: "Not authorized" };

  const { data: inviter } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const token = crypto.randomUUID();
  const { error } = await supabase
    .from("team_invites")
    .insert({ team_id: teamId, email: parsed.data, token });

  if (error) return { ok: false, error: error.message };

  // Send invite email (non-blocking)
  const { sendTeamInviteEmail } = await import("./emails");
  sendTeamInviteEmail(
    parsed.data,
    team.name,
    inviter?.full_name || "A teammate",
    token
  ).catch(() => {});

  return { ok: true };
}

export async function getTeamInvites(teamId: string): Promise<{ ok: boolean; data?: Record<string, unknown>[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  const isAdmin = team?.admin_user_id === user.id;

  if (!isAdmin) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("athlete_id", user.id)
      .single();

    if (!membership) return { ok: false, error: "Not authorized" };
  }

  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from("team_invites")
    .select("*")
    .eq("team_id", teamId)
    .order("invited_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export type TeamHealthScore = {
  score: number;
  label: string;
  breakdown: { memberActivity: number; engagementRate: number; subscriberHealth: number };
};

export type ViewsOverTime = { date: string; views: number; clicks: number };

export type TopPerformer = {
  athleteId: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  views: number;
  clicks: number;
  subscribers: number;
};

export type TeamAnalytics = {
  totalMembers: number;
  totalViews: number;
  totalClicks: number;
  activeSubscribers: number;
  averageViewsPerAthlete: number;
  averageClicksPerAthlete: number;
  viewsOverTime: ViewsOverTime[];
  topPerformers: TopPerformer[];
  teamHealth: TeamHealthScore;
};

function calculateTeamHealth(
  totalMembers: number,
  athleteIds: string[],
  viewsByAthlete: Map<string, number>,
  clicksByAthlete: Map<string, number>,
  subsByAthlete: Map<string, number>,
  totalViews: number,
  totalClicks: number,
  activeSubscribers: number,
): TeamHealthScore {
  if (totalMembers === 0) {
    return { score: 0, label: "No members", breakdown: { memberActivity: 0, engagementRate: 0, subscriberHealth: 0 } };
  }

  const activeMembers = athleteIds.filter((id) => (viewsByAthlete.get(id) ?? 0) > 0).length;
  const memberActivity = Math.round((activeMembers / totalMembers) * 100);

  const avgViews = totalMembers > 0 ? totalViews / totalMembers : 0;
  const avgClicks = totalMembers > 0 ? totalClicks / totalMembers : 0;
  const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const engagementRate = Math.min(100, Math.round(
    (Math.min(avgViews, 50) / 50) * 40 +
    (Math.min(clickThroughRate, 20) / 20) * 35 +
    (Math.min(avgClicks, 15) / 15) * 25,
  ));

  const subRate = totalMembers > 0 ? (activeSubscribers / totalMembers) * 100 : 0;
  const subscriberHealth = Math.min(100, Math.round(subRate * 5));

  const score = Math.round(memberActivity * 0.35 + engagementRate * 0.40 + subscriberHealth * 0.25);

  let label: string;
  if (score >= 80) label = "Excellent";
  else if (score >= 60) label = "Good";
  else if (score >= 40) label = "Fair";
  else if (score >= 20) label = "Needs attention";
  else label = "Critical";

  return { score, label, breakdown: { memberActivity, engagementRate, subscriberHealth } };
}

export async function getTeamAnalytics(teamId: string): Promise<{
  ok: boolean;
  data?: TeamAnalytics;
  error?: string;
}> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const supabase = getServiceClient();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!team) return { ok: false, error: "Team not found" };
  if (team.admin_user_id !== user.id) return { ok: false, error: "Not authorized" };

  const { count: memberCount } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  const { data: members } = await supabase
    .from("team_members")
    .select("athlete_id, profiles(id, full_name, username, avatar_url)")
    .eq("team_id", teamId);

  const athleteIds = (members ?? []).map((m: { athlete_id: string }) => m.athlete_id);

  if (athleteIds.length === 0) {
    return {
      ok: true,
      data: {
        totalMembers: 0,
        totalViews: 0,
        totalClicks: 0,
        activeSubscribers: 0,
        averageViewsPerAthlete: 0,
        averageClicksPerAthlete: 0,
        viewsOverTime: [],
        topPerformers: [],
        teamHealth: calculateTeamHealth(0, [], new Map(), new Map(), new Map(), 0, 0, 0),
      },
    };
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  const [viewsResult, clicksResult, recentViews, recentClicks] = await Promise.all([
    supabase
      .from("page_views")
      .select("id", { count: "exact", head: true })
      .in("athlete_id", athleteIds),
    supabase
      .from("link_clicks")
      .select("id", { count: "exact", head: true })
      .in("athlete_id", athleteIds),
    supabase
      .from("page_views")
      .select("athlete_id, created_at")
      .in("athlete_id", athleteIds)
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
    supabase
      .from("link_clicks")
      .select("athlete_id, created_at")
      .in("athlete_id", athleteIds)
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
  ]);

  const totalViews = viewsResult.count ?? 0;
  const totalClicks = clicksResult.count ?? 0;
  const activeSubscribers = 0;

  const viewsByAthlete = new Map<string, number>();
  const clicksByAthlete = new Map<string, number>();
  const subsByAthlete = new Map<string, number>();

  const dateMap = new Map<string, { views: number; clicks: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    dateMap.set(d.toISOString().slice(0, 10), { views: 0, clicks: 0 });
  }
  for (const row of (recentViews.data ?? []) as { created_at: string }[]) {
    const key = row.created_at.slice(0, 10);
    const entry = dateMap.get(key);
    if (entry) entry.views += 1;
  }
  for (const row of (recentClicks.data ?? []) as { created_at: string }[]) {
    const key = row.created_at.slice(0, 10);
    const entry = dateMap.get(key);
    if (entry) entry.clicks += 1;
  }
  const viewsOverTime: ViewsOverTime[] = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, views: v.views, clicks: v.clicks }));

  const profileMap = new Map<string, { full_name: string | null; username: string | null; avatar_url: string | null }>();
  for (const m of (members ?? []) as Record<string, unknown>[]) {
    const p = m.profiles as Record<string, unknown> | null;
    profileMap.set(m.athlete_id as string, {
      full_name: (p?.full_name as string) ?? null,
      username: (p?.username as string) ?? null,
      avatar_url: (p?.avatar_url as string) ?? null,
    });
  }

  const topPerformers: TopPerformer[] = athleteIds
    .map((id) => {
      const profile = profileMap.get(id);
      return {
        athleteId: id,
        fullName: profile?.full_name ?? null,
        username: profile?.username ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        views: viewsByAthlete.get(id) ?? 0,
        clicks: clicksByAthlete.get(id) ?? 0,
        subscribers: subsByAthlete.get(id) ?? 0,
      };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const teamHealth = calculateTeamHealth(
    memberCount ?? 0,
    athleteIds,
    viewsByAthlete,
    clicksByAthlete,
    subsByAthlete,
    totalViews,
    totalClicks,
    activeSubscribers,
  );

  return {
    ok: true,
    data: {
      totalMembers: memberCount ?? 0,
      totalViews,
      totalClicks,
      activeSubscribers,
      averageViewsPerAthlete: totalViews / Math.max(athleteIds.length, 1),
      averageClicksPerAthlete: totalClicks / Math.max(athleteIds.length, 1),
      viewsOverTime,
      topPerformers,
      teamHealth,
    },
  };
}

export type TeamMemberAnalytics = {
  athleteId: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  sport: string | null;
  views: number;
  clicks: number;
  subscribers: number;
};

export async function getTeamMemberAnalytics(teamId: string): Promise<{
  ok: boolean;
  data?: TeamMemberAnalytics[];
  error?: string;
}> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const supabase = getServiceClient();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!team) return { ok: false, error: "Team not found" };
  if (team.admin_user_id !== user.id) return { ok: false, error: "Not authorized" };

  const { data: members } = await supabase
    .from("team_members")
    .select("athlete_id, profiles(id, full_name, username, avatar_url, sport)")
    .eq("team_id", teamId);

  if (!members || members.length === 0) {
    return { ok: true, data: [] };
  }

  const athleteIds = members.map((m: { athlete_id: string }) => m.athlete_id);

  const [viewsResult, clicksResult] = await Promise.all([
    supabase
      .from("page_views")
      .select("athlete_id", { count: "exact" })
      .in("athlete_id", athleteIds),
    supabase
      .from("link_clicks")
      .select("athlete_id", { count: "exact" })
      .in("athlete_id", athleteIds),
  ]);

  const viewRows = (viewsResult.data ?? []) as { athlete_id: string }[];
  const clickRows = (clicksResult.data ?? []) as { athlete_id: string }[];

  const viewsByAthlete = new Map<string, number>();
  for (const row of viewRows) {
    viewsByAthlete.set(row.athlete_id, (viewsByAthlete.get(row.athlete_id) ?? 0) + 1);
  }

  const clicksByAthlete = new Map<string, number>();
  for (const row of clickRows) {
    clicksByAthlete.set(row.athlete_id, (clicksByAthlete.get(row.athlete_id) ?? 0) + 1);
  }

  const result: TeamMemberAnalytics[] = members.map((m: Record<string, unknown>) => {
    const p = m.profiles as Record<string, unknown> | null;
    const athleteId = m.athlete_id as string;
    return {
      athleteId,
      fullName: (p?.full_name as string) ?? null,
      username: (p?.username as string) ?? null,
      avatarUrl: (p?.avatar_url as string) ?? null,
      sport: (p?.sport as string) ?? null,
      views: viewsByAthlete.get(athleteId) ?? 0,
      clicks: clicksByAthlete.get(athleteId) ?? 0,
      subscribers: 0,
    };
  });

  return { ok: true, data: result };
}

// ─── Team Chat ────────────────────────────────────────────────────────────────

const SendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000),
});

export type TeamMessage = {
  id: string;
  team_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { full_name: string | null; username: string | null; avatar_url: string | null };
};

export async function sendTeamMessage(
  teamId: string,
  content: string
): Promise<{ ok: boolean; data?: TeamMessage; error?: string }> {
  const parsed = SendMessageSchema.safeParse({ content });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("athlete_id", user.id)
    .single();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!membership && team?.admin_user_id !== user.id) {
    return { ok: false, error: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("team_messages")
    .insert({ team_id: teamId, sender_id: user.id, content: parsed.data.content })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as TeamMessage };
}

export async function getTeamMessages(
  teamId: string,
  page = 1,
  pageSize = 50
): Promise<{ ok: boolean; data?: TeamMessage[]; total?: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("athlete_id", user.id)
    .single();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!membership && team?.admin_user_id !== user.id) {
    return { ok: false, error: "Not authorized" };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("team_messages")
    .select("*, sender:profiles(full_name, username, avatar_url)", { count: "exact" })
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as TeamMessage[], total: count ?? 0 };
}

// ─── Shared Content Library ───────────────────────────────────────────────────

const AddContentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
  content_type: z.enum(["link", "image", "video", "document", "note"]),
  description: z.string().max(500).optional(),
});

export type TeamContentItem = {
  id: string;
  team_id: string;
  uploader_id: string;
  title: string;
  url: string | null;
  content_type: string;
  description: string | null;
  created_at: string;
  uploader?: { full_name: string | null; username: string | null; avatar_url: string | null };
};

export async function addTeamContent(
  teamId: string,
  title: string,
  contentType: string,
  url?: string,
  description?: string
): Promise<{ ok: boolean; data?: TeamContentItem; error?: string }> {
  const parsed = AddContentSchema.safeParse({ title, url: url || undefined, content_type: contentType, description });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("athlete_id", user.id)
    .single();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!membership && team?.admin_user_id !== user.id) {
    return { ok: false, error: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("team_content")
    .insert({
      team_id: teamId,
      uploader_id: user.id,
      title: parsed.data.title,
      url: parsed.data.url || null,
      content_type: parsed.data.content_type,
      description: parsed.data.description || null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as TeamContentItem };
}

export async function getTeamContent(
  teamId: string
): Promise<{ ok: boolean; data?: TeamContentItem[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("athlete_id", user.id)
    .single();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!membership && team?.admin_user_id !== user.id) {
    return { ok: false, error: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("team_content")
    .select("*, uploader:profiles(full_name, username, avatar_url)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as TeamContentItem[] };
}

export async function deleteTeamContent(
  contentId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: item } = await supabase
    .from("team_content")
    .select("team_id, uploader_id")
    .eq("id", contentId)
    .single();

  if (!item) return { ok: false, error: "Not found" };

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", item.team_id)
    .single();

  const isAdmin = team?.admin_user_id === user.id;
  const isUploader = item.uploader_id === user.id;
  if (!isAdmin && !isUploader) return { ok: false, error: "Not authorized" };

  const { error } = await supabase
    .from("team_content")
    .delete()
    .eq("id", contentId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Task Assignment & Tracking ───────────────────────────────────────────────

const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

export type TeamTask = {
  id: string;
  team_id: string;
  creator_id: string;
  assignee_id: string | null;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assignee?: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
  creator?: { full_name: string | null; username: string | null; avatar_url: string | null };
};

export async function createTeamTask(
  teamId: string,
  title: string,
  description?: string,
  assigneeId?: string | null,
  dueDate?: string | null
): Promise<{ ok: boolean; data?: TeamTask; error?: string }> {
  const parsed = CreateTaskSchema.safeParse({
    title,
    description,
    assignee_id: assigneeId || null,
    due_date: dueDate || null,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("athlete_id", user.id)
    .single();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!membership && team?.admin_user_id !== user.id) {
    return { ok: false, error: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("team_tasks")
    .insert({
      team_id: teamId,
      creator_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      assignee_id: parsed.data.assignee_id,
      due_date: parsed.data.due_date,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as TeamTask };
}

export async function getTeamTasks(
  teamId: string
): Promise<{ ok: boolean; data?: TeamTask[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("athlete_id", user.id)
    .single();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!membership && team?.admin_user_id !== user.id) {
    return { ok: false, error: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("team_tasks")
    .select("*, assignee:profiles!team_tasks_assignee_id_fkey(full_name, username, avatar_url), creator:profiles!team_tasks_creator_id_fkey(full_name, username, avatar_url)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as TeamTask[] };
}

export async function updateTeamTaskStatus(
  taskId: string,
  status: "todo" | "in_progress" | "done"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: task } = await supabase
    .from("team_tasks")
    .select("team_id")
    .eq("id", taskId)
    .single();

  if (!task) return { ok: false, error: "Not found" };

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", task.team_id)
    .eq("athlete_id", user.id)
    .single();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", task.team_id)
    .single();

  if (!membership && team?.admin_user_id !== user.id) {
    return { ok: false, error: "Not authorized" };
  }

  const { error } = await supabase
    .from("team_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteTeamTask(
  taskId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: task } = await supabase
    .from("team_tasks")
    .select("team_id, creator_id")
    .eq("id", taskId)
    .single();

  if (!task) return { ok: false, error: "Not found" };

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", task.team_id)
    .single();

  const isAdmin = team?.admin_user_id === user.id;
  const isCreator = task.creator_id === user.id;
  if (!isAdmin && !isCreator) return { ok: false, error: "Not authorized" };

  const { error } = await supabase
    .from("team_tasks")
    .delete()
    .eq("id", taskId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Team Calendar ────────────────────────────────────────────────────────────

const CreateEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  event_date: z.string().min(1, "Date is required"),
  event_type: z.enum(["practice", "game", "meeting", "deadline", "other"]).default("other"),
});

export type TeamEvent = {
  id: string;
  team_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
  created_at: string;
  creator?: { full_name: string | null; username: string | null; avatar_url: string | null };
};

export async function createTeamEvent(
  teamId: string,
  title: string,
  eventDate: string,
  description?: string,
  eventType: string = "other"
): Promise<{ ok: boolean; data?: TeamEvent; error?: string }> {
  const parsed = CreateEventSchema.safeParse({
    title,
    description,
    event_date: eventDate,
    event_type: eventType,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("athlete_id", user.id)
    .single();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!membership && team?.admin_user_id !== user.id) {
    return { ok: false, error: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("team_events")
    .insert({
      team_id: teamId,
      creator_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      event_date: parsed.data.event_date,
      event_type: parsed.data.event_type,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as TeamEvent };
}

export async function getTeamEvents(
  teamId: string
): Promise<{ ok: boolean; data?: TeamEvent[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("athlete_id", user.id)
    .single();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!membership && team?.admin_user_id !== user.id) {
    return { ok: false, error: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("team_events")
    .select("*, creator:profiles(full_name, username, avatar_url)")
    .eq("team_id", teamId)
    .order("event_date", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as TeamEvent[] };
}

export async function deleteTeamEvent(
  eventId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: event } = await supabase
    .from("team_events")
    .select("team_id, creator_id")
    .eq("id", eventId)
    .single();

  if (!event) return { ok: false, error: "Not found" };

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", event.team_id)
    .single();

  const isAdmin = team?.admin_user_id === user.id;
  const isCreator = event.creator_id === user.id;
  if (!isAdmin && !isCreator) return { ok: false, error: "Not authorized" };

  const { error } = await supabase
    .from("team_events")
    .delete()
    .eq("id", eventId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Team Announcements ──────────────────────────────────────────────────────

const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(5000),
});

export type TeamAnnouncement = {
  id: string;
  team_id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
  author?: { full_name: string | null; username: string | null; avatar_url: string | null };
};

export async function createTeamAnnouncement(
  teamId: string,
  title: string,
  content: string
): Promise<{ ok: boolean; data?: TeamAnnouncement; error?: string }> {
  const parsed = CreateAnnouncementSchema.safeParse({ title, content });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!team || team.admin_user_id !== user.id) {
    return { ok: false, error: "Only team admins can post announcements" };
  }

  const { data, error } = await supabase
    .from("team_announcements")
    .insert({
      team_id: teamId,
      author_id: user.id,
      title: parsed.data.title,
      content: parsed.data.content,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as TeamAnnouncement };
}

export async function getTeamAnnouncements(
  teamId: string
): Promise<{ ok: boolean; data?: TeamAnnouncement[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("athlete_id", user.id)
    .single();

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", teamId)
    .single();

  if (!membership && team?.admin_user_id !== user.id) {
    return { ok: false, error: "Not authorized" };
  }

  const { data, error } = await supabase
    .from("team_announcements")
    .select("*, author:profiles(full_name, username, avatar_url)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as TeamAnnouncement[] };
}

export async function deleteTeamAnnouncement(
  announcementId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: announcement } = await supabase
    .from("team_announcements")
    .select("team_id, author_id")
    .eq("id", announcementId)
    .single();

  if (!announcement) return { ok: false, error: "Not found" };

  const { data: team } = await supabase
    .from("team_accounts")
    .select("admin_user_id")
    .eq("id", announcement.team_id)
    .single();

  const isAdmin = team?.admin_user_id === user.id;
  const isAuthor = announcement.author_id === user.id;
  if (!isAdmin && !isAuthor) return { ok: false, error: "Not authorized" };

  const { error } = await supabase
    .from("team_announcements")
    .delete()
    .eq("id", announcementId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
