"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { X, Check, Loader2 } from "lucide-react";
import { cropImageToBlob, boundImageToBlob } from "@/lib/crop-image";

type Props = {
  imageUrl: string | null;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
};

export function AvatarCropModal({ imageUrl, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setPixelCrop(croppedAreaPixels);
    },
    []
  );

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
    if (!imageUrl) return;
    setProcessing(true);
    try {
      const blob = await boundImageToBlob(imageUrl);
      if (blob) onConfirm(blob);
    } catch {
      onCancel();
    } finally {
      setProcessing(false);
    }
  }

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
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

        <div className="relative h-80 w-full overflow-hidden rounded-xl bg-black">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
            disabled={processing}
            className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-white/[0.08]"
          >
            Zoom out
          </button>
          <div className="h-px flex-1 bg-white/[0.08]" />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
            disabled={processing}
            className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-white/[0.08]"
          >
            Zoom in
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-dim">
          Drag to position. Pinch or scroll to zoom.
        </p>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={handleUseAsIs}
            disabled={processing}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-white/[0.05]"
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
    </div>
  );
}
