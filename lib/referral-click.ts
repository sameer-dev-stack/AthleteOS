import crypto from "crypto";

// Hash an IP for referral-click attribution. Fail CLOSED to null if no secret —
// we never persist a raw IP (consistent with analytics posture, PROJECT.md section 16).
export function hashIp(ip: string | null, secret: string | undefined | null): string | null {
  if (!ip || !secret) return null;
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}
