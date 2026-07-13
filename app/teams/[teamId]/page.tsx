"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  Users, BarChart3, ExternalLink, Mail, Loader2, Check, ArrowUpDown, Shield,
  UserCog, ChevronDown, Trash2, TrendingUp, Target, Heart, MessageSquare,
  FolderOpen, ListTodo, Calendar, Megaphone, Send, Plus, Link2, FileText,
  Image as ImageIcon, Video, StickyNote, Clock, CheckCircle2, Circle,
  PlayCircle, X, AlertCircle, ChevronRight,
} from "lucide-react";
import {
  getTeam, getTeamMembers, getTeamAnalytics, getTeamMemberAnalytics,
  inviteTeamMember, updateTeamMemberRole, removeTeamMember,
  sendTeamMessage, getTeamMessages,
  addTeamContent, getTeamContent, deleteTeamContent,
  createTeamTask, getTeamTasks, updateTeamTaskStatus, deleteTeamTask,
  createTeamEvent, getTeamEvents, deleteTeamEvent,
  createTeamAnnouncement, getTeamAnnouncements, deleteTeamAnnouncement,
} from "@/lib/actions/teams";
import type {
  TeamMemberAnalytics, TeamAnalytics as TeamAnalyticsData,
  TeamMessage, TeamContentItem, TeamTask, TeamEvent, TeamAnnouncement,
} from "@/lib/actions/teams";

type TeamData = { id: string; name: string; school: string | null; sport: string | null; memberCount: number; admin_user_id: string };
type TeamMemberRole = "admin" | "coach" | "athlete";

const ROLE_LABELS: Record<TeamMemberRole, string> = {
  admin: "Admin",
  coach: "Coach",
  athlete: "Athlete",
};

const ROLE_STYLES: Record<TeamMemberRole, string> = {
  admin: "bg-accent/15 text-accent",
  coach: "bg-blue-500/15 text-blue-400",
  athlete: "bg-white/[0.06] text-ink-muted",
};

type SortField = "fullName" | "views" | "clicks" | "subscribers";
type SortDir = "asc" | "desc";

type Tab = "overview" | "chat" | "content" | "tasks" | "calendar" | "announcements";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "content", label: "Content", icon: FolderOpen },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "announcements", label: "Announcements", icon: Megaphone },
];

const CONTENT_TYPE_ICONS: Record<string, typeof Link2> = {
  link: Link2,
  image: ImageIcon,
  video: Video,
  document: FileText,
  note: StickyNote,
};

const TASK_STATUS_CONFIG: Record<string, { label: string; icon: typeof Circle; color: string }> = {
  todo: { label: "To Do", icon: Circle, color: "text-ink-muted" },
  in_progress: { label: "In Progress", icon: PlayCircle, color: "text-blue-400" },
  done: { label: "Done", icon: CheckCircle2, color: "text-accent" },
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  practice: "bg-blue-500/15 text-blue-400",
  game: "bg-accent/15 text-accent",
  meeting: "bg-purple-500/15 text-purple-400",
  deadline: "bg-red-500/15 text-red-400",
  other: "bg-white/[0.06] text-ink-muted",
};

export default function TeamDashboardPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [team, setTeam] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<Record<string, unknown>[]>([]);
  const [analytics, setAnalytics] = useState<TeamAnalyticsData | null>(null);
  const [memberAnalytics, setMemberAnalytics] = useState<TeamMemberAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [sortField, setSortField] = useState<SortField>("views");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [teamResult, membersResult, analyticsResult, memberAnalyticsResult] = await Promise.all([
          getTeam(teamId),
          getTeamMembers(teamId, 1, 50),
          getTeamAnalytics(teamId),
          getTeamMemberAnalytics(teamId),
        ]);
        if (cancelled) return;
        if (teamResult.ok && teamResult.data) setTeam(teamResult.data as TeamData);
        if (membersResult.ok && membersResult.data) setMembers(membersResult.data);
        if (analyticsResult.ok && analyticsResult.data) setAnalytics(analyticsResult.data);
        if (memberAnalyticsResult.ok && memberAnalyticsResult.data) setMemberAnalytics(memberAnalyticsResult.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [teamId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  async function handleRoleChange(athleteId: string, newRole: TeamMemberRole) {
    setUpdatingRole(athleteId);
    const result = await updateTeamMemberRole(teamId, athleteId, newRole);
    if (result.ok) {
      setMembers((prev) =>
        prev.map((m) =>
          m.athlete_id === athleteId ? { ...m, role: newRole } : m
        )
      );
    }
    setUpdatingRole(null);
    setRoleDropdownOpen(null);
  }

  async function handleRemoveMember(athleteId: string) {
    setRemovingMember(athleteId);
    const result = await removeTeamMember(teamId, athleteId);
    if (result.ok) {
      setMembers((prev) => prev.filter((m) => m.athlete_id !== athleteId));
    }
    setRemovingMember(null);
  }

  const sortedMemberAnalytics = useMemo(() => {
    const copy = [...memberAnalytics];
    copy.sort((a, b) => {
      let cmp: number;
      if (sortField === "fullName") {
        cmp = (a.fullName ?? "").localeCompare(b.fullName ?? "");
      } else {
        cmp = a[sortField] - b[sortField];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [memberAnalytics, sortField, sortDir]);

  if (loading) {
    return <div className="min-h-screen bg-bg"><div className="container-tight py-12"><div className="h-96 rounded-xl border border-white/[0.06] bg-[#0D0D0F] animate-pulse" /></div></div>;
  }

  if (!team) {
    return <div className="min-h-screen bg-bg"><div className="container-tight py-20 text-center"><p className="text-ink-muted">Team not found</p></div></div>;
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const result = await inviteTeamMember(teamId, inviteEmail.trim());
    if (result.ok) {
      setInviteSent(true);
      setInviteEmail("");
      setTimeout(() => setInviteSent(false), 3000);
    }
    setInviting(false);
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="container-tight py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{team.name}</h1>
            <p className="text-sm text-ink-muted">{team.sport} {team.school && `· ${team.school}`}</p>
          </div>
          <a href={`/teams/${teamId}`} className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-4 py-2 text-sm text-ink-muted hover:text-white transition-colors">
            <ExternalLink className="h-4 w-4" />
            Public page
          </a>
        </div>

        <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-[#111113] p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-accent text-bg shadow-[0_0_12px_-4px_rgba(198,255,61,0.5)]"
                    : "text-ink-muted hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <OverviewTab
            teamId={teamId}
            team={team}
            analytics={analytics}
            members={members}
            sortedMemberAnalytics={sortedMemberAnalytics}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            inviting={inviting}
            inviteSent={inviteSent}
            handleInvite={handleInvite}
            sortField={sortField}
            sortDir={sortDir}
            toggleSort={toggleSort}
            roleDropdownOpen={roleDropdownOpen}
            setRoleDropdownOpen={setRoleDropdownOpen}
            updatingRole={updatingRole}
            removingMember={removingMember}
            dropdownRef={dropdownRef}
            handleRoleChange={handleRoleChange}
            handleRemoveMember={handleRemoveMember}
          />
        )}

        {activeTab === "chat" && <ChatTab teamId={teamId} />}
        {activeTab === "content" && <ContentTab teamId={teamId} />}
        {activeTab === "tasks" && <TasksTab teamId={teamId} />}
        {activeTab === "calendar" && <CalendarTab teamId={teamId} />}
        {activeTab === "announcements" && <AnnouncementsTab teamId={teamId} />}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  teamId, team, analytics, members, sortedMemberAnalytics, inviteEmail, setInviteEmail,
  inviting, inviteSent, handleInvite, sortField, sortDir, toggleSort, roleDropdownOpen,
  setRoleDropdownOpen, updatingRole, removingMember, dropdownRef, handleRoleChange, handleRemoveMember,
}: {
  teamId: string; team: TeamData; analytics: TeamAnalyticsData | null;
  members: Record<string, unknown>[]; sortedMemberAnalytics: TeamMemberAnalytics[];
  inviteEmail: string; setInviteEmail: (v: string) => void;
  inviting: boolean; inviteSent: boolean; handleInvite: () => void;
  sortField: SortField; sortDir: SortDir; toggleSort: (f: SortField) => void;
  roleDropdownOpen: string | null; setRoleDropdownOpen: (v: string | null) => void;
  updatingRole: string | null; removingMember: string | null;
  dropdownRef: React.Ref<HTMLDivElement>;
  handleRoleChange: (id: string, role: TeamMemberRole) => void;
  handleRemoveMember: (id: string) => void;
}) {
  return (
    <>
      {analytics && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
              <Users className="h-5 w-5 text-accent" />
              <p className="mt-2 text-2xl font-bold text-white">{analytics.totalMembers}</p>
              <p className="text-xs text-ink-dim">Members</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
              <BarChart3 className="h-5 w-5 text-accent" />
              <p className="mt-2 text-2xl font-bold text-white">{analytics.totalViews.toLocaleString()}</p>
              <p className="text-xs text-ink-dim">Total Views</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
              <TrendingUp className="h-5 w-5 text-accent" />
              <p className="mt-2 text-2xl font-bold text-white">{analytics.totalClicks.toLocaleString()}</p>
              <p className="text-xs text-ink-dim">Total Clicks</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
              <Users className="h-5 w-5 text-accent" />
              <p className="mt-2 text-2xl font-bold text-white">{analytics.activeSubscribers}</p>
              <p className="text-xs text-ink-dim">Subscribers</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-5">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-accent" />
                <h3 className="text-sm font-medium text-white">Team Health</h3>
              </div>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-4xl font-bold text-white">{analytics.teamHealth.score}</span>
                <span className="mb-1 text-sm text-ink-dim">/ 100</span>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{analytics.teamHealth.label}</p>
              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-dim">Member activity</span>
                    <span className="text-ink-muted">{analytics.teamHealth.breakdown.memberActivity}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${analytics.teamHealth.breakdown.memberActivity}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-dim">Engagement</span>
                    <span className="text-ink-muted">{analytics.teamHealth.breakdown.engagementRate}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${analytics.teamHealth.breakdown.engagementRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-dim">Subscriber health</span>
                    <span className="text-ink-muted">{analytics.teamHealth.breakdown.subscriberHealth}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${analytics.teamHealth.breakdown.subscriberHealth}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-5 sm:col-span-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                <h3 className="text-sm font-medium text-white">Averages per Athlete</h3>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-white">{analytics.averageViewsPerAthlete.toFixed(1)}</p>
                  <p className="text-xs text-ink-dim">Avg views / athlete</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{analytics.averageClicksPerAthlete.toFixed(1)}</p>
                  <p className="text-xs text-ink-dim">Avg clicks / athlete</p>
                </div>
              </div>
            </div>
          </div>

          {analytics.viewsOverTime.length > 0 && (
            <div className="mt-8 rounded-xl border border-white/[0.06] bg-[#111113] p-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                <h3 className="text-sm font-medium text-white">Views over time (30 days)</h3>
              </div>
              <div className="mt-4 flex items-end gap-[3px]" style={{ height: 120 }}>
                {analytics.viewsOverTime.map((d) => {
                  const maxViews = Math.max(...analytics.viewsOverTime.map((v) => v.views), 1);
                  const height = (d.views / maxViews) * 100;
                  return (
                    <div
                      key={d.date}
                      className="group relative flex-1"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    >
                      <div className="h-full w-full rounded-t-sm bg-accent/70 transition-colors hover:bg-accent" />
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1a1a1e] px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        {d.date.slice(5)}: {d.views} views, {d.clicks} clicks
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-ink-dim">
                <span>{analytics.viewsOverTime[0]?.date.slice(5)}</span>
                <span>{analytics.viewsOverTime[analytics.viewsOverTime.length - 1]?.date.slice(5)}</span>
              </div>
            </div>
          )}

          {analytics.topPerformers.length > 0 && (
            <div className="mt-8 rounded-xl border border-white/[0.06] bg-[#111113] p-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <h3 className="text-sm font-medium text-white">Top performers</h3>
              </div>
              <div className="mt-4 space-y-3">
                {analytics.topPerformers.map((p, i) => (
                  <div key={p.athleteId} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-ink-dim">
                      {i + 1}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                      {p.avatarUrl
                        ? <Image src={p.avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                        : (p.fullName ?? "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{p.fullName ?? "Unnamed"}</p>
                      {p.username && <p className="text-xs text-ink-dim">/{p.username}</p>}
                    </div>
                    <div className="flex gap-4 text-xs text-ink-muted">
                      <span>{p.views} views</span>
                      <span>{p.clicks} clicks</span>
                      <span>{p.subscribers} subs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white">Roster ({members.length})</h2>
        <div className="mt-4 divide-y divide-white/[0.04] rounded-xl border border-white/[0.06] bg-[#111113]">
          {members.map((m) => {
            const p = m.profiles as Record<string, unknown> | null;
            const memberRole = (m.role as TeamMemberRole) || "athlete";
            const isOpen = roleDropdownOpen === (m.athlete_id as string);
            const isUpdating = updatingRole === (m.athlete_id as string);
            const isRemoving = removingMember === (m.athlete_id as string);
            return (
              <div key={m.id as string} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                  {p?.avatar_url ? <Image src={p.avatar_url as string} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" /> : ((p?.full_name as string) || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{(p?.full_name as string) || "Unnamed"}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_STYLES[memberRole]}`}>
                      {memberRole === "admin" && <Shield className="h-2.5 w-2.5" />}
                      {ROLE_LABELS[memberRole]}
                    </span>
                  </div>
                  {p?.username ? <p className="text-xs text-ink-dim">/{p.username as string}</p> : null}
                </div>
                {p?.sport ? <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-ink-muted">{p.sport as string}</span> : null}
                <div className="relative" ref={isOpen ? dropdownRef : undefined}>
                  <button
                    onClick={() => setRoleDropdownOpen(isOpen ? null : (m.athlete_id as string))}
                    disabled={isUpdating}
                    className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs text-ink-muted hover:text-white hover:border-white/[0.15] transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCog className="h-3 w-3" />}
                    <span className="hidden sm:inline">Role</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {isOpen && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-white/[0.08] bg-[#1a1a1e] py-1 shadow-xl">
                      {(Object.keys(ROLE_LABELS) as TeamMemberRole[]).map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(m.athlete_id as string, role)}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                            memberRole === role
                              ? "text-accent bg-accent/10"
                              : "text-ink-muted hover:text-white hover:bg-white/[0.04]"
                          }`}
                        >
                          {role === "admin" && <Shield className="h-3 w-3" />}
                          {role === "coach" && <UserCog className="h-3 w-3" />}
                          {ROLE_LABELS[role]}
                        </button>
                      ))}
                      <div className="my-1 border-t border-white/[0.06]" />
                      <button
                        onClick={() => handleRemoveMember(m.athlete_id as string)}
                        disabled={isRemoving}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                {p?.username ? <a href={`/${p.username as string}`} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">View</a> : null}
              </div>
            );
          })}
          {members.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-dim">No members yet</p>}
        </div>
      </div>

      {sortedMemberAnalytics.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white">Member Analytics</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-[#111113]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs text-ink-dim">
                  <th className="px-4 py-3 font-medium">Athlete</th>
                  <th className="px-4 py-3 font-medium">
                    <button onClick={() => toggleSort("views")} className="flex items-center gap-1 hover:text-white transition-colors">
                      Views <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button onClick={() => toggleSort("clicks")} className="flex items-center gap-1 hover:text-white transition-colors">
                      Clicks <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button onClick={() => toggleSort("subscribers")} className="flex items-center gap-1 hover:text-white transition-colors">
                      Subscribers <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sortedMemberAnalytics.map((m) => (
                  <tr key={m.athleteId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                          {m.avatarUrl ? <Image src={m.avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" /> : (m.fullName ?? "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{m.fullName ?? "Unnamed"}</p>
                          {m.username && <p className="text-xs text-ink-dim">/{m.username}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{m.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-white">{m.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-white">{m.subscribers.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white">Invite Member</h2>
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#111113] p-4">
          <p className="text-sm text-ink-muted mb-3">Send an email invitation to join your team.</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="athlete@school.edu"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_16px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50 flex items-center gap-2"
            >
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : inviteSent ? <Check className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              {inviteSent ? "Sent!" : "Invite"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

function ChatTab({ teamId }: { teamId: string }) {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const result = await getTeamMessages(teamId);
    if (result.ok && result.data) setMessages(result.data);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { queueMicrotask(() => loadMessages()); }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const result = await sendTeamMessage(teamId, newMessage.trim());
    if (result.ok && result.data) {
      setMessages((prev) => [result.data!, ...prev]);
      setNewMessage("");
    }
    setSending(false);
  }

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
          <MessageSquare className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">Team Chat</h2>
        </div>

        <div className="h-[500px] overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-ink-dim" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-ink-dim">
              <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                  {msg.sender?.avatar_url
                    ? <Image src={msg.sender.avatar_url} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                    : (msg.sender?.full_name ?? msg.sender_id)[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-white">{msg.sender?.full_name || "Unknown"}</span>
                    <span className="text-[10px] text-ink-dim">{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/[0.06] px-5 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_16px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Content Library Tab ──────────────────────────────────────────────────────

function ContentTab({ teamId }: { teamId: string }) {
  const [items, setItems] = useState<TeamContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [contentType, setContentType] = useState("link");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    const result = await getTeamContent(teamId);
    if (result.ok && result.data) setItems(result.data);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { queueMicrotask(() => loadContent()); }, [loadContent]);

  async function handleAdd() {
    if (!title.trim() || adding) return;
    setAdding(true);
    const result = await addTeamContent(teamId, title.trim(), contentType, url.trim() || undefined, description.trim() || undefined);
    if (result.ok && result.data) {
      setItems((prev) => [result.data!, ...prev]);
      setTitle(""); setUrl(""); setDescription(""); setShowAdd(false);
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteTeamContent(id);
    if (result.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-white">Content Library</h2>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-all hover:shadow-[0_0_12px_-4px_rgba(198,255,61,0.5)]"
          >
            {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAdd ? "Cancel" : "Add"}
          </button>
        </div>

        {showAdd && (
          <div className="border-b border-white/[0.06] px-5 py-4 space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
            />
            <div className="flex gap-2">
              {(["link", "image", "video", "document", "note"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setContentType(t)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    contentType === t
                      ? "bg-accent text-bg"
                      : "bg-white/[0.06] text-ink-muted hover:text-white"
                  }`}
                >
                  {t === "link" && <Link2 className="h-3 w-3" />}
                  {t === "image" && <ImageIcon className="h-3 w-3" />}
                  {t === "video" && <Video className="h-3 w-3" />}
                  {t === "document" && <FileText className="h-3 w-3" />}
                  {t === "note" && <StickyNote className="h-3 w-3" />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL (optional)"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none resize-none"
            />
            <button
              onClick={handleAdd}
              disabled={!title.trim() || adding}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_12px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50 flex items-center gap-2"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save
            </button>
          </div>
        )}

        <div className="divide-y divide-white/[0.04]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-ink-dim" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-ink-dim">
              <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No content shared yet</p>
            </div>
          ) : (
            items.map((item) => {
              const TypeIcon = CONTENT_TYPE_ICONS[item.content_type] || Link2;
              return (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-ink-muted">
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-ink-dim">{item.content_type}</span>
                    </div>
                    {item.description && <p className="text-xs text-ink-dim mt-0.5 truncate">{item.description}</p>}
                    {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline mt-0.5 inline-block truncate max-w-full">{item.url}</a>}
                    <p className="text-[10px] text-ink-dim mt-0.5">
                      {item.uploader?.full_name || "Unknown"} · {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="shrink-0 rounded-lg p-1.5 text-ink-dim hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ teamId }: { teamId: string }) {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    const result = await getTeamTasks(teamId);
    if (result.ok && result.data) setTasks(result.data);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { queueMicrotask(() => loadTasks()); }, [loadTasks]);

  async function handleAdd() {
    if (!title.trim() || adding) return;
    setAdding(true);
    const result = await createTeamTask(teamId, title.trim(), description.trim() || undefined, null, dueDate || undefined);
    if (result.ok && result.data) {
      setTasks((prev) => [result.data!, ...prev]);
      setTitle(""); setDescription(""); setDueDate(""); setShowAdd(false);
    }
    setAdding(false);
  }

  async function handleStatusChange(taskId: string, status: "todo" | "in_progress" | "done") {
    const result = await updateTeamTaskStatus(taskId, status);
    if (result.ok) {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t));
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteTeamTask(id);
    if (result.ok) setTasks((prev) => prev.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  const groupedTasks = useMemo(() => {
    const groups: Record<string, TeamTask[]> = { todo: [], in_progress: [], done: [] };
    for (const task of tasks) {
      (groups[task.status] ?? groups.todo).push(task);
    }
    return groups;
  }, [tasks]);

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-white">Tasks</h2>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-ink-dim">{tasks.length}</span>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-all hover:shadow-[0_0_12px_-4px_rgba(198,255,61,0.5)]"
          >
            {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAdd ? "Cancel" : "New Task"}
          </button>
        </div>

        {showAdd && (
          <div className="border-b border-white/[0.06] px-5 py-4 space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none resize-none"
            />
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-ink-dim" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-accent/40 focus:outline-none [color-scheme:dark]"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!title.trim() || adding}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_12px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50 flex items-center gap-2 ml-auto"
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-ink-dim" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-dim">
            <ListTodo className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No tasks yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {(["todo", "in_progress", "done"] as const).map((status) => {
              const group = groupedTasks[status];
              if (group.length === 0) return null;
              const config = TASK_STATUS_CONFIG[status];
              const StatusIcon = config.icon;
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.01]">
                    <StatusIcon className={`h-3.5 w-3.5 ${config.color}`} />
                    <span className="text-xs font-medium text-ink-dim uppercase tracking-wider">{config.label}</span>
                    <span className="text-[10px] text-ink-dim">({group.length})</span>
                  </div>
                  {group.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <button
                        onClick={() => {
                          const next = status === "todo" ? "in_progress" : status === "in_progress" ? "done" : "todo";
                          handleStatusChange(task.id, next);
                        }}
                        className="shrink-0"
                      >
                        <StatusIcon className={`h-4 w-4 ${config.color} hover:opacity-80`} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${status === "done" ? "text-ink-dim line-through" : "text-white"}`}>{task.title}</p>
                        {task.description && <p className="text-xs text-ink-dim mt-0.5 truncate">{task.description}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          {task.due_date && (
                            <span className="flex items-center gap-1 text-[10px] text-ink-dim">
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {task.assignee && (
                            <span className="text-[10px] text-ink-dim">
                              Assigned to {task.assignee.full_name || "Unknown"}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(task.id)}
                        disabled={deletingId === task.id}
                        className="shrink-0 rounded-lg p-1.5 text-ink-dim hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {deletingId === task.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

function CalendarTab({ teamId }: { teamId: string }) {
  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("other");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    const result = await getTeamEvents(teamId);
    if (result.ok && result.data) setEvents(result.data);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { queueMicrotask(() => loadEvents()); }, [loadEvents]);

  async function handleAdd() {
    if (!title.trim() || !eventDate || adding) return;
    setAdding(true);
    const result = await createTeamEvent(teamId, title.trim(), eventDate, description.trim() || undefined, eventType);
    if (result.ok && result.data) {
      setEvents((prev) => [...prev, result.data!].sort((a, b) => a.event_date.localeCompare(b.event_date)));
      setTitle(""); setEventDate(""); setDescription(""); setShowAdd(false);
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteTeamEvent(id);
    if (result.ok) setEvents((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  const now = new Date().toISOString();
  const upcoming = events.filter((e) => e.event_date >= now);
  const past = events.filter((e) => e.event_date < now);

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-white">Team Calendar</h2>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-all hover:shadow-[0_0_12px_-4px_rgba(198,255,61,0.5)]"
          >
            {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAdd ? "Cancel" : "New Event"}
          </button>
        </div>

        {showAdd && (
          <div className="border-b border-white/[0.06] px-5 py-4 space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
            />
            <div className="flex gap-2">
              {(["practice", "game", "meeting", "deadline", "other"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setEventType(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    eventType === t
                      ? EVENT_TYPE_COLORS[t] + " ring-1 ring-current"
                      : "bg-white/[0.06] text-ink-muted hover:text-white"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-accent/40 focus:outline-none [color-scheme:dark]"
              />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none resize-none"
            />
            <button
              onClick={handleAdd}
              disabled={!title.trim() || !eventDate || adding}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_12px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50 flex items-center gap-2"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-ink-dim" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink-dim">
            <Calendar className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No events scheduled</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {upcoming.length > 0 && (
              <>
                <div className="px-5 py-2.5 bg-white/[0.01]">
                  <span className="text-xs font-medium text-ink-dim uppercase tracking-wider">Upcoming</span>
                </div>
                {upcoming.map((event) => {
                  const typeColor = EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.other;
                  const eventDate = new Date(event.event_date);
                  return (
                    <div key={event.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="shrink-0 text-center min-w-[48px]">
                        <p className="text-lg font-bold text-white">{eventDate.getDate()}</p>
                        <p className="text-[10px] text-ink-dim uppercase">{eventDate.toLocaleDateString("en-US", { month: "short" })}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{event.title}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColor}`}>
                            {event.event_type}
                          </span>
                        </div>
                        {event.description && <p className="text-xs text-ink-dim mt-0.5 truncate">{event.description}</p>}
                        <p className="text-[10px] text-ink-dim mt-0.5">
                          {eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          {event.creator && ` · ${event.creator.full_name || "Unknown"}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="shrink-0 rounded-lg p-1.5 text-ink-dim hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {deletingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
            {past.length > 0 && (
              <>
                <div className="px-5 py-2.5 bg-white/[0.01]">
                  <span className="text-xs font-medium text-ink-dim uppercase tracking-wider">Past</span>
                </div>
                {past.map((event) => {
                  const typeColor = EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.other;
                  const eventDate = new Date(event.event_date);
                  return (
                    <div key={event.id} className="flex items-center gap-4 px-5 py-3 opacity-50 hover:bg-white/[0.02] transition-colors">
                      <div className="shrink-0 text-center min-w-[48px]">
                        <p className="text-lg font-bold text-ink-dim">{eventDate.getDate()}</p>
                        <p className="text-[10px] text-ink-dim uppercase">{eventDate.toLocaleDateString("en-US", { month: "short" })}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-ink-dim line-through">{event.title}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColor}`}>
                            {event.event_type}
                          </span>
                        </div>
                        {event.description && <p className="text-xs text-ink-dim mt-0.5 truncate">{event.description}</p>}
                      </div>
                      <button
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="shrink-0 rounded-lg p-1.5 text-ink-dim hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {deletingId === event.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Announcements Tab ────────────────────────────────────────────────────────

function AnnouncementsTab({ teamId }: { teamId: string }) {
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async () => {
    const result = await getTeamAnnouncements(teamId);
    if (result.ok && result.data) setAnnouncements(result.data);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { queueMicrotask(() => loadAnnouncements()); }, [loadAnnouncements]);

  async function handleAdd() {
    if (!title.trim() || !content.trim() || adding) return;
    setAdding(true);
    const result = await createTeamAnnouncement(teamId, title.trim(), content.trim());
    if (result.ok && result.data) {
      setAnnouncements((prev) => [result.data!, ...prev]);
      setTitle(""); setContent(""); setShowAdd(false);
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteTeamAnnouncement(id);
    if (result.ok) setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-white/[0.06] bg-[#111113]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-white">Announcements</h2>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-all hover:shadow-[0_0_12px_-4px_rgba(198,255,61,0.5)]"
          >
            {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAdd ? "Cancel" : "New Announcement"}
          </button>
        </div>

        {showAdd && (
          <div className="border-b border-white/[0.06] px-5 py-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-ink-dim">
              <AlertCircle className="h-3.5 w-3.5" />
              Only team admins can post announcements
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none resize-none"
            />
            <button
              onClick={handleAdd}
              disabled={!title.trim() || !content.trim() || adding}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_12px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50 flex items-center gap-2"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
              Post
            </button>
          </div>
        )}

        <div className="divide-y divide-white/[0.04]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-ink-dim" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-ink-dim">
              <Megaphone className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No announcements yet</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <div key={ann.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-3.5 w-3.5 text-accent shrink-0" />
                      <h3 className="text-sm font-semibold text-white">{ann.title}</h3>
                    </div>
                    <p className="mt-2 text-sm text-ink-muted whitespace-pre-wrap">{ann.content}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-[8px] font-bold text-accent">
                          {ann.author?.avatar_url
                            ? <Image src={ann.author.avatar_url} alt="" width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
                            : (ann.author?.full_name ?? "?")[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs text-ink-dim">{ann.author?.full_name || "Unknown"}</span>
                      </div>
                      <span className="text-[10px] text-ink-dim">{new Date(ann.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    disabled={deletingId === ann.id}
                    className="shrink-0 rounded-lg p-1.5 text-ink-dim hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {deletingId === ann.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
