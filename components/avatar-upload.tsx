"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  currentUrl: string | null;
  userId: string;
  onUpload: (url: string) => void;
  size?: "sm" | "md" | "lg";
  triggerOnly?: boolean;
};

const SIZE_MAP = {
  sm: "h-16 w-16",
  md: "h-20 w-20",
  lg: "h-28 w-28",
};

const TEXT_SIZE_MAP = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export function AvatarUpload({ currentUrl, userId, onUpload, size = "md", triggerOnly = false }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = "A";

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        setError("Image must be under 2 MB.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file.");
        return;
      }

      setError(null);
      setUploading(true);

      if (preview) URL.revokeObjectURL(preview);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      try {
        const supabase = createClient();
        if (!supabase) throw new Error("Supabase client unavailable");
        const ext = file.name.split(".").pop() || "jpg";
        const filePath = `${userId}/avatar.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

        onUpload(publicUrl);
      } catch (err) {
        setError("Upload failed. Please try again.");
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [userId, onUpload, preview]
  );

  const displayUrl = preview || currentUrl;

  if (triggerOnly) {
    return (
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="group relative">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Avatar"
            width={112}
            height={112}
            className={`${SIZE_MAP[size]} rounded-full object-cover ring-4 ring-accent/20`}
            unoptimized
          />
        ) : (
          <div
            className={`${SIZE_MAP[size]} flex items-center justify-center rounded-full bg-accent/15 ring-4 ring-accent/10`}
          >
            <span className={`${TEXT_SIZE_MAP[size]} font-bold text-accent`}>{initials}</span>
          </div>
        )}

        <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {preview && !uploading && (
        <button
          type="button"
          onClick={() => {
            if (preview) URL.revokeObjectURL(preview);
            setPreview(null);
          }}
          className="flex items-center gap-1 text-xs text-ink-dim hover:text-red-400 transition-colors"
        >
          <X className="h-3 w-3" />
          Remove
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
