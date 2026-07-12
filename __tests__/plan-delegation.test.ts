jest.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: {
              plan: "free",
              extended_pro_until: new Date(Date.now() + 86400000).toISOString(),
            },
          }),
        }),
      }),
    }),
  }),
}));

import { getPlan } from "@/lib/actions/ai-usage";

describe("getPlan delegation", () => {
  it("returns pro when extended_pro_until is future (referral/stripe grant)", async () => {
    expect(await getPlan()).toBe("pro");
  });
});
