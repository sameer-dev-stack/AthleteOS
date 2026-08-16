"use client";

import { useState, useEffect } from "react";
import { Link2, Trash2, Instagram, Twitter, Youtube, Radio, RefreshCw, Check, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import {
  SocialAccount,
  deleteSocialAccount,
  disconnectSocialAccount,
  refreshSocialFollowers,
  queueSocialScrape,
} from "@/lib/actions/social-accounts";

type Props = {
  accounts: SocialAccount[];
  themeAccent: string;
  onUpdate: () => void;
  plan?: "free" | "pro";
};

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram, oauth: true, color: "#E4405F" },
  { value: "tiktok", label: "TikTok", icon: Radio, oauth: true, color: "#00F2EA" },
  { value: "twitter", label: "Twitter / X", icon: Twitter, oauth: false, color: "#1DA1F2" },
  { value: "youtube", label: "YouTube", icon: Youtube, oauth: false, color: "#FF0000" },
  { value: "other", label: "Other Platform", icon: Link2, oauth: false, color: "#888888" },
];

export function SocialAccountsEditor({ accounts, themeAccent, onUpdate, plan }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const [activeConnectPlatform, setActiveConnectPlatform] = useState<"instagram" | "tiktok" | null>(null);
  const [connectHandle, setConnectHandle] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);
  const [submitting, setSubmitting] = useState<"instagram" | "tiktok" | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // PRIVATE_ACCOUNT blocking modal state + the platform/handle needed to retry
  const [privateAccount, setPrivateAccount] = useState<{ platform: string; handle: string } | null>(null);
  const [dismissedPrivate, setDismissedPrivate] = useState<string | null>(null);

  const pendingPlatforms = accounts
    .filter((a) => a.verification_status === "PENDING")
    .map((a) => a.platform);
  const isVerifying = (p: string) => submitting === p || pendingPlatforms.includes(p);

  const connectedPlatforms = new Set(
    accounts.filter((a) => a.verification_status === "VERIFIED").map((a) => a.platform)
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("instagram") === "connected" || params.get("tiktok") === "connected") {
      onUpdate();
      window.history.replaceState({}, "", "/dashboard/nil");
    }
    if (params.get("error")) {
      queueMicrotask(() =>
        setError(params.get("error")?.replace(/-/g, " ") || "Connection failed")
      );
      window.history.replaceState({}, "", "/dashboard/nil");
    }
  }, [onUpdate]);

  // Poll every 5s while any platform is PENDING so the UI can react to resolution
  const pendingKey = pendingPlatforms.join(",");
  useEffect(() => {
    if (!pendingKey) return;
    const id = setInterval(() => onUpdate(), 5000);
    return () => clearInterval(id);
  }, [pendingKey, onUpdate]);

  // Auto-dismiss the toast after 5 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Intercept terminal backend states (PRIVATE_ACCOUNT / ERROR) when accounts refresh
  useEffect(() => {
    const priv = accounts.find((a) => a.verification_status === "PRIVATE_ACCOUNT");
    if (priv && !privateAccount && dismissedPrivate !== priv.handle) {
      queueMicrotask(() =>
        setPrivateAccount({ platform: priv.platform, handle: priv.handle.replace(/^@/, "") })
      );
    }
    const errored = accounts.find((a) => a.verification_status === "ERROR");
    if (errored && !toast) {
      queueMicrotask(() =>
        setToast({ message: "Scraper task failed. Please verify the handle spelling and try again.", type: "error" })
      );
    }
  }, [accounts, privateAccount, dismissedPrivate, toast]);

  const handleOAuthConnect = (platformValue: "instagram" | "tiktok") => {
    setActiveConnectPlatform(platformValue);
    setConnectHandle("");
    setError(null);
  };

  // Shared fire-and-forget dispatch: write PENDING, trigger the Apify scraper,
  // and let the 5s poll resolve the record. No blocking / no server timeout.
  const startScrape = async (p: "instagram" | "tiktok", h: string) => {
    setError(null);
    setSubmitting(p);
    try {
      const res = await queueSocialScrape(p, h);
      if (!res.ok) {
        setError(res.error || `Failed to queue ${p} verification`);
      } else if (res.status !== "VERIFIED") {
        onUpdate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during verification");
    } finally {
      setSubmitting(null);
    }
  };

  const handleQueueScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConnectPlatform || !connectHandle.trim()) return;

    setConnectLoading(true);
    // Instantly collapse the input and transition the handle into the PENDING list
    setConnectHandle("");
    setActiveConnectPlatform(null);
    await startScrape(activeConnectPlatform, connectHandle.trim());
    setConnectLoading(false);
  };

  const handleRetry = () => {
    if (!privateAccount) return;
    const { platform: p, handle: h } = privateAccount;
    setPrivateAccount(null);
    setDismissedPrivate(null);
    startScrape(p as "instagram" | "tiktok", h);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Clear this account mapping from your profile?")) return;
    setLoading(true);
    try {
      const res = await deleteSocialAccount(id);
      if (res.ok) {
        onUpdate();
      } else {
        alert(res.error || "Failed to clear social account");
      }
    } catch {
      alert("Failed to clear social account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Link2 className="h-4.5 w-4.5" style={{ color: themeAccent }} />
          <h3 className="text-sm font-bold text-white/90">Social Network Setup</h3>
        </div>

        {/* Connect flow: input form or idle connect buttons */}
        {activeConnectPlatform ? (
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
              const isLocked = p.value === "tiktok" && plan === "free";
              const verifying = isVerifying(p.value);
              const pendingAccount = accounts.find(
                (a) => a.platform === p.value && a.verification_status === "PENDING"
              );
              const verifyLabel = pendingAccount
                ? `Verifying ${pendingAccount.handle}...`
                : "Verifying...";
              return (
                <button
                  key={p.value}
                  onClick={() => {
                    if (isLocked) {
                      setError("TikTok connection is only available on Pro plans.");
                      return;
                    }
                    if (isLinked) {
                      handleDisconnect(accounts.find((a) => a.platform === p.value)!.id);
                    } else {
                      handleOAuthConnect(p.value as any);
                    }
                  }}
                  disabled={isLocked || verifying || disconnectingId === accounts.find((a) => a.platform === p.value)?.id}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed ${
                    verifying
                      ? "border-amber-500/20 bg-amber-500/5 text-amber-400"
                      : isLinked
                      ? "border-green-500/20 bg-green-500/5 text-green-400"
                      : isLocked
                      ? "border-white/[0.04] bg-[#16161A]/50 text-white/30"
                      : "border-white/[0.08] bg-[#16161A] text-white/70 hover:bg-[#1a1a1e] hover:text-white"
                  }`}
                >
                  {verifying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
                  ) : isLinked ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <p.icon className="h-3.5 w-3.5" />
                  )}
                  <span className="truncate">
                    {verifying ? verifyLabel : isLinked ? `Connected` : isLocked ? `TikTok (Pro)` : `Connect ${p.label}`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {error && !activeConnectPlatform && (
          <p className="text-[10px] text-red-400 -mt-3 mb-6 font-medium">{error}</p>
        )}

        {/* PRIVATE_ACCOUNT Blocking Modal */}
        {privateAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-[#16161A] p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  ⚠️ Action Required: Public Profile Needed
                </h4>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                NIL CARD requires a public account to securely aggregate engagement analytics and verify your
                suggested market value. Please temporarily switch your profile to public in your app settings and
                click Retry Sync.
              </p>
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleRetry}
                  disabled={connectLoading}
                  className="rounded-xl px-4 py-2.5 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  {connectLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Retry Verification
                </button>
                <button
                  onClick={() => {
                    setDismissedPrivate(privateAccount.handle);
                    setPrivateAccount(null);
                  }}
                  className="text-[11px] text-white/40 hover:text-white uppercase font-bold tracking-wider underline-offset-4 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Accounts List */}
        {accounts.length > 0 ? (
          <div className="space-y-2 mb-6">
            {accounts.map((account) => {
              const platformMeta = PLATFORMS.find((p) => p.value === account.platform);
              const PlatformIcon = platformMeta?.icon || Link2;
              const status = account.verification_status;
              const isPending = status === "PENDING";
              const isVerified = status === "VERIFIED";
              const isPrivate = status === "PRIVATE_ACCOUNT";

              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-[#0A0A0C]/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-7 w-7 rounded-lg border flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isVerified
                          ? `${platformMeta?.color}10`
                          : isPrivate
                          ? "rgba(239,68,68,0.08)"
                          : "rgba(255,255,255,0.02)",
                        borderColor: isVerified
                          ? `${platformMeta?.color}30`
                          : isPrivate
                          ? "rgba(239,68,68,0.3)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                      ) : isPrivate ? (
                        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <PlatformIcon
                          className="h-3.5 w-3.5"
                          style={{ color: isVerified ? platformMeta?.color : "rgba(255,255,255,0.6)" }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white leading-tight truncate">
                          {account.handle}
                        </p>
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-px text-[9px] font-bold text-amber-400 border border-amber-500/20">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            🔄 Syncing details....
                          </span>
                        )}
                        {isVerified && (
                          <span
                            className="inline-flex items-center gap-0.5 rounded-full bg-accent/10 px-1.5 py-px text-[9px] font-bold border border-accent/20"
                            style={{ color: themeAccent, borderColor: `${themeAccent}30` }}
                          >
                            <Check className="h-2.5 w-2.5" />
                            ✓ Connected
                          </span>
                        )}
                        {isPrivate && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-px text-[9px] font-bold text-red-400 border border-red-500/20">
                            <AlertCircle className="h-2.5 w-2.5" />
                            ⚠️ Private Profile Detected
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/40 leading-none mt-0.5">
                        {account.platform.toUpperCase()} &bull; {(account.followers ?? 0).toLocaleString()} followers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isPending ? (
                      <span className="text-[9px] text-amber-400/70 uppercase tracking-wider px-1">Syncing</span>
                    ) : isPrivate ? (
                      <>
                        <button
                          onClick={() =>
                            startScrape(
                              account.platform as "instagram" | "tiktok",
                              account.handle.replace(/^@/, "")
                            )
                          }
                          className="text-[10px] font-bold uppercase tracking-wider text-white/80 hover:text-white px-1.5 py-1 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                        >
                          Retry
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          disabled={loading}
                          className="p-1.5 rounded-lg border border-white/[0.04] text-white/20 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                          title="Clear account mapping"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        {isVerified && (
                          <button
                            onClick={() => handleRefresh(account.id)}
                            disabled={refreshingId === account.id}
                            className="p-1.5 rounded-lg border border-white/[0.04] text-white/20 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                            title="Refresh follower count"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshingId === account.id ? "animate-spin" : ""}`} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(account.id)}
                          disabled={loading}
                          className="p-1.5 rounded-lg border border-white/[0.04] text-white/20 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                          title="Clear account mapping"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-white/20 text-xs italic mb-4">
            No social profiles configured yet. Connect a platform above to get started.
          </div>
        )}
      </div>

      <p className="text-[9px] text-white/30 leading-snug mt-4 pt-4 border-t border-white/[0.04]">
        Connect a public Instagram or TikTok account to verify your audience. Follower counts populate automatically once the engine finishes.
      </p>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl transition-all ${
            toast.type === "success"
              ? "border-accent/20 bg-accent/10 text-accent"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {toast.type === "success" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
