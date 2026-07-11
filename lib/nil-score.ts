export type NILMetrics = {
  card_views: number;
  link_clicks: number;
  click_through_rate: number;
  tips_amount: number;
  tips_count: number;
  followers_total: number;
  engagement_rate: number;
};

export type NILProfile = {
  sport: string | null;
  school: string | null;
  position: string | null;
};

export type RateRange = {
  min: number;
  target: number;
  max: number;
};

export type NILScoreResult = {
  nilScore: number;
  label: "Emerging" | "Growing" | "Established" | "Strong" | "Elite";
  breakdown: {
    cardPerformance: number;
    socialReach: number;
    engagement: number;
    context: number;
  };
  rates: {
    post: RateRange;
    appearance: RateRange;
    campaign: RateRange;
  };
  sportWeights: SportWeights;
  breakdownVisualization: BreakdownVisualization;
  dealScore: DealScore;
};

// ---------------------------------------------------------------------------
// Sport-specific scoring weights
// ---------------------------------------------------------------------------

export type SportCategory =
  | "football"
  | "basketball"
  | "baseball"
  | "soccer"
  | "olympic"
  | "other";

export type SportWeights = {
  category: SportCategory;
  label: string;
  socialWeight: number;
  performanceWeight: number;
  engagementWeight: number;
  contextWeight: number;
  description: string;
};

const SPORT_WEIGHTS: Record<SportCategory, SportWeights> = {
  football: {
    category: "football",
    label: "Football",
    socialWeight: 0.30,
    performanceWeight: 0.35,
    engagementWeight: 0.20,
    contextWeight: 0.15,
    description:
      "Football athletes benefit from large social followings and team visibility. Performance metrics (views, CTR) are weighted highest due to national TV exposure.",
  },
  basketball: {
    category: "basketball",
    label: "Basketball",
    socialWeight: 0.35,
    performanceWeight: 0.30,
    engagementWeight: 0.20,
    contextWeight: 0.15,
    description:
      "Basketball athletes have the highest social brand potential in NIL. Individual highlights and social reach drive deal value more than team context.",
  },
  baseball: {
    category: "baseball",
    label: "Baseball",
    socialWeight: 0.25,
    performanceWeight: 0.30,
    engagementWeight: 0.25,
    contextWeight: 0.20,
    description:
      "Baseball athletes benefit from consistent engagement and regional fan bases. Context (school, league) adds meaningful deal value.",
  },
  soccer: {
    category: "soccer",
    label: "Soccer",
    socialWeight: 0.30,
    performanceWeight: 0.25,
    engagementWeight: 0.25,
    contextWeight: 0.20,
    description:
      "Soccer athletes have strong international appeal. Engagement and global reach are weighted equally with performance.",
  },
  olympic: {
    category: "olympic",
    label: "Olympic / Olympic-Track",
    socialWeight: 0.40,
    performanceWeight: 0.20,
    engagementWeight: 0.25,
    contextWeight: 0.15,
    description:
      "Olympic and individual sport athletes rely heavily on personal brand and social presence. Performance spikes are event-driven and weighted lower.",
  },
  other: {
    category: "other",
    label: "Other Sport",
    socialWeight: 0.30,
    performanceWeight: 0.30,
    engagementWeight: 0.20,
    contextWeight: 0.20,
    description:
      "Default weights for sports not explicitly categorized.",
  },
};

function classifySport(sport: string | null): SportCategory {
  const s = (sport || "").toLowerCase();
  if (s.includes("football")) return "football";
  if (s.includes("basketball")) return "basketball";
  if (s.includes("baseball") || s.includes("softball")) return "baseball";
  if (s.includes("soccer")) return "soccer";
  const olympicKeywords = [
    "swim", "track", "field", "gymnast", "tennis", "golf",
    "volleyball", "wrestling", "lacrosse", "rowing", "crew",
    "wrestling", "fencing", "archery", "wrestling", "judo",
    "ski", "snowboard", "ice skating", "hockey", "boxing",
    "taekwondo", "weightlifting", "cross country",
  ];
  if (olympicKeywords.some((k) => s.includes(k))) return "olympic";
  return "other";
}

// ---------------------------------------------------------------------------
// Historical score tracking
// ---------------------------------------------------------------------------

export type ScoreSnapshot = {
  timestamp: string;
  nilScore: number;
  label: NILScoreResult["label"];
  breakdown: NILScoreResult["breakdown"];
};

export type TrendDirection = "rising" | "stable" | "declining";

export type TrendLine = {
  direction: TrendDirection;
  changeRate: number;
  changeAbsolute: number;
  dataPoints: { x: number; y: number }[];
  movingAverage: number[];
};

export type HistoricalResult = {
  snapshots: ScoreSnapshot[];
  trend: TrendLine;
};

function computeTrendLine(snapshots: ScoreSnapshot[]): TrendLine {
  if (snapshots.length < 2) {
    return {
      direction: "stable",
      changeRate: 0,
      changeAbsolute: 0,
      dataPoints: [],
      movingAverage: [],
    };
  }

  const dataPoints = snapshots.map((s, i) => ({
    x: i,
    y: s.nilScore,
  }));

  const movingAverage = computeMovingAverage(
    dataPoints.map((d) => d.y),
    3
  );

  const first = snapshots[0].nilScore;
  const last = snapshots[snapshots.length - 1].nilScore;
  const changeAbsolute = last - first;
  const changeRate = first > 0 ? ((last - first) / first) * 100 : 0;

  let direction: TrendDirection = "stable";
  if (changeAbsolute > 3) direction = "rising";
  else if (changeAbsolute < -3) direction = "declining";

  return { direction, changeRate: Math.round(changeRate * 10) / 10, changeAbsolute, dataPoints, movingAverage };
}

function computeMovingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    result.push(
      Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10
    );
  }
  return result;
}

// ---------------------------------------------------------------------------
// Breakdown visualization data
// ---------------------------------------------------------------------------

export type BreakdownVisualization = {
  categories: BreakdownCategory[];
  radarPoints: { axis: string; value: number }[];
  percentileEstimate: number;
};

export type BreakdownCategory = {
  key: string;
  label: string;
  value: number;
  max: number;
  percentage: number;
  color: string;
};

function buildBreakdownVisualization(
  breakdown: NILScoreResult["breakdown"],
  nilScore: number
): BreakdownVisualization {
  const categories: BreakdownCategory[] = [
    {
      key: "cardPerformance",
      label: "Card Performance",
      value: breakdown.cardPerformance,
      max: 100,
      percentage: breakdown.cardPerformance,
      color: "#C6FF3D",
    },
    {
      key: "socialReach",
      label: "Social Reach",
      value: breakdown.socialReach,
      max: 100,
      percentage: breakdown.socialReach,
      color: "#A3E635",
    },
    {
      key: "engagement",
      label: "Engagement",
      value: breakdown.engagement,
      max: 100,
      percentage: breakdown.engagement,
      color: "#84CC16",
    },
    {
      key: "context",
      label: "Context",
      value: breakdown.context,
      max: 100,
      percentage: breakdown.context,
      color: "#65A30D",
    },
  ];

  const radarPoints = categories.map((c) => ({
    axis: c.label,
    value: c.percentage,
  }));

  const percentileEstimate = Math.min(
    99,
    Math.round(
      20 * Math.log10(nilScore + 1) * 5
    )
  );

  return { categories, radarPoints, percentileEstimate };
}

// ---------------------------------------------------------------------------
// NIL deal scoring based on profile completeness
// ---------------------------------------------------------------------------

export type DealScore = {
  score: number;
  tier: "Low" | "Medium" | "High" | "Premium";
  missingFields: string[];
  recommendations: string[];
  profileCompletion: number;
};

const HIGH_DEAL_FIELDS = [
  { key: "avatar_url", label: "Profile photo", weight: 15 },
  { key: "bio", label: "Bio", weight: 12 },
  { key: "stats", label: "Stats", weight: 14 },
  { key: "highlights", label: "Highlights", weight: 13 },
  { key: "social", label: "Social links", weight: 12 },
  { key: "links", label: "External links", weight: 10 },
  { key: "sport", label: "Sport", weight: 8 },
  { key: "school", label: "School", weight: 8 },
  { key: "position", label: "Position", weight: 5 },
  { key: "contact_email", label: "Contact email", weight: 3 },
];

function computeDealScore(profile: NILProfile & Record<string, any>): DealScore {
  let score = 0;
  const missingFields: string[] = [];
  const recommendations: string[] = [];

  for (const field of HIGH_DEAL_FIELDS) {
    const val = profile[field.key];
    const filled =
      val !== null &&
      val !== undefined &&
      val !== "" &&
      (Array.isArray(val) ? val.length > 0 : true) &&
      (typeof val === "object" && !Array.isArray(val) ? Object.keys(val).length > 0 : true);

    if (filled) {
      score += field.weight;
    } else {
      missingFields.push(field.label);
    }
  }

  const profileCompletion = Math.round(
    ((HIGH_DEAL_FIELDS.length - missingFields.length) / HIGH_DEAL_FIELDS.length) * 100
  );

  if (missingFields.includes("Profile photo")) {
    recommendations.push("Add a professional profile photo — brands expect visual presence");
  }
  if (missingFields.includes("Bio")) {
    recommendations.push("Write a compelling bio — this is your first impression for brands");
  }
  if (missingFields.includes("Stats")) {
    recommendations.push("Add athletic stats — verified performance data increases deal value");
  }
  if (missingFields.includes("Highlights")) {
    recommendations.push("Upload highlight clips — video content drives 3x more brand interest");
  }
  if (missingFields.includes("Social links")) {
    recommendations.push("Connect your social accounts — brands evaluate your reach directly");
  }
  if (missingFields.includes("Contact email")) {
    recommendations.push("Add a contact email — brands need a way to reach you");
  }

  let tier: DealScore["tier"] = "Low";
  if (score >= 85) tier = "Premium";
  else if (score >= 65) tier = "High";
  else if (score >= 40) tier = "Medium";

  return { score, tier, missingFields, recommendations, profileCompletion };
}

// ---------------------------------------------------------------------------
// Competitor comparison
// ---------------------------------------------------------------------------

export type CompetitorAthlete = {
  name: string;
  sport: string;
  nilScore: number;
  breakdown: NILScoreResult["breakdown"];
};

export type ComparisonResult = {
  rank: number;
  total: number;
  percentile: number;
  ahead: CompetitorAthlete[];
  behind: CompetitorAthlete[];
  avgScore: number;
  scoreVsAvg: number;
};

function computeCompetitorComparison(
  athleteScore: number,
  competitors: CompetitorAthlete[]
): ComparisonResult {
  const sorted = [...competitors].sort((a, b) => b.nilScore - a.nilScore);
  const rank = sorted.findIndex((c) => c.nilScore <= athleteScore) + 1 || sorted.length + 1;
  const avgScore =
    sorted.length > 0
      ? Math.round(sorted.reduce((a, c) => a + c.nilScore, 0) / sorted.length)
      : 0;
  const percentile =
    sorted.length > 0
      ? Math.round((rank / (sorted.length + 1)) * 100)
      : 50;

  return {
    rank,
    total: sorted.length,
    percentile,
    ahead: sorted.filter((c) => c.nilScore > athleteScore),
    behind: sorted.filter((c) => c.nilScore <= athleteScore),
    avgScore,
    scoreVsAvg: athleteScore - avgScore,
  };
}

// ---------------------------------------------------------------------------
// Core scoring engine
// ---------------------------------------------------------------------------

/**
 * Computes NIL Score (0-100) and suggested rates based on athlete analytics and profile.
 * Now includes sport-specific weights, visualization data, deal scoring, and competitor comparison.
 */
export function computeNilScoreAndRates(
  metrics: NILMetrics,
  profile: NILProfile
): NILScoreResult {
  const sportCategory = classifySport(profile.sport);
  const weights = SPORT_WEIGHTS[sportCategory];

  // 1. Card Performance Component (Max 100 points)
  const viewScore =
    metrics.card_views > 0
      ? Math.min(100, Math.round(20 * Math.log10(metrics.card_views + 1)))
      : 0;

  const ctrScore = Math.min(
    100,
    Math.round((metrics.click_through_rate || 0) * 100 * 6.67)
  );

  const tipsScore =
    metrics.tips_amount > 0
      ? Math.min(100, Math.round(25 * Math.log10(metrics.tips_amount + 1)))
      : 0;

  const cardPerformanceRaw = viewScore * 0.4 + ctrScore * 0.3 + tipsScore * 0.3;

  // 2. Social Reach Component (Max 100 points)
  const socialReachRaw =
    metrics.followers_total > 0
      ? Math.min(100, Math.round(20 * Math.log10(metrics.followers_total + 1)))
      : 0;

  // 3. Engagement Component (Max 100 points)
  const engagementRaw = Math.min(
    100,
    Math.round((metrics.engagement_rate || 0) * 1000)
  );

  // 4. Sport/Context Component (Max 100 points)
  let contextRaw = 50;

  const sport = (profile.sport || "").toLowerCase();
  const highVisibilitySports = [
    "football",
    "basketball",
    "softball",
    "baseball",
    "gymnastics",
  ];
  if (highVisibilitySports.some((s) => sport.includes(s))) {
    contextRaw += 30;
  } else if (sport) {
    contextRaw += 15;
  }

  const school = (profile.school || "").toLowerCase();
  const powerFiveKeywords = [
    "sec",
    "big ten",
    "acc",
    "big 12",
    "pac-12",
    "alabama",
    "michigan",
    "ohio state",
    "georgia",
    "texas",
    "usc",
  ];
  if (powerFiveKeywords.some((k) => school.includes(k))) {
    contextRaw += 20;
  }

  contextRaw = Math.min(100, contextRaw);

  // Sport-specific weighted NIL Score calculation
  const nilScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        cardPerformanceRaw * weights.performanceWeight +
          socialReachRaw * weights.socialWeight +
          engagementRaw * weights.engagementWeight +
          contextRaw * weights.contextWeight
      )
    )
  );

  // Determine Label
  let label: NILScoreResult["label"] = "Emerging";
  if (nilScore > 80) label = "Elite";
  else if (nilScore > 60) label = "Strong";
  else if (nilScore > 40) label = "Established";
  else if (nilScore > 20) label = "Growing";

  // Calculate pricing rates based on bands
  let post: RateRange = { min: 25, target: 50, max: 75 };
  let appearance: RateRange = { min: 100, target: 175, max: 250 };
  let campaign: RateRange = { min: 200, target: 350, max: 500 };

  if (nilScore > 80) {
    post = { min: 2500, target: 6000, max: 10000 };
    appearance = { min: 7500, target: 16000, max: 25000 };
    campaign = { min: 15000, target: 32000, max: 50000 };
  } else if (nilScore > 60) {
    post = { min: 750, target: 1600, max: 2500 };
    appearance = { min: 2000, target: 4750, max: 7500 };
    campaign = { min: 5000, target: 10000, max: 15000 };
  } else if (nilScore > 40) {
    post = { min: 250, target: 500, max: 750 };
    appearance = { min: 750, target: 1350, max: 2000 };
    campaign = { min: 1500, target: 3250, max: 5000 };
  } else if (nilScore > 20) {
    post = { min: 75, target: 160, max: 250 };
    appearance = { min: 250, target: 500, max: 750 };
    campaign = { min: 500, target: 1000, max: 1500 };
  }

  const breakdown = {
    cardPerformance: Math.round(cardPerformanceRaw),
    socialReach: Math.round(socialReachRaw),
    engagement: Math.round(engagementRaw),
    context: Math.round(contextRaw),
  };

  return {
    nilScore,
    label,
    breakdown,
    rates: { post, appearance, campaign },
    sportWeights: weights,
    breakdownVisualization: buildBreakdownVisualization(breakdown, nilScore),
    dealScore: computeDealScore(profile),
  };
}

// ---------------------------------------------------------------------------
// Exported helpers for consumers
// ---------------------------------------------------------------------------

/**
 * Build historical tracking data from a list of snapshots.
 * Snapshots should be sorted oldest-first.
 */
export function computeHistoricalTrend(snapshots: ScoreSnapshot[]): HistoricalResult {
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  return { snapshots: sorted, trend: computeTrendLine(sorted) };
}

/**
 * Compare an athlete's score against a list of competitors.
 */
export function compareAthletes(
  athleteScore: number,
  competitors: CompetitorAthlete[]
): ComparisonResult {
  return computeCompetitorComparison(athleteScore, competitors);
}

/**
 * Score a NIL deal opportunity based on profile completeness.
 * Accepts the full profile object from Supabase.
 */
export function scoreDealOpportunity(
  profile: NILProfile & Record<string, any>
): DealScore {
  return computeDealScore(profile);
}

/**
 * Get sport-specific weights for a given sport name.
 */
export function getSportWeights(sport: string | null): SportWeights {
  return SPORT_WEIGHTS[classifySport(sport)];
}

/**
 * All sport categories available for scoring.
 */
export const SPORT_CATEGORIES = Object.entries(SPORT_WEIGHTS).map(
  ([, v]) => v
);
