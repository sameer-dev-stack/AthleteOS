"use client";

import { useState, useEffect, useRef } from "react";
import { Link2, Trash2, Plus, Instagram, Twitter, Youtube, Radio, RefreshCw, Check, Unplug, Loader2, AlertCircle, Clock } from "lucide-react";
import {
  SocialAccount,
  upsertSocialAccount,
  deleteSocialAccount,
  disconnectSocialAccount,
  refreshSocialFollowers,
  queueSocialScrape,
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

  const [activeConnectPlatform, setActiveConnectPlatform] = useState<"instagram" | "tiktok" | null>(null);
  const [connectHandle, setConnectHandle] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);
  const [privateAccountError, setPrivateAccountError] = useState(false);
  // Track which platform is in the async PENDING / verifying state
  const [verifyingPlatform, setVerifyingPlatform] = useState<"instagram" | "tiktok" | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleOAuthConnect = (platformValue: "instagram" | "tiktok") => {
    setActiveConnectPlatform(platformValue);
    setConnectHandle("");
    setError(null);
    setPrivateAccountError(false);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Poll every 5s while a platform is in PENDING state
  useEffect(() => {
    if (!verifyingPlatform) return;
    pollRef.current = setInterval(() => {
      onUpdate();
    }, 5000);
    return stopPolling;
  }, [verifyingPlatform, onUpdate]);

  // When accounts refresh, check if the verifying platform has settled
  useEffect(() => {
    if (!verifyingPlatform) return;
    const account = accounts.find((a) => a.platform === verifyingPlatform);
    if (!account) return;
    const status = account.verification_status;
    if (status === "VERIFIED") {
      stopPolling();
      setVerifyingPlatform(null);
      setActiveConnectPlatform(null);
    } else if (status === "PRIVATE_ACCOUNT") {
      stopPolling();
      setVerifyingPlatform(null);
      setActiveConnectPlatform(null);
      setPrivateAccountError(true);
    } else if (status === "ERROR") {
      stopPolling();
      setVerifyingPlatform(null);
      setError("Verification failed. Please try again.");
    }
  }, [accounts, verifyingPlatform]);

  const handleQueueScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConnectPlatform || !connectHandle.trim()) return;

    setConnectLoading(true);
    setError(null);
    setPrivateAccountError(false);

    try {
      const res = await queueSocialScrape(activeConnectPlatform, connectHandle.trim());
      if (res.ok) {
        setConnectHandle("");
        if (res.status === "VERIFIED") {
          // Dev sync path resolved immediately
          setActiveConnectPlatform(null);
          onUpdate();
        } else {
          // Production: enter polling state
          setVerifyingPlatform(activeConnectPlatform);
          onUpdate();
        }
      } else {
        setError(res.error || `Failed to queue ${activeConnectPlatform} verification`);
      }
    } catch {
      setError("An unexpected error occurred during verification");
    } finally {
      setConnectLoading(false);
    }
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

        {/* Connect flow: input form, verifying banner, or idle connect buttons */}
        {verifyingPlatform ? (
          <div className="rounded-xl border border-white/[0.08] bg-[#16161A] p-4 mb-6 flex items-center gap-3">
            <Clock className="h-4 w-4 text-white/40 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-xs font-bold text-white/80">Verifying {verifyingPlatform}</p>
              <p className="text-[10px] text-white/40 mt-0.5">Checking your profile and computing engagement metrics...</p>
            </div>
            <Loader2 className="h-3.5 w-3.5 text-white/30 animate-spin flex-shrink-0" />
          </div>
        ) : activeConnectPlatform ? (
          <form onSubmit={handleQueueScrape} className="space-y-3 p-3.5 rounded-xl border border-white/[0.08] bg-[#16161A] mb-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Connect {activeConnectPlatform}</span>
              <button
                type="button"
                onClick={() => {
                  setActiveConnectPlatform(null);
                  setError(null);
                }}
                className="text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-wider"
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={activeConnectPlatform === "instagram" ? "Instagram handle (e.g. espn)" : "TikTok handle (e.g. espn)"}
                value={connectHandle}
                onChange={(e) => setConnectHandle(e.target.value)}
                disabled={connectLoading}
                required
                className="flex-1 text-xs bg-[#0A0A0C] border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-white/25 focus-visible:ring-2 focus-visible:ring-accent/30 transition-colors"
              />
              <button
                type="submit"
                disabled={connectLoading || !connectHandle}
                className="rounded-xl px-4 py-2 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase transition-all duration-200"
              >
                {connectLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Link"}
              </button>
            </div>
            {error && <p className="text-[10px] text-red-400 mt-1 font-medium">{error}</p>}
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {PLATFORMS.filter((p) => p.oauth).map((p) => {
              const isLinked = connectedPlatforms.has(p.value);
              return (
                <button
                  key={p.value}
                  onClick={() => (isLinked ? handleDisconnect(accounts.find((a) => a.platform === p.value)!.id) : handleOAuthConnect(p.value as any))}
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
        )}

        {/* Private Account Blocking Notification */}
        {privateAccountError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3 mb-6 animate-pulse">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-red-400">Public Profile Required</h5>
                <p className="text-[10px] text-red-400/80 mt-1 leading-relaxed">
                  Please make your account public permanently. AthleteOS requires a public profile to verify metrics and calculate suggested NIL rates. No manual entry is supported.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPrivateAccountError(false)}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider"
              >
                Acknowledge
              </button>
            </div>
          </div>
        )}

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
