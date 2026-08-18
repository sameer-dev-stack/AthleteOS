"use client";

import React, { useEffect, useState, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, CheckCircle2, Info } from "lucide-react";

// ─── Toast ───────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto min-w-[300px] max-w-[420px] p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : toast.type === "error"
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  : "bg-sky-500/10 border-sky-500/20 text-sky-400"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : toast.type === "error" ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs font-medium flex-1">{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 text-current/60 hover:text-current transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

type ConfirmDialogConfig = {
  title: string;
  description: string;
  actionLabel: string;
  destructive?: boolean;
  requiresReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void | Promise<void>;
};

type ConfirmDialogContextValue = {
  openConfirm: (config: ConfirmDialogConfig) => void;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue>({
  openConfirm: () => {},
});

export function useConfirmDialog() {
  return useContext(ConfirmDialogContext);
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ConfirmDialogConfig | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const openConfirm = useCallback((newConfig: ConfirmDialogConfig) => {
    setReason("");
    setLoading(false);
    setConfig(newConfig);
  }, []);

  const close = useCallback(() => {
    if (!loading) {
      setConfig(null);
      setReason("");
    }
  }, [loading]);

  const handleConfirm = useCallback(async () => {
    if (!config) return;
    if (config.requiresReason && !reason.trim()) return;

    setLoading(true);
    try {
      await config.onConfirm(config.requiresReason ? reason : undefined);
      close();
    } catch (err) {
      console.error("Confirm action failed:", err);
      setLoading(false);
    }
  }, [config, reason, close]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !(config?.requiresReason && !reason.trim())) {
        handleConfirm();
      }
    },
    [handleConfirm, config, reason]
  );

  return (
    <ConfirmDialogContext.Provider value={{ openConfirm }}>
      {children}
      <AnimatePresence>
        {config && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[95] p-6 rounded-2xl border border-white/[0.1] bg-[#0A0A0B] shadow-2xl"
              onKeyDown={handleKeyDown}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    {config.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {config.description}
                  </p>
                </div>

                {config.requiresReason && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Reason (required)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={config.reasonPlaceholder || "Provide a reason for this action..."}
                      className="w-full h-20 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white text-xs placeholder:text-ink-dim focus:outline-none focus:border-accent/50 resize-none"
                      autoFocus
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={close}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-ink-muted hover:text-white text-xs font-semibold transition-all border border-white/[0.06] cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={(config.requiresReason && !reason.trim()) || loading}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      config.destructive
                        ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30"
                        : "bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      config.actionLabel
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmDialogContext.Provider>
  );
}
