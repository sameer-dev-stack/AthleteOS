// Pure display helpers for the referral dashboard — unit-testable, no DB/React.
export function proUntilLabel(extendedProUntil: string | null | undefined): string {
  if (!extendedProUntil) return "—";
  const t = new Date(extendedProUntil).getTime();
  if (t > Date.now()) return "Active";
  return new Date(extendedProUntil).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function statusLabel(status: string | null | undefined): string {
  switch (status) {
    case "completed": return "Completed";
    case "rewarded": return "Rewarded";
    case "pending": return "Pending";
    default: return "—";
  }
}

// Default share copy for referral invites; optionally personalized with referrer name.
export function buildShareText(referrerName?: string | null): string {
  const base = "Claim your free athlete card on AthleteOS";
  return referrerName ? `${referrerName} invited you to ${base}` : base;
}

// Strips any value that looks like an email (or is empty) so the referral
// banner can never surface PII. Free-text display names are not trustworthy.
export function sanitizeReferrerName(name: string | null | undefined): string | null {
  if (!name || !name.trim()) return null;
  // Email-shaped (has @ and a dot-domain) is treated as PII and dropped.
  if (/^\S+@\S+\.\S+$/.test(name.trim())) return null;
  const trimmed = name.trim();
  if (trimmed.length > 50) return null; // absurd-length guard
  return trimmed;
}

// Greeting on the sign-up page. Falls back to a generic invite when the name
// is missing or PII-shaped, so we never display an email on a stranger's page.
export function buildInvitedBy(name: string | null | undefined): string {
  const safe = sanitizeReferrerName(name);
  return safe ? `Invited by ${safe}` : "You've been invited";
}
