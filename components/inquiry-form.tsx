"use client";

import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Mail, Send, CheckCircle, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { submitInquiry } from "@/lib/actions/inquiries";
import { trackFunnel } from "@/lib/hooks/use-funnel-tracking";

type Props = {
  athleteId: string;
  athleteName: string;
  open: boolean;
  onClose: () => void;
};

const INQUIRY_TYPES = [
  { value: "sponsorship", label: "Sponsorship" },
  { value: "booking", label: "Appearance/Booking" },
  { value: "shoutout", label: "Shoutout" },
  { value: "collab", label: "Collaboration" },
  { value: "other", label: "Other" },
];

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary h-10 px-5 text-xs disabled:opacity-50"
    >
      {pending ? "Sending..." : "Send Inquiry"}
      {!pending && <Send className="h-3.5 w-3.5 ml-1.5" />}
    </button>
  );
}

export function InquiryForm({ athleteId, athleteName, open, onClose }: Props) {
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function handleSubmit(formData: FormData) {
    const res = await submitInquiry(
      athleteId,
      formData.get("sender_name") as string,
      formData.get("sender_email") as string,
      (formData.get("sender_company") as string) || undefined,
      formData.get("inquiry_type") as string,
      formData.get("message") as string
    );
    setResult(res);
    if (res.ok) {
      trackFunnel("inquiry_sent", { athleteId });
      setTimeout(() => {
        setResult(null);
        onClose();
      }, 2000);
    }
  }

  if (!open) return <AnimatePresence />;

   return (
    <AnimatePresence>
      {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl bg-[#111113] border border-white/[0.08] shadow-2xl overflow-hidden"
           style={{ transform: "translateZ(0)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Contact {athleteName}</h3>
                <p className="text-xs text-white/40">Send a partnership inquiry</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close inquiry form"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          {result?.ok ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle className="h-10 w-10 text-accent mx-auto mb-3" />
              <p className="text-sm font-medium text-white">Inquiry sent successfully</p>
              <p className="text-xs text-white/40 mt-1">They will receive an email notification</p>
            </div>
          ) : (
            <form action={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Your Name</label>
                  <input
                    name="sender_name"
                    required
                    placeholder="John Smith"
                    className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Email</label>
                  <input
                    name="sender_email"
                    type="email"
                    required
                    placeholder="john@brand.com"
                    className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Company</label>
                <input
                  name="sender_company"
                  placeholder="Brand name (optional)"
                  className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Inquiry Type</label>
                <select
                  name="inquiry_type"
                  className="h-10 w-full rounded-lg border border-white/[0.08] bg-[#1a1a1c] px-3 text-sm text-white focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
                >
                  {INQUIRY_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-[#111113] text-white">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Message</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Tell them about your partnership opportunity..."
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 resize-none"
                />
              </div>

              {result && !result.ok && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {result.error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-4 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <SubmitBtn />
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
