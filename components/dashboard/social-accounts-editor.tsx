"use client";

import { useState, useEffect } from "react";
import { Link2, Trash2, Plus, Instagram, Twitter, Youtube, Radio, RefreshCw, Check, Unplug, Loader2 } from "lucide-react";
import {
  SocialAccount,
  upsertSocialAccount,
  deleteSocialAccount,
  disconnectSocialAccount,
  refreshSocialFollowers,
} from "@/lib/actions/social-accounts";

type Props = {
  accounts: SocialAccount[];
  themeAccent: string;
  onUpdate: () => void;
};

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram, oauth: true, color: "#E4405F" },
  { value: "tiktok", label: "TikTok", icon: Radio, oauth: true, color: "#00F2EA" },
  { value: "twitter", label: "Twitter / X", icon: Twitter, oauth: false, color: "#1DA1F2" },
  { value: "youtube", label: "YouTube", icon: Youtube, oauth: false, color: "#FF0000" },
  { value: "other", label: "Other Platform", icon: Link2, oauth: false, color: "#888888" },
];

export function SocialAccountsEditor({ accounts, themeAccent, onUpdate }: Props) {
  const [platform, setPlatform] = useState("instagram");
  const [handle, setHandle] = useState("");
  const [followers, setFollowers] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("instagram") === "connected" || params.get("tiktok") === "connected") {
      onUpdate();
      window.history.replaceState({}, "", "/dashboard/nil");
    }
    if (params.get("error")) {
      setError(params.get("error")?.replace(/-/g, " ") || "Connection failed");
      window.history.replaceState({}, "", "/dashboard/nil");
    }
  }, [onUpdate]);

  const handleOAuthConnect = (platformValue: string) => {
    window.location.href = `/api/social/${platformValue}/connect`;
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    try {
      const res = await refreshSocialFollowers(id);
      if (res.ok) {
        onUpdate();
      } else {
        setError(res.error || "Failed to refresh");
      }
    } catch {
      setError("Failed to refresh follower count");
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Disconnect this account? You can reconnect anytime.")) return;
    setDisconnectingId(id);
    try {
      const res = await disconnectSocialAccount(id);
      if (res.ok) {
        onUpdate();
      } else {
        setError(res.error || "Failed to disconnect");
      }
    } catch {
      setError("Failed to disconnect account");
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim() || !followers) return;

    setLoading(true);
    setError(null);

    try {
      const followersNum = parseInt(followers, 10);
      if (isNaN(followersNum) || followersNum < 0) {
        setError("Please enter a valid follower count");
        setLoading(false);
        return;
      }

      const res = await upsertSocialAccount(platform, handle.trim(), followersNum);
      if (res.ok) {
        setHandle("");
        setFollowers("");
        onUpdate();
      } else {
        setError(res.error || "Failed to add social account");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this social account?")) return;
    setLoading(true);
    try {
      const res = await deleteSocialAccount(id);
      if (res.ok) {
        onUpdate();
      } else {
        alert(res.error || "Failed to delete social account");
      }
    } catch {
      alert("Failed to delete social account");
    } finally {
      setLoading(false);
    }
  };

  const connectedPlatforms = new Set(
    accounts.filter((a) => a.is_connected).map((a) => a.platform)
  );

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Link2 className="h-4.5 w-4.5" style={{ color: themeAccent }} />
          <h3 className="text-sm font-bold text-white/90">Social Network Setup</h3>
        </div>

        {/* OAuth Connect Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {PLATFORMS.filter((p) => p.oauth).map((p) => {
            const isLinked = connectedPlatforms.has(p.value);
            return (
              <button
                key={p.value}
                onClick={() => (isLinked ? handleDisconnect(accounts.find((a) => a.platform === p.value)!.id) : handleOAuthConnect(p.value))}
                disabled={loading || disconnectingId === accounts.find((a) => a.platform === p.value)?.id}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  isLinked
                    ? "border-green-500/20 bg-green-500/5 text-green-400"
                    : "border-white/[0.08] bg-[#16161A] text-white/70 hover:bg-[#1a1a1e] hover:text-white"
                }`}
              >
                {disconnectingId === accounts.find((a) => a.platform === p.value)?.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isLinked ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <p.icon className="h-3.5 w-3.5" />
                )}
                <span>{isLinked ? `Connected` : `Connect ${p.label}`}</span>
              </button>
            );
          })}
        </div>

        {/* Existing Accounts List */}
        {accounts.length > 0 ? (
          <div className="space-y-2 mb-6">
            {accounts.map((account) => {
              const platformMeta = PLATFORMS.find((p) => p.value === account.platform);
              const PlatformIcon = platformMeta?.icon || Link2;

              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-[#0A0A0C]/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-7 w-7 rounded-lg border flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: account.is_connected ? `${platformMeta?.color}10` : "rgba(255,255,255,0.02)",
                        borderColor: account.is_connected ? `${platformMeta?.color}30` : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <PlatformIcon
                        className="h-3.5 w-3.5"
                        style={{ color: account.is_connected ? platformMeta?.color : "rgba(255,255,255,0.6)" }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white leading-tight truncate">
                          {account.handle}
                        </p>
                        {account.is_connected && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-px text-[9px] font-bold text-green-400 border border-green-500/20">
                            <span className="h-1 w-1 rounded-full bg-green-400" />
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/40 leading-none mt-0.5">
                        {account.platform.toUpperCase()} &bull; {(account.followers ?? 0).toLocaleString()} followers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {account.is_connected && (
                      <button
                        onClick={() => handleRefresh(account.id)}
                        disabled={refreshingId === account.id}
                        className="p-1.5 rounded-lg border border-white/[0.04] text-white/20 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                        title="Refresh follower count"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshingId === account.id ? "animate-spin" : ""}`} />
                      </button>
                    )}
                    {account.is_connected ? (
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        disabled={loading}
                        className="p-1.5 rounded-lg border border-white/[0.04] text-white/20 hover:text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/50"
                        title="Disconnect account"
                      >
                        <Unplug className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(account.id)}
                        disabled={loading}
                        className="p-1.5 rounded-lg border border-white/[0.04] text-white/20 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                        title="Remove account"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-white/20 text-xs italic mb-4">
            No social profiles configured yet. Connect a platform or add one manually below.
          </div>
        )}

        {/* Add Account Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t border-white/[0.04]">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                disabled={loading}
                className="w-full text-xs bg-[#16161A] border border-white/[0.08] rounded-xl px-3 py-2 text-white/80 focus:outline-none focus:border-white/25 transition-colors"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                Follower Count
              </label>
              <input
                type="number"
                placeholder="2500"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                disabled={loading}
                required
                min="0"
                className="w-full text-xs bg-[#16161A] border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-white/25 focus-visible:ring-2 focus-visible:ring-accent/30 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
              Handle / Username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="@nike_athlete"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                disabled={loading}
                required
                className="flex-1 text-xs bg-[#16161A] border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-white/25 focus-visible:ring-2 focus-visible:ring-accent/30 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !handle || !followers}
                className="rounded-xl px-3 py-2 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && <p className="text-[10px] text-red-400 mt-1 font-medium">{error}</p>}
        </form>
      </div>

      <p className="text-[9px] text-white/30 leading-snug mt-4 pt-4 border-t border-white/[0.04]">
        Connected accounts auto-sync follower counts. Manual entries can be added below for other platforms.
      </p>
    </div>
  );
}
