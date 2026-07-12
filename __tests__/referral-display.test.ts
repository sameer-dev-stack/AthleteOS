import { proUntilLabel, statusLabel, buildShareText, sanitizeReferrerName, buildInvitedBy } from "@/lib/referral-display";

describe("proUntilLabel", () => {
  it("returns dash when null/undefined", () => {
    expect(proUntilLabel(null)).toBe("—");
    expect(proUntilLabel(undefined)).toBe("—");
  });
  it("returns Active when future", () => {
    expect(proUntilLabel(new Date(Date.now() + 86400000).toISOString())).toBe("Active");
  });
  it("returns formatted date when past", () => {
    expect(proUntilLabel(new Date(Date.now() - 86400000).toISOString())).toMatch(/[A-Z][a-z]{2} \d{1,2}, \d{4}/);
  });
});

describe("statusLabel", () => {
  it("maps known statuses", () => {
    expect(statusLabel("completed")).toBe("Completed");
    expect(statusLabel("rewarded")).toBe("Rewarded");
    expect(statusLabel("pending")).toBe("Pending");
  });
  it("falls back to dash", () => {
    expect(statusLabel(null)).toBe("—");
    expect(statusLabel("unknown")).toBe("—");
  });
});

describe("sanitizeReferrerName", () => {
  it("returns a plain display name", () => {
    expect(sanitizeReferrerName("Ava Carter")).toBe("Ava Carter");
  });
  it("returns null for email-shaped values", () => {
    expect(sanitizeReferrerName("cljefylo@denip.net")).toBeNull();
    expect(sanitizeReferrerName("a@b.co")).toBeNull();
    expect(sanitizeReferrerName("user@example.com")).toBeNull();
  });
  it("returns null for empty/whitespace", () => {
    expect(sanitizeReferrerName("")).toBeNull();
    expect(sanitizeReferrerName(null)).toBeNull();
    expect(sanitizeReferrerName("   ")).toBeNull();
  });
});

describe("buildInvitedBy", () => {
  it("builds greeting from a safe name", () => {
    expect(buildInvitedBy("Ava")).toBe("Invited by Ava");
  });
  it("falls back to generic when name unsafe/missing", () => {
    expect(buildInvitedBy(null)).toBe("You've been invited");
    expect(buildInvitedBy("cljefylo@denip.net")).toBe("You've been invited");
  });
});
