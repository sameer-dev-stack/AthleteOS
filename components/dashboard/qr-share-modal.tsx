"use client";

import { useState, useEffect, useRef } from "react";
import { X, Copy, Check, Download } from "lucide-react";
import QRCode from "qrcode";

type Props = {
  url: string;
  open: boolean;
  onClose: () => void;
};

export function QrShareModal({ url, open, onClose }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !url || !canvasRef.current) return;

    let cancelled = false;
    const canvas = canvasRef.current;
    const qrOptions = {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    };

    QRCode.toCanvas(canvas, url, qrOptions).catch(() => {});
    QRCode.toDataURL(url, { ...qrOptions, width: 400 })
      .then((dataUrl) => { if (!cancelled) setQrDataUrl(dataUrl); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, url]);

  useEffect(() => {
    let cancelled = false;
    if (!open) {
      queueMicrotask(() => {
        setCopied(false);
        setQrDataUrl(null);
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function handleDownload() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "athleteos-qr.png";
    a.click();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#111113]/95 backdrop-blur-2xl p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close QR modal"
          className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl bg-white p-4 mb-5">
            <canvas ref={canvasRef} className="block" style={{ width: 200, height: 200 }} />
          </div>

          <p className="text-sm font-medium text-white/70 mb-1 truncate max-w-full">
            {url}
          </p>
          <p className="text-[11px] text-white/30 mb-6">
            Scan to view public card
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={handleCopy}
              aria-label={copied ? "Link copied" : "Copy link to clipboard"}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {copied ? (
                <Check className="h-4 w-4 text-accent" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy Link"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!qrDataUrl}
              aria-label="Download QR code"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-bg transition-all hover:shadow-[0_0_24px_-4px_rgba(198,255,61,0.5)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <Download className="h-4 w-4" />
              Download QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
