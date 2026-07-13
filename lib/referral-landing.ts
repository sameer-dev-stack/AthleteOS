export type ReferrerView = {
  valid: boolean;
  referrerName: string | null;
  referrerAvatar: string | null;
};

function containsAtSign(value: string): boolean {
  return value.includes("@");
}

export function sanitizeReferrerName(
  name: string | null | undefined
): string | null {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();
  if (containsAtSign(trimmed)) return null;
  return trimmed;
}

export function resolveReferrerView(
  code: string,
  codeRow: { code: string; isActive: boolean } | null,
  profile: { full_name: string | null; avatar_url: string | null } | null
): ReferrerView {
  if (!codeRow || codeRow.code !== code || !codeRow.isActive) {
    return { valid: false, referrerName: null, referrerAvatar: null };
  }
  return {
    valid: true,
    referrerName: sanitizeReferrerName(profile?.full_name),
    referrerAvatar: profile?.avatar_url ?? null,
  };
}
