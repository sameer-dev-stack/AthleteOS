import { computeNilScoreAndRates, NILMetrics, NILProfile } from "../lib/nil-score";

describe("computeNilScoreAndRates", () => {
  it("handles baseline zero metrics correctly", () => {
    const metrics: NILMetrics = {
      card_views: 0,
      link_clicks: 0,
      click_through_rate: 0,
      tips_amount: 0,
      tips_count: 0,
      followers_total: 0,
      engagement_rate: 0,
    };
    const profile: NILProfile = {
      sport: null,
      school: null,
      position: null,
    };

    const result = computeNilScoreAndRates(metrics, profile);
    expect(result.nilScore).toBeLessThanOrEqual(15);
    expect(result.label).toBe("Emerging");
    expect(result.rates.post.target).toBe(50);
  });

  it("handles high visibility sports and power five school boosts", () => {
    const metrics: NILMetrics = {
      card_views: 100,
      link_clicks: 10,
      click_through_rate: 0.10,
      tips_amount: 50,
      tips_count: 2,
      followers_total: 500,
      engagement_rate: 0.05,
    };
    const profile: NILProfile = {
      sport: "Football",
      school: "Alabama Crimson Tide (SEC)",
      position: "Quarterback",
    };

    const result = computeNilScoreAndRates(metrics, profile);
    expect(result.breakdown.context).toBe(100); // 50 baseline + 30 sport + 20 school = 100
  });

  it("reaches Elite tier for high views and social reach", () => {
    const metrics: NILMetrics = {
      card_views: 15000,
      link_clicks: 2500,
      click_through_rate: 0.16,
      tips_amount: 1500,
      tips_count: 50,
      followers_total: 120000,
      engagement_rate: 0.12,
    };
    const profile: NILProfile = {
      sport: "Basketball",
      school: "Duke Blue Devils",
      position: "Forward",
    };

    const result = computeNilScoreAndRates(metrics, profile);
    expect(result.nilScore).toBeGreaterThanOrEqual(80);
    expect(result.label).toBe("Elite");
    expect(result.rates.post.min).toBe(2500);
    expect(result.rates.post.target).toBe(6000);
  });

  it("reaches Established tier for mid-range stats", () => {
    const metrics: NILMetrics = {
      card_views: 1500,
      link_clicks: 120,
      click_through_rate: 0.08,
      tips_amount: 150,
      tips_count: 5,
      followers_total: 12000,
      engagement_rate: 0.06,
    };
    const profile: NILProfile = {
      sport: "Soccer",
      school: "Stanford",
      position: "Midfielder",
    };

    const result = computeNilScoreAndRates(metrics, profile);
    expect(result.nilScore).toBeGreaterThan(60);
    expect(result.nilScore).toBeLessThanOrEqual(80);
    expect(result.label).toBe("Strong");
    expect(result.rates.post.target).toBe(1600);
  });
});
