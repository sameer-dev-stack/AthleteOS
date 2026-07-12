export type ReferrerView = {
  valid: boolean;
  referrerName: string | null;
  referrerAvatar: string | null;
};

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
    referrerName: profile?.full_name ?? null,
    referrerAvatar: profile?.avatar_url ?? null,
  };
}
