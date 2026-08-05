"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Upload, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  currentUrl: string | null;
  userId: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
};

export function CoverImageUpload({ currentUrl, userId, onUpload, onRemove }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 4 * 1024 * 1024) {
        setError("Image must be under 4 MB.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file.");
        return;
      }

      setError(null);
      setUploading(true);

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      try {
        const supabase = createClient();
        if (!supabase) throw new Error("Supabase client unavailable");
        const ext = file.name.split(".").pop() || "jpg";
        const filePath = `${userId}/cover.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("covers")
          .upload(filePath, file, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data } = supabase.storage.from("covers").getPublicUrl(filePath);
        const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

        onUpload(publicUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [userId, onUpload]
  );

  const displayUrl = preview || currentUrl;

  return (
    <div className="w-full">
      <label className="text-xs font-bold text-ink-muted mb-2 block">Cover Image</label>
      <div className="group relative h-32 w-full overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt="Cover"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2">
              <label className="flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-medium text-white cursor-pointer backdrop-blur-sm hover:bg-white/20 transition-colors">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {uploading ? "Uploading..." : "Change"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <button
                type="button"
                onClick={onRemove}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500/20 px-3 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </>
        ) : (
          <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 text-ink-dim hover:text-ink transition-colors">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <span className="text-xs font-medium">
              {uploading ? "Uploading..." : "Upload cover image (1200x400 recommended)"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
