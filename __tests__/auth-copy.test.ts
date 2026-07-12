import { accountCreatedCopy, nextPasswordInputType, securedNote } from "@/lib/auth-copy";

describe("accountCreatedCopy", () => {
  it("renders the generic verification line (no email leak)", () => {
    const c = accountCreatedCopy("ava@school.edu");
    expect(c.heading).toBe("Your account has been created");
    expect(c.body).toBe(
      "Please verify your account email has been sent to your email."
    );
  });
  it("does not throw / leaks when email missing", () => {
    const c = accountCreatedCopy(null);
    expect(c.heading).toBe("Your account has been created");
    expect(c.body).toBe(
      "Please verify your account email has been sent to your email."
    );
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
