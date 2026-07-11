"use client";

import { useEffect, useState } from "react";
import { Mail, Check, ChevronDown, ChevronUp } from "lucide-react";
import { getAthleteInquiries, updateInquiryStatus } from "@/lib/actions/inquiries";
import { Skeleton, SkeletonCard, SkeletonCircle } from "@/components/ui/skeleton";

type Inquiry = {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_company: string | null;
  inquiry_type: string;
  message: string;
  status: string;
  created_at: string;
};

export function InquiryInbox() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAthleteInquiries(1, 50).then((result) => {
      if (cancelled) return;
      if (result.ok && result.data) setInquiries(result.data as Inquiry[]);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  async function markRead(id: string) {
    const result = await updateInquiryStatus(id, "read");
    if (result.ok) {
      setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status: "read" } : i));
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-28 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-[#111113] p-4">
              <div className="flex items-center gap-3">
                <SkeletonCircle className="h-8 w-8 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/5 rounded" />
                  <Skeleton className="h-3 w-3/5 rounded" />
                </div>
                <Skeleton className="h-3 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] transition-colors hover:border-white/[0.1]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-white">Inquiries</h3>
          {newCount > 0 && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
              {newCount} new
            </span>
          )}
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#0D0D0F] p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <Mail className="h-5 w-5 text-accent/60" />
          </div>
          <p className="text-sm font-medium text-white">No inquiries yet</p>
          <p className="mt-1 text-xs text-ink-dim max-w-[240px] mx-auto">
            Share your card with brands and fans to start receiving partnership inquiries
          </p>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Check out my athlete card", url: window.location.origin });
              } else {
                navigator.clipboard.writeText(window.location.origin);
              }
            }}
            className="mt-4 rounded-lg bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
          >
            Share your card
          </button>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.06] bg-[#111113]">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="px-4 py-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === inquiry.id ? null : inquiry.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {inquiry.status === "new" && <div className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{inquiry.sender_name}</p>
                      {inquiry.sender_company && <span className="text-xs text-ink-dim">{inquiry.sender_company}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        inquiry.inquiry_type === "sponsorship" ? "bg-accent/15 text-accent" :
                        inquiry.inquiry_type === "booking" ? "bg-blue-500/15 text-blue-400" :
                        "bg-white/[0.06] text-ink-muted"
                      }`}>
                        {inquiry.inquiry_type}
                      </span>
                      <span className="text-[10px] text-ink-dim">{new Date(inquiry.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {inquiry.status === "new" && (
                    <button onClick={(e) => { e.stopPropagation(); markRead(inquiry.id); }} className="rounded-lg border border-white/[0.06] p-1.5 text-ink-dim hover:text-accent transition-colors">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {expandedId === inquiry.id ? (
                    <ChevronUp className="h-4 w-4 text-ink-dim" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-ink-dim" />
                  )}
                </div>
              </div>
              {expandedId === inquiry.id && (
                <div className="mt-3 border-t border-white/[0.06] pt-3">
                  <p className="text-xs text-ink-dim">{inquiry.sender_email}</p>
                  <p className="mt-2 text-sm text-ink-muted whitespace-pre-wrap">{inquiry.message}</p>
                  <div className="mt-3">
                    <a
                      href={`mailto:${inquiry.sender_email}?subject=Re: ${encodeURIComponent(inquiry.inquiry_type)} inquiry&body=Hi ${encodeURIComponent(inquiry.sender_name)},%0A%0A`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/20 transition-colors"
                    >
                      <Mail className="h-3 w-3" /> Reply via email
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
