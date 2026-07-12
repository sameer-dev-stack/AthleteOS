import { resolveReferrerView } from "@/lib/referral-landing";

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
});
