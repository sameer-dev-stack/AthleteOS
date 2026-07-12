import { proUntilLabel, statusLabel, buildShareText } from "@/lib/referral-display";

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

describe("buildShareText", () => {
  it("returns default CTA when no name", () => {
    expect(buildShareText()).toBe("Claim your free athlete card on AthleteOS");
  });
  it("includes referrer name when provided", () => {
    expect(buildShareText("Ava")).toBe("Ava invited you to Claim your free athlete card on AthleteOS");
  });
});
