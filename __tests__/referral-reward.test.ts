import { resolvePlan, type Plan } from "@/lib/referral-reward";

const future = new Date(Date.now() + 86400000).toISOString();
const past = new Date(Date.now() - 86400000).toISOString();

describe("resolvePlan", () => {
  it("returns pro directly from plan column", () => {
    expect(resolvePlan("pro", null)).toBe<Plan>("pro");
  });
  it("returns pro when extended_pro_until is in the future", () => {
    expect(resolvePlan("free", future)).toBe<Plan>("pro");
  });
  it("returns free when extended_pro_until is past or null", () => {
    expect(resolvePlan("free", past)).toBe<Plan>("free");
    expect(resolvePlan("free", null)).toBe<Plan>("free");
    expect(resolvePlan(null, null)).toBe<Plan>("free");
    expect(resolvePlan(undefined, past)).toBe<Plan>("free");
  });
});
