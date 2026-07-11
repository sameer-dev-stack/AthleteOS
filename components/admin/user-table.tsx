"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Shield,
  Ban,
  CheckCircle,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import {
  listUsers,
  updateUserPlan,
  toggleUserStatus,
  toggleUserVerification,
  viewUser,
} from "@/lib/actions/admin";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  plan: string;
  suspended: boolean;
  is_verified: boolean;
  role: string;
  created_at: string;
};

type DetailProfile = {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  plan: string;
  suspended: boolean;
  is_verified: boolean;
  role: string;
  sport: string | null;
  school: string | null;
  profile_published: boolean;
  onboarding_completed: boolean;
  bio: string | null;
};

type DetailSubscription = {
  tier: string;
  status: string | null;
  currentPeriodEnd: number | null;
  customerId: string | null;
  subscriptionId: string | null;
};

type DetailUser = {
  profile: DetailProfile;
  subscription: DetailSubscription;
};

function UserSkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/[0.06]" />
              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-white/[0.08]" />
                <div className="h-2.5 w-44 rounded bg-white/[0.06]" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-16 rounded bg-white/[0.06]" />
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-20 rounded bg-white/[0.06]" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
          </td>
          <td className="px-4 py-3 text-right">
            <div className="ml-auto h-8 w-8 rounded bg-white/[0.06]" />
          </td>
        </tr>
      ))}
    </>
  );
}

const PAGE_SIZE = 20;

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<DetailUser | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (p: number, s: string) => {
    setLoading(true);
    setError(null);
    const result = await listUsers(s || undefined, p, PAGE_SIZE);
    if (result.ok && result.data) {
      setUsers(result.data.users);
      setTotal(result.data.total);
    } else {
      setError(result.error || "Failed to load users");
    }
    setLoading(false);
  }, []);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  function isLoadingAction(userId: string, action: string) {
    return actionLoading === `${userId}:${action}`;
  }

  async function copyUserId(userId: string | undefined) {
    if (!userId) return;
    await navigator.clipboard.writeText(userId);
    setCopiedUserId(userId);
    setTimeout(() => setCopiedUserId(null), 2000);
  }

  useEffect(() => {
    fetchUsers(page, search);
  }, [page, search, fetchUsers]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (openDropdown && !(e.target as HTMLElement).closest("[data-dropdown]")) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  useEffect(() => {
    if (!detailUser) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailUser(null);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [detailUser]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  async function handlePlanChange(userId: string, newPlan: string) {
    if (actionLoading) return;
    setActionLoading(`${userId}:plan`);
    setOpenDropdown(null);
    const result = await updateUserPlan(userId, newPlan);
    if (result.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
      );
      showMessage("success", `Plan updated to ${newPlan}.`);
    } else {
      showMessage("error", result.error || "Failed to update plan");
    }
    setActionLoading(null);
  }

  async function handleToggleSuspend(userId: string, currentSuspended: boolean) {
    if (actionLoading) return;
    setActionLoading(`${userId}:status`);
    setOpenDropdown(null);
    const result = await toggleUserStatus(userId, currentSuspended);
    if (result.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, suspended: !currentSuspended } : u
        )
      );
      showMessage("success", currentSuspended ? "User activated." : "User suspended.");
    } else {
      showMessage("error", result.error || "Failed to update status");
    }
    setActionLoading(null);
  }

  async function handleToggleVerify(userId: string, currentVerified: boolean) {
    if (actionLoading) return;
    setActionLoading(`${userId}:verify`);
    setOpenDropdown(null);
    const result = await toggleUserVerification(userId, !currentVerified);
    if (result.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_verified: !currentVerified } : u
        )
      );
      showMessage("success", currentVerified ? "Verification removed." : "User verified.");
    } else {
      showMessage("error", result.error || "Failed to update verification");
    }
    setActionLoading(null);
  }

  async function handleViewDetails(userId: string) {
    setDetailLoading(true);
    setDetailError(null);
    setOpenDropdown(null);
    const result = await viewUser(userId);
    if (result.ok && result.data) {
      setDetailUser(result.data as DetailUser);
    } else {
      setDetailError(result.error || "Failed to load user details");
    }
    setDetailLoading(false);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const planStyles: Record<string, string> = {
    free: "bg-white/[0.06] text-ink-muted",
    pro: "bg-accent/15 text-accent",
    elite: "bg-purple-500/15 text-purple-400",
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
          <input
            type="text"
            placeholder="Search by email, name, or username..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none"
          />
        </div>
        <span className="text-xs text-ink-dim whitespace-nowrap">
          {total} user{total !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-accent/20 bg-accent/5 text-accent"
              : "border-red-500/20 bg-red-500/5 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-white/[0.06]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] bg-[#1A1A1C]">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-muted">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {loading ? (
              <UserSkeletonRows />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-muted">
                  {search ? "No users found" : "No users found"}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-xs font-medium text-ink-muted">
                          {(user.full_name || user.email || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {user.full_name || user.username || "Unnamed"}
                        </p>
                        <p className="truncate text-xs text-ink-dim">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ${
                        planStyles[user.plan] || planStyles.free
                      }`}
                    >
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.suspended ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400">
                        <Ban className="h-3 w-3" />
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-muted">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative flex items-center justify-end gap-1" data-dropdown>
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === user.id ? null : user.id
                          )
                        }
                        disabled={actionLoading === `${user.id}:plan` || actionLoading === `${user.id}:status`}
                        className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                          {isLoadingAction(user.id, "plan") ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                      </button>

                      {openDropdown === user.id && (
                        <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-white/[0.08] bg-[#1A1A1C] shadow-xl">
                          <div className="p-1">
                            <button
                              onClick={() => handleViewDetails(user.id)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-white/[0.06] hover:text-white"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View details
                            </button>

                            <div className="my-1 border-t border-white/[0.06]" />

                            <button
                              onClick={() => handleToggleVerify(user.id, user.is_verified)}
                              disabled={isLoadingAction(user.id, "verify")}
                              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-wait ${
                                user.is_verified
                                  ? "text-amber-400 hover:bg-amber-500/10"
                                  : "text-accent hover:bg-accent/10"
                              }`}
                            >
                              {isLoadingAction(user.id, "verify") ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                              ) : user.is_verified ? (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Remove verification
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Verify athlete
                                </>
                              )}
                            </button>

                            <div className="my-1 border-t border-white/[0.06]" />

                            <div className="px-3 py-1.5">
                              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">
                                Change plan
                              </p>
                            </div>
                            {["free", "pro", "elite"].map((plan) => (
                              <button
                                key={plan}
                                onClick={() => handlePlanChange(user.id, plan)}
                                disabled={user.plan === plan || isLoadingAction(user.id, "plan")}
                                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm capitalize ${
                                  user.plan === plan
                                    ? "text-accent cursor-default"
                                    : isLoadingAction(user.id, "plan")
                                      ? "text-ink-muted cursor-wait opacity-50"
                                      : "text-ink-muted hover:bg-white/[0.06] hover:text-white"
                                }`}
                              >
                                <Shield className="h-3.5 w-3.5" />
                                {plan}
                                {isLoadingAction(user.id, "plan") ? (
                                  <div className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                ) : user.plan === plan ? (
                                  <span className="ml-auto text-[10px] text-accent">
                                    current
                                  </span>
                                ) : null}
                              </button>
                            ))}

                            <div className="my-1 border-t border-white/[0.06]" />

                            <button
                              onClick={() =>
                                handleToggleSuspend(user.id, user.suspended)
                              }
                              disabled={isLoadingAction(user.id, "status")}
                              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-wait ${
                                user.suspended
                                  ? "text-accent hover:bg-accent/10"
                                  : "text-red-400 hover:bg-red-500/10"
                              }`}
                            >
                              {isLoadingAction(user.id, "status") ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                              ) : user.suspended ? (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Unsuspend user
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3.5 w-3.5" />
                                  Suspend user
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-ink-dim">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-sm text-ink-muted">Loading user details...</div>
        </div>
      )}

      {detailError && !detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-xl border border-red-500/20 bg-[#111113] p-6">
            <p className="text-sm text-red-400">{detailError}</p>
            <button
              onClick={() => setDetailError(null)}
              className="mt-4 rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-ink-muted hover:bg-white/[0.1]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {detailUser && !detailLoading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setDetailUser(null)}
        >
          <div
            className="mx-4 w-full max-w-lg overflow-hidden rounded-xl border border-white/[0.08] bg-[#111113]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">User Details</h3>
                <p className="mt-1 text-xs font-mono text-ink-dim">{detailUser.profile?.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyUserId(detailUser.profile?.id)}
                  disabled={!detailUser.profile?.id}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copiedUserId === detailUser.profile?.id ? (
                    <span className="inline-flex items-center gap-1 text-accent">
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Copy className="h-3.5 w-3.5" />
                      Copy user ID
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setDetailUser(null)}
                  className="rounded-lg p-1 text-ink-muted hover:text-white"
                >
                  <span className="sr-only">Close</span>
                  &times;
                </button>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                {detailUser.profile?.avatar_url ? (
                  <Image
                    src={detailUser.profile.avatar_url}
                    alt=""
                    width={56}
                    height={56}
                    priority
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-xl font-bold text-ink-muted">
                    {(detailUser.profile?.full_name || "?")[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-white">
                    {detailUser.profile?.full_name || "Unnamed"}
                  </p>
                  <p className="text-sm text-ink-dim">{detailUser.profile?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Username", value: detailUser.profile?.username || "—" },
                  { label: "Role", value: detailUser.profile?.role || "user" },
                  { label: "Plan", value: detailUser.profile?.plan || "free" },
                  { label: "Sport", value: detailUser.profile?.sport || "—" },
                  { label: "School", value: detailUser.profile?.school || "—" },
                  { label: "Status", value: detailUser.profile?.suspended ? "Suspended" : "Active" },
                  { label: "Published", value: detailUser.profile?.profile_published ? "Yes" : "No" },
                  { label: "Onboarded", value: detailUser.profile?.onboarding_completed ? "Yes" : "No" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-white/[0.03] p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm text-white capitalize">{item.value}</p>
                  </div>
                ))}
              </div>

              {detailUser.subscription?.status && (
                <div className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">
                    Stripe Status
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {detailUser.subscription.status}
                    {detailUser.subscription.currentPeriodEnd && (
                      <span className="text-ink-dim">
                        {" "}
                        — renews{" "}
                        {new Date(
                          detailUser.subscription.currentPeriodEnd * 1000
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {detailUser.profile?.bio && (
                <div className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">
                    Bio
                  </p>
                  <p className="mt-1 text-sm text-white">{detailUser.profile.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
