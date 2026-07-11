import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/wav",
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function getSupabaseServiceRole() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function uploadContentMedia(
  file: File,
  athleteId: string
): Promise<{ url: string; path: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("File type not allowed");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File too large (max 10 MB)");
  }
  if (!/^[a-f0-9-]{36}$/.test(athleteId)) {
    throw new Error("Invalid athlete ID");
  }

  const supabase = getSupabaseServiceRole();
  const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "bin";
  const path = `${athleteId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("content-media")
    .upload(path, file, { contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from("content-media").getPublicUrl(path);

  return { url: data.publicUrl, path };
}

export async function deleteContentMedia(path: string) {
  if (!path || path.includes("..") || path.startsWith("/")) {
    throw new Error("Invalid storage path");
  }
  const supabase = getSupabaseServiceRole();
  const { error } = await supabase.storage.from("content-media").remove([path]);
  if (error) throw error;
}
