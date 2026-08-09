export type SportConfig = {
  code: string;
  label: string;
  positions: string[];
  defaultStats: { label: string }[];
};

export const SPORT_CONFIG: Record<string, SportConfig> = {
  FB: {
    code: "FB",
    label: "Football",
    positions: [
      "Quarterback", "Running Back", "Wide Receiver", "Tight End",
      "Offensive Line", "Defensive Line", "Linebacker", "Cornerback",
      "Safety", "Kicker", "Punter", "Return Specialist",
    ],
    defaultStats: [{ label: "Yards" }, { label: "TDs" }, { label: "Tackles" }],
  },
  BB: {
    code: "BB",
    label: "Basketball",
    positions: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
    defaultStats: [{ label: "PPG" }, { label: "RPG" }, { label: "APG" }],
  },
  SB: {
    code: "SB",
    label: "Baseball",
    positions: [
      "Pitcher", "Catcher", "First Base", "Second Base",
      "Shortstop", "Third Base", "Left Field", "Center Field", "Right Field",
    ],
    defaultStats: [{ label: "AVG" }, { label: "HR" }, { label: "RBI" }],
  },
  SOC: {
    code: "SOC",
    label: "Soccer",
    positions: ["Goalkeeper", "Defender", "Midfielder", "Forward", "Striker", "Wing"],
    defaultStats: [{ label: "Goals" }, { label: "Assists" }, { label: "Apps" }],
  },
  TN: {
    code: "TN",
    label: "Tennis",
    positions: ["Singles", "Doubles"],
    defaultStats: [{ label: "Ranking" }, { label: "Win-Loss" }, { label: "Aces" }],
  },
  SW: {
    code: "SW",
    label: "Swimming",
    positions: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "IM"],
    defaultStats: [{ label: "100 Free" }, { label: "200 IM" }, { label: "Best Time" }],
  },
  TF: {
    code: "TF",
    label: "Track & Field",
    positions: ["Sprints", "Distance", "Hurdles", "Jumps", "Throws", "Multi"],
    defaultStats: [{ label: "100m" }, { label: "200m" }, { label: "State Rank" }],
  },
  VB: {
    code: "VB",
    label: "Volleyball",
    positions: ["Outside Hitter", "Middle Blocker", "Setter", "Libero", "Opposite", " Defensive Specialist"],
    defaultStats: [{ label: "Kills" }, { label: "Assists" }, { label: "Digs" }],
  },
  WR: {
    code: "WR",
    label: "Wrestling",
    positions: ["Lightweight", "Welterweight", "Middleweight", "Heavyweight"],
    defaultStats: [{ label: "Record" }, { label: "Pins" }, { label: "State Place" }],
  },
  GL: {
    code: "GL",
    label: "Golf",
    positions: ["Individual"],
    defaultStats: [{ label: "Avg Score" }, { label: "Wins" }, { label: "Handicap" }],
  },
  LX: {
    code: "LX",
    label: "Lacrosse",
    positions: ["Attack", "Midfield", "Defense", "Goalie"],
    defaultStats: [{ label: "Goals" }, { label: "Assists" }, { label: "GB" }],
  },
  HK: {
    code: "HK",
    label: "Hockey",
    positions: ["Center", "Left Wing", "Right Wing", "Defense", "Goaltender"],
    defaultStats: [{ label: "Goals" }, { label: "Assists" }, { label: "Points" }],
  },
};

const LABEL_TO_CODE: Record<string, string> = {};
for (const [code, cfg] of Object.entries(SPORT_CONFIG)) {
  LABEL_TO_CODE[cfg.label.toLowerCase()] = code;
}

export function resolveSportConfig(sportName: string | null): SportConfig | null {
  if (!sportName) return null;
  const code = LABEL_TO_CODE[sportName.trim().toLowerCase()];
  return code ? SPORT_CONFIG[code] ?? null : null;
}

export function isValidPosition(sport: string | null, position: string | null): boolean {
  if (!sport || !position) return true;
  const cfg = resolveSportConfig(sport);
  if (!cfg) return true;
  return cfg.positions.some(
    (p) => p.toLowerCase() === position.trim().toLowerCase(),
  );
}

export function getPositionsForSport(sportName: string | null): string[] {
  const cfg = resolveSportConfig(sportName);
  return cfg?.positions ?? [];
}

export function getDefaultStatsForSport(sportName: string | null): { label: string }[] {
  const cfg = resolveSportConfig(sportName);
  return cfg?.defaultStats ?? [];
}
