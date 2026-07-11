"use client";

import { useState, useEffect } from "react";
import {
  Bookmark,
  Star,
  Copy,
  Check,
  Trash2,
  Edit3,
  Loader2,
  FileText,
  Mail,
  PenTool,
  Zap,
  DollarSign,
} from "lucide-react";
import { type Profile } from "@/lib/actions/profile";
import {
  getSavedAssets,
  toggleStarAsset,
  deleteAsset,
  updateAssetContent,
  type SavedAsset,
} from "@/lib/actions/ai-vault";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "./empty-state";

type Props = {
  profile: Profile;
};

const TOOL_CONFIG: Record<
  string,
  { label: string; icon: typeof FileText; color: string }
> = {
  bio: { label: "Bio", icon: FileText, color: "text-cyan-400 bg-cyan-400/10" },
  pitch: { label: "Pitch", icon: Mail, color: "text-accent bg-accent/10" },
  captions: {
    label: "Caption",
    icon: PenTool,
    color: "text-amber-400 bg-amber-400/10",
  },
  optimize: {
    label: "Optimizer",
    icon: Zap,
    color: "text-fuchsia-400 bg-fuchsia-400/10",
  },
  rate: {
    label: "Rate",
    icon: DollarSign,
    color: "text-emerald-400 bg-emerald-400/10",
  },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "bio", label: "Bio" },
  { id: "pitch", label: "Pitch" },
  { id: "captions", label: "Captions" },
  { id: "optimize", label: "Optimizer" },
  { id: "rate", label: "Rate" },
];

export function AiAssetVault({ profile }: Props) {
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    setLoading(true);
    try {
      const data = await getSavedAssets();
      setAssets(data);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    filter === "all" ? assets : assets.filter((a) => a.tool_type === filter);

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleToggleStar(id: string) {
    const result = await toggleStarAsset(id);
    if (result.ok) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, is_starred: !a.is_starred } : a
        )
      );
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteAsset(id);
    if (result.ok) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
    }
    setDeletingId(null);
  }

  function startEditing(asset: SavedAsset) {
    setEditingId(asset.id);
    setEditContent(asset.content);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditContent("");
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return;
    setSavingEdit(true);
    const result = await updateAssetContent(id, editContent);
    if (result.ok) {
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, content: editContent } : a))
      );
      setEditingId(null);
      setEditContent("");
    }
    setSavingEdit(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-white">AI Asset Vault</span>
        </div>
        <span className="text-xs text-ink-muted">{assets.length} saved</span>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              filter === f.id
                ? "bg-accent/15 text-accent"
                : "text-ink-muted hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved assets yet"
          description="Generate content with AI tools and save your favorites here for quick access."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((asset) => {
            const config = TOOL_CONFIG[asset.tool_type] || TOOL_CONFIG.bio;
            const ToolIcon = config.icon;
            const isEditing = editingId === asset.id;

            return (
              <div
                key={asset.id}
                className={`rounded-xl border p-4 transition-all ${
                  asset.is_starred
                    ? "border-accent/30 bg-accent/5"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.color}`}
                    >
                      <ToolIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                    <span className="text-[10px] text-ink-dim">
                      {new Date(asset.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-ink-dim focus:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(asset.id)}
                        disabled={savingEdit || !editContent.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg transition-all duration-200 hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                      >
                        {savingEdit ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-ink-muted transition-all duration-200 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {asset.content}
                  </p>
                )}

                {!isEditing && (
                  <div className="mt-3 flex items-center gap-1">
                    <button
                      onClick={() => startEditing(asset)}
                      className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-all duration-200 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleCopy(asset.content, asset.id)}
                      className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-all duration-200 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                      {copiedId === asset.id ? (
                        <Check className="h-3 w-3 text-accent" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copiedId === asset.id ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={() => handleToggleStar(asset.id)}
                      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                        asset.is_starred
                          ? "border-accent/30 text-accent bg-accent/10"
                          : "border-white/10 text-ink-muted hover:bg-white/[0.05]"
                      }`}
                    >
                      <Star
                        className={`h-3 w-3 ${
                          asset.is_starred ? "fill-current" : ""
                        }`}
                      />
                      {asset.is_starred ? "Starred" : "Star"}
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      disabled={deletingId === asset.id}
                      className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-all duration-200 hover:bg-white/[0.05] hover:text-red-400 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                    >
                      {deletingId === asset.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
