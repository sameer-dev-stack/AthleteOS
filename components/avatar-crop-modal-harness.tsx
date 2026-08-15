"use client";

import { useRef, useState } from "react";
import { AvatarCropModal } from "@/components/avatar-crop-modal";

const TEST_IMAGE = "/crop-test-image.jpg";

export function AvatarCropModalHarness() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex gap-3">
        <button
          type="button"
          onClick={() => setImageUrl(TEST_IMAGE)}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white"
        >
          Open with test image
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (imageUrl) URL.revokeObjectURL(imageUrl);
              setImageUrl(URL.createObjectURL(f));
            }
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white"
        >
          Pick from disk
        </button>
      </div>

      {result && (
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="text-xs text-white/60">Final output</span>
          <img src={result} alt="Final output" className="h-24 w-24 rounded-full object-cover" />
          <button
            type="button"
            onClick={() => {
              URL.revokeObjectURL(result);
              setResult(null);
            }}
            className="text-xs text-white/50 underline"
          >
            Clear
          </button>
        </div>
      )}

      <p id="picker-opened" className="mb-6 hidden text-xs text-white">
        file picker opened
      </p>

      <AvatarCropModal
        imageUrl={imageUrl}
        onCancel={() => {
          if (imageUrl && imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
          setImageUrl(null);
        }}
        onConfirm={(blob) => {
          const url = URL.createObjectURL(blob);
          setResult(url);
          if (imageUrl && imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
          setImageUrl(null);
        }}
      />
    </div>
  );
}
