"use client";

import { useState } from "react";
import { Share2, Copy, Check, Twitter, MessageCircle, Mail } from "lucide-react";
import { buildShareLinks } from "@/lib/share-links";

export function ShareSheet({ link, text }: { link: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const { twitter, whatsapp, email } = buildShareLinks(link, text);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  async function native() {
    if (navigator.share) {
      try { await navigator.share({ title: "Join AthleteOS", text, url: link }); } catch {}
    } else copy();
  }

  // Matches referral-card.tsx action-button styling (bg-accent/10, text-accent).
  const btn = "flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20";

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={native} className={btn}><Share2 className="h-3 w-3" /> Share</button>
      <button onClick={copy} className={btn}>{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? "Copied" : "Copy"}</button>
      <a href={twitter} target="_blank" rel="noopener noreferrer" className={btn}><Twitter className="h-3 w-3" /> X</a>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={btn}><MessageCircle className="h-3 w-3" /> WhatsApp</a>
      <a href={email} className={btn}><Mail className="h-3 w-3" /> Email</a>
    </div>
  );
}
