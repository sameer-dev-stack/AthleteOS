const NAME_CHAR_RE = /[^a-zA-ZÀ-ÿ\s'\-]/g;
const URL_LIKE_RE = /^(https?:\/\/|www\.|\.com|\.net|\.org|\.io)/i;

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function sanitizeName(raw: string): string {
  let s = raw.trim();
  if (URL_LIKE_RE.test(s)) return "";
  s = s.replace(NAME_CHAR_RE, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

export function cleanName(full: string | null, user: string | null): string {
  const raw = full || user || "";
  if (!raw) return "Athlete";
  if (isEmail(raw)) return raw.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const sanitized = sanitizeName(raw);
  return sanitized || "Athlete";
}
