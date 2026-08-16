"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { X, Check, Loader2, RotateCcw } from "lucide-react";
import { cropImageToBlob, fitSquareImageToBlob, getImageSize } from "@/lib/crop-image";

type Props = {
  imageUrl: string | null;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
};

const MIN_SOURCE_DIM = 200;

export function AvatarCropModal({ imageUrl, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [minSourceDim, setMinSourceDim] = useState<number | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  const tooSmall = minSourceDim !== null && minSourceDim < MIN_SOURCE_DIM;

  useEffect(() => {
    if (!imageUrl) return;
    getImageSize(imageUrl)
      .then(({ width, height }) => setMinSourceDim(Math.min(width, height)))
      .catch(() => setMinSourceDim(null));
  }, [imageUrl]);

  useEffect(() => {
    if (!imageUrl) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !processing) onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [imageUrl, processing, onCancel]);

  const refreshThumb = useCallback(
    async (px: Area) => {
      if (!imageUrl) return;
      try {
        const blob = await cropImageToBlob(imageUrl, px, 256);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setThumbUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch {}
    },
    [imageUrl]
  );

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setPixelCrop(croppedAreaPixels);
      refreshThumb(croppedAreaPixels);
    },
    [refreshThumb]
  );

  useEffect(() => {
    return () => {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    };
  }, [thumbUrl]);

  function handleReset() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  async function handleCrop() {
    if (!imageUrl || !pixelCrop) return;
    setProcessing(true);
    try {
      const blob = await cropImageToBlob(imageUrl, pixelCrop);
      if (blob) onConfirm(blob);
    } catch {
      onCancel();
    } finally {
      setProcessing(false);
    }
  }

  async function handleUseAsIs() {
    if (!imageUrl || tooSmall) return;
    setProcessing(true);
    try {
      const blob = await fitSquareImageToBlob(imageUrl);
      if (blob) onConfirm(blob);
    } catch {
      onCancel();
    } finally {
      setProcessing(false);
    }
  }

  if (!imageUrl) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md sm:items-center"
      onClick={() => {
        if (!processing) onCancel();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111113] p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Crop your photo</h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="rounded-lg p-1.5 text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Main image */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-dim">
            Main Image
          </span>
          <span className="text-[11px] text-ink-muted">Drag to position · Pinch to zoom</span>
        </div>
        <div
          className="relative mt-2 aspect-square w-full overflow-hidden rounded-xl border border-white/[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #1c1c1f 25%, transparent 25%, transparent 75%, #1c1c1f 75%), linear-gradient(45deg, #1c1c1f 25%, #19191c 25%, #19191c 75%, #1c1c1f 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        >
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* Circle-scoped rule-of-thirds grid (square grid clipped by the circle reads as broken) */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <clipPath id="crop-circle-grid">
                  <circle cx="50" cy="50" r="50" />
                </clipPath>
              </defs>
              <g clipPath="url(#crop-circle-grid)" stroke="rgba(255,255,255,0.28)" strokeWidth="0.35" vectorEffect="non-scaling-stroke">
                <line x1="33.33" y1="0" x2="33.33" y2="100" />
                <line x1="66.66" y1="0" x2="66.66" y2="100" />
                <line x1="0" y1="33.33" x2="100" y2="33.33" />
                <line x1="0" y1="66.66" x2="100" y2="66.66" />
              </g>
            </svg>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle closest-side at center, transparent 0, transparent 98.4%, rgba(0,0,0,0.35) 99.4%)",
              }}
            />
            <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" />
          </div>
        </div>

        {/* Badge preview */}
        <div className="mt-5 flex flex-col items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-dim">
            Badge Preview
          </span>
          <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full ring-2 ring-accent/30">
            {thumbUrl ? (
              <Image
                src={thumbUrl}
                alt="Cropped badge preview"
                width={160}
                height={160}
                unoptimized
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-accent/10 text-xs text-ink-dim">
                Crop
              </div>
            )}
          </div>
          <span className="text-center text-[11px] text-ink-muted">
            This is how your image will appear on your NIL CARD.
          </span>
        </div>

        {/* Zoom */}
        <div className="mt-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-dim">
            Zoom
          </span>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
              disabled={processing}
              className="shrink-0 rounded-lg bg-white/[0.06] px-3 py-1.5 text-sm font-bold text-white hover:bg-white/[0.12] disabled:opacity-40"
              aria-label="Zoom out"
            >
              -
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              disabled={processing}
              aria-label="Zoom"
              className="h-2 min-w-0 flex-1 accent-[#C6FF3D]"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
              disabled={processing}
              className="shrink-0 rounded-lg bg-white/[0.06] px-3 py-1.5 text-sm font-bold text-white hover:bg-white/[0.12] disabled:opacity-40"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-ink-dim">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={handleReset}
              disabled={processing}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/[0.12] disabled:opacity-40"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>

        {tooSmall && (
          <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
            This image is too small. Use the crop to zoom in.
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleUseAsIs}
            disabled={processing || tooSmall}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Use as is
          </button>
          <button
            type="button"
            onClick={handleCrop}
            disabled={processing}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {processing ? "Processing..." : "Crop"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
