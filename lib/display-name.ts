export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function cleanName(full: string | null, user: string | null): string {
  const raw = full || user || "";
  if (!raw) return "Athlete";
  if (isEmail(raw)) return raw.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return raw;
}
