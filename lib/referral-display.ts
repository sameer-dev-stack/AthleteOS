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
