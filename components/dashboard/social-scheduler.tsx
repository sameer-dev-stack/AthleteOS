"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Instagram,
  Youtube,
  ChevronLeft,
  ChevronRight,
  Send,
  Save,
  Loader2,
  X,
  FileText,
  Link2,
} from "lucide-react";
import {
  schedulePost,
  getScheduledPosts,
  deleteScheduledPost,
  type ScheduledPost,
} from "@/lib/actions/schedule";

type Props = {
  socialAccounts: { platform: string; handle: string }[];
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C" },
  { id: "tiktok", label: "TikTok", icon: () => <span className="font-bold text-sm">TT</span>, color: "#000000" },
  { id: "twitter", label: "Twitter", icon: () => <span className="font-bold text-sm">X</span>, color: "#1DA1F2" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "#FF0000" },
  { id: "other", label: "Other", icon: Link2, color: "#6B7280" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  queued: "bg-accent/20 text-accent",
  published: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export function SocialScheduler({ socialAccounts }: Props) {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const result = await getScheduledPosts(statusFilter);
    if (result.ok && result.data) {
      setPosts(result.data);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    queueMicrotask(() => fetchPosts());
  }, [fetchPosts]);

  async function handleDelete(id: string) {
    setDeleteLoading(id);
    const result = await deleteScheduledPost(id);
    if (result.ok) {
      setPosts(posts.filter((p) => p.id !== id));
    }
    setDeleteLoading(null);
  }

  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getPostsForDay = (day: number) => {
    return posts.filter((post) => {
      const postDate = new Date(post.scheduled_at);
      return (
        postDate.getFullYear() === selectedDate.getFullYear() &&
        postDate.getMonth() === selectedDate.getMonth() &&
        postDate.getDate() === day
      );
    });
  };

  const prevMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
    );
  };

  const monthName = selectedDate.toLocaleString("default", { month: "long" });
  const year = selectedDate.getFullYear();

  const upcomingPosts = posts
    .filter(
      (p) =>
        new Date(p.scheduled_at) > new Date() &&
        (statusFilter === "all" || p.status === statusFilter)
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            Social Scheduler
          </h2>
          <p className="mt-1 text-sm text-white/40">
            Plan and schedule your social media content
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <Plus className="h-4 w-4" />
          Schedule Post
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#111113] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {monthName} {year}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="h-8 w-8 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                className="h-8 w-8 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-white/30 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const dayPosts = getPostsForDay(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === selectedDate.getMonth() &&
                new Date().getFullYear() === selectedDate.getFullYear();

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg border ${
                    isToday
                      ? "border-accent/50 bg-accent/10"
                      : "border-white/[0.04] bg-white/[0.02]"
                  } p-1 flex flex-col items-center`}
                >
                  <span
                    className={`text-xs font-medium ${
                      isToday ? "text-accent" : "text-white/60"
                    }`}
                  >
                    {day}
                  </span>
                  {dayPosts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayPosts.slice(0, 3).map((post) => {
                        const platform = PLATFORMS.find(
                          (p) => p.id === post.platform
                        );
                        return (
                          <div
                            key={post.id}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                platform?.color || "#6B7280",
                            }}
                            title={post.content.slice(0, 30)}
                          />
                        );
                      })}
                      {dayPosts.length > 3 && (
                        <span className="text-[8px] text-white/40">
                          +{dayPosts.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Queue */}
        <div className="rounded-xl border border-white/[0.06] bg-[#111113] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/40" />
              Upcoming Queue
            </h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-xs text-white/60 focus:outline-none focus:ring-1 focus:ring-accent focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <option value="all">All</option>
              <option value="queued">Queued</option>
              <option value="draft">Drafts</option>
              <option value="published">Published</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-white/30" />
            </div>
          ) : upcomingPosts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/40">No scheduled posts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingPosts.map((post) => {
                const platform = PLATFORMS.find(
                  (p) => p.id === post.platform
                );
                const postDate = new Date(post.scheduled_at);

                return (
                  <div
                    key={post.id}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded flex items-center justify-center"
                          style={{
                            backgroundColor: `${platform?.color}20`,
                          }}
                        >
                          {platform && (
                            <platform.icon
                              className="h-3 w-3"
                              style={{ color: platform?.color }}
                            />
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_COLORS[post.status]}`}
                        >
                          {post.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleteLoading === post.id}
                        className="text-white/30 hover:text-red-400 transition-all duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                      >
                        {deleteLoading === post.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-white/60 mt-2 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30">
                      <Clock className="h-3 w-3" />
                      {postDate.toLocaleDateString()} at{" "}
                      {postDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePostModal
          socialAccounts={socialAccounts}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            fetchPosts();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreatePostModal({
  socialAccounts,
  onClose,
  onCreated,
}: {
  socialAccounts: { platform: string; handle: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [platform, setPlatform] = useState("instagram");
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [hashtags, setHashtags] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectedPlatforms = socialAccounts.map((a) => a.platform);

  async function handleSubmit(draft?: boolean) {
    if (!content.trim()) {
      setError("Content is required");
      return;
    }
    if (!scheduledDate) {
      setError("Please select a date");
      return;
    }

    setLoading(true);
    setError(null);

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    const hashtagList = hashtags
      .split(",")
      .map((h) => h.trim())
      .filter((h) => h);

    const result = await schedulePost(
      platform,
      content,
      scheduledAt,
      mediaUrl || null,
      hashtagList
    );

    if (result.ok) {
      onCreated();
    } else {
      setError(result.error || "Failed to schedule post");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-white/[0.06] bg-[#111113] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Send className="h-4 w-4 text-accent" />
            Schedule New Post
          </h3>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">
              Platform
            </label>
            <div className="flex gap-2">
              {PLATFORMS.map((p) => {
                const isConnected = connectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    disabled={!isConnected}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      platform === p.id
                        ? "bg-accent/15 text-accent"
                        : isConnected
                        ? "text-white/40 hover:bg-white/[0.04] hover:text-white"
                        : "text-white/20 cursor-not-allowed"
                    }`}
                  >
                    <p.icon
                      className="h-3.5 w-3.5"
                      style={{ color: platform === p.id ? p.color : undefined }}
                    />
                    {p.label}
                    {!isConnected && (
                      <span className="text-[8px] text-white/20">(not connected)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">
              Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to share?"
              className="w-full h-24 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-accent focus-visible:ring-2 focus-visible:ring-accent/30 resize-none"
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-[10px] ${
                  content.length > 2000 ? "text-red-400" : "text-white/30"
                }`}
              >
                {content.length}/2200
              </span>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">
                Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent focus-visible:ring-2 focus-visible:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">
                Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent focus-visible:ring-2 focus-visible:ring-accent/30"
              />
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">
              Hashtags (comma separated)
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="athlete, sports, nil"
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-accent focus-visible:ring-2 focus-visible:ring-accent/30"
            />
          </div>

          {/* Media URL */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">
              Media URL (optional)
            </label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-accent focus-visible:ring-2 focus-visible:ring-accent/30"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/60 hover:text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.04] text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-sm font-semibold text-[#0A0A0B] transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
