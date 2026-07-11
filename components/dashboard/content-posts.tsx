"use client";

import { useEffect, useState } from "react";
import { Plus, Eye, EyeOff, Loader2 } from "lucide-react";
import { createContentPost, getContentPosts, publishPost } from "@/lib/actions/memberships";
import { Skeleton, SkeletonCard, SkeletonCircle } from "@/components/ui/skeleton";

type Post = {
  id: string;
  title: string;
  body: string | null;
  is_members_only: boolean;
  published: boolean;
  created_at: string;
};

type Props = { athleteId: string };

export function ContentPosts({ athleteId }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isMembersOnly, setIsMembersOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getContentPosts(athleteId).then((result) => {
      if (cancelled) return;
      if (result.ok && result.data) setPosts(result.data as Post[]);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [athleteId]);

  async function reloadPosts() {
    const result = await getContentPosts(athleteId);
    if (result.ok && result.data) setPosts(result.data as Post[]);
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    const result = await createContentPost(athleteId, title.trim(), body.trim() || undefined, isMembersOnly, "free");
    setSaving(false);
    if (result.ok) {
      setTitle("");
      setBody("");
      setIsMembersOnly(false);
      setShowForm(false);
      reloadPosts();
    }
  }

  async function handlePublish(postId: string) {
    await publishPost(postId);
    reloadPosts();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-[#0D0D0F] p-4">
              <div className="flex items-center gap-3">
                <SkeletonCircle className="h-8 w-8 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#0D0D0F] p-8 text-center">
          <Eye className="mx-auto h-8 w-8 text-ink-dim" />
          <p className="mt-2 text-sm text-ink-muted">No content posts yet</p>
          <p className="mt-1 text-xs text-ink-dim">Create posts to share updates with your fans and members</p>
          <button onClick={() => setShowForm(true)} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">Create your first post</button>
        </div>
      )}

      {posts.map((post) => (
        <div key={post.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0D0D0F] p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white">{post.title}</p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${post.is_members_only ? "bg-purple-500/15 text-purple-400" : "bg-white/[0.06] text-ink-muted"}`}>
                {post.is_members_only ? "Members" : "Public"}
              </span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${post.published ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                {post.published ? "Published" : "Draft"}
              </span>
            </div>
            {post.body && <p className="mt-1 line-clamp-1 text-xs text-ink-dim">{post.body}</p>}
          </div>
          <button onClick={() => handlePublish(post.id)} className="ml-4 rounded-lg border border-white/[0.06] p-2 text-ink-dim hover:text-white hover:bg-white/[0.04] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
            {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      ))}

      {showForm && (
        <div className="rounded-xl border border-white/[0.06] bg-[#0D0D0F] p-4 space-y-3">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" maxLength={200} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your post..." rows={4} maxLength={5000} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 resize-none" />
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" checked={isMembersOnly} onChange={(e) => setIsMembersOnly(e.target.checked)} className="rounded" />
            Members only
          </label>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving || !title.trim()} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40 transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publish
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-ink-muted hover:text-white hover:bg-white/[0.04] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">Cancel</button>
          </div>
        </div>
      )}

      {!showForm && posts.length > 0 && (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
          <Plus className="h-3.5 w-3.5" /> New post
        </button>
      )}
    </div>
  );
}
