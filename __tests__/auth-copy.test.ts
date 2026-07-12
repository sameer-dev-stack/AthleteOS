import { accountCreatedCopy, nextPasswordInputType, securedNote } from "@/lib/auth-copy";

describe("accountCreatedCopy", () => {
  it("includes the verification line with the email", () => {
    const c = accountCreatedCopy("ava@school.edu");
    expect(c.heading).toBe("Your account has been created");
    expect(c.body).toContain("Please verify your account");
    expect(c.body).toContain("ava@school.edu");
  });
  it("does not throw / leaks when email missing", () => {
    const c = accountCreatedCopy(null);
    expect(c.heading).toBe("Your account has been created");
    expect(c.body).toContain("verification email has been sent");
  });
});

describe("nextPasswordInputType", () => {
  it("toggles text <-> password", () => {
    expect(nextPasswordInputType(false)).toBe("text");
    expect(nextPasswordInputType(true)).toBe("password");
  });
});

describe("securedNote", () => {
  it("returns the secured trust line", () => {
    expect(securedNote()).toBe("Secured by 256-bit encryption · No card required");
  });
});
