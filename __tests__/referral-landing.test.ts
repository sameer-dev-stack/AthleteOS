import {
  resolveReferrerView,
  sanitizeReferrerName,
} from "@/lib/referral-landing";

describe("sanitizeReferrerName", () => {
  it("returns null for null", () => {
    expect(sanitizeReferrerName(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(sanitizeReferrerName(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(sanitizeReferrerName("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(sanitizeReferrerName("   ")).toBeNull();
  });

  it("returns null for email-shaped string", () => {
    expect(sanitizeReferrerName("user@example.com")).toBeNull();
  });

  it("returns null for email with display name", () => {
    expect(sanitizeReferrerName("John <john@example.com>")).toBeNull();
  });

  it("trims and returns a clean name", () => {
    expect(sanitizeReferrerName("  Ava  ")).toBe("Ava");
  });

  it("returns the name when it is not email-shaped", () => {
    expect(sanitizeReferrerName("Jordan from USC")).toBe("Jordan from USC");
  });
});

describe("resolveReferrerView", () => {
  it("returns valid + name when code active and profile present", () => {
    expect(
      resolveReferrerView(
        "V4UWBPBR",
        { code: "V4UWBPBR", isActive: true },
        { full_name: "Ava", avatar_url: "ava.png" }
      )
    ).toEqual({
      valid: true,
      referrerName: "Ava",
      referrerAvatar: "ava.png",
    });
  });

  it("invalid when code missing", () => {
    expect(resolveReferrerView("X", null, null)).toEqual({
      valid: false,
      referrerName: null,
      referrerAvatar: null,
    });
  });

  it("invalid when code inactive", () => {
    expect(
      resolveReferrerView("X", { code: "X", isActive: false }, null)
    ).toEqual({
      valid: false,
      referrerName: null,
      referrerAvatar: null,
    });
  });

  it("falls back to null name when profile is null", () => {
    expect(
      resolveReferrerView(
        "V4UWBPBR",
        { code: "V4UWBPBR", isActive: true },
        null
      )
    ).toEqual({
      valid: true,
      referrerName: null,
      referrerAvatar: null,
    });
  });

  it("falls back to null name when full_name is null", () => {
    expect(
      resolveReferrerView(
        "V4UWBPBR",
        { code: "V4UWBPBR", isActive: true },
        { full_name: null, avatar_url: null }
      )
    ).toEqual({
      valid: true,
      referrerName: null,
      referrerAvatar: null,
    });
  });

  it("sanitizes email-shaped full_name to null", () => {
    expect(
      resolveReferrerView(
        "V4UWBPBR",
        { code: "V4UWBPBR", isActive: true },
        { full_name: "hacker@evil.com", avatar_url: null }
      )
    ).toEqual({
      valid: true,
      referrerName: null,
      referrerAvatar: null,
    });
  });

  it("trims whitespace from full_name", () => {
    expect(
      resolveReferrerView(
        "V4UWBPBR",
        { code: "V4UWBPBR", isActive: true },
        { full_name: "  Ava  ", avatar_url: "ava.png" }
      )
    ).toEqual({
      valid: true,
      referrerName: "Ava",
      referrerAvatar: "ava.png",
    });
  });
});
