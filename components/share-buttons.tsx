"use client";

import { Twitter, Linkedin, Copy, Share2, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

export function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setCanShare(typeof navigator !== "undefined" && !!navigator.share));
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = description ? encodeURIComponent(description) : "";

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: description || title, url });
    } catch {
      // User cancelled or share failed
    }
  };

  const openShare = (url: string) => {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // Popup blocked or not supported
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {canShare && (
        <button
          onClick={handleNativeShare}
          className="h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 text-white/25 hover:text-white/60"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          aria-label="Share"
        >
          <Share2 className="h-3 w-3" />
        </button>
      )}
      <button
        onClick={() => openShare(shareLinks.twitter)}
        className="h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 text-white/25 hover:text-white/60"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        aria-label="Share on Twitter"
      >
        <Twitter className="h-3 w-3" />
      </button>
      <button
        onClick={() => openShare(shareLinks.linkedin)}
        className="h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 text-white/25 hover:text-white/60"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-3 w-3" />
      </button>
      <button
        onClick={copyLink}
        className="h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 text-white/25 hover:text-white/60"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        aria-label="Copy link"
      >
        {copied ? (
          <Check className="h-3 w-3 text-[#C6FF3D]" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
