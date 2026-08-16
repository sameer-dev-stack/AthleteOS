export type StatSchema = {
  key: string;
  label: string;
  unit: string;
};

export type SportConfig = {
  code: string;
  label: string;
  positions: string[];
  statsSchema: StatSchema[];
  fallbackGradient: string;
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
    statsSchema: [
      { key: "yards", label: "Yards", unit: "yds" },
      { key: "tds", label: "TDs", unit: "" },
      { key: "tackles", label: "Tackles", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #1a3a1a 0%, #0d2818 40%, #0a1a12 100%)",
  },
  BB: {
    code: "BB",
    label: "Basketball",
    positions: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
    statsSchema: [
      { key: "ppg", label: "PPG", unit: "pts" },
      { key: "rpg", label: "RPG", unit: "reb" },
      { key: "apg", label: "APG", unit: "ast" },
    ],
    fallbackGradient: "linear-gradient(160deg, #3a2a0a 0%, #2a1a08 40%, #1a1005 100%)",
  },
  SB: {
    code: "SB",
    label: "Baseball",
    positions: [
      "Pitcher", "Catcher", "First Base", "Second Base",
      "Shortstop", "Third Base", "Left Field", "Center Field", "Right Field",
    ],
    statsSchema: [
      { key: "avg", label: "AVG", unit: "" },
      { key: "hr", label: "HR", unit: "" },
      { key: "rbi", label: "RBI", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #1a2a3a 0%, #0d1a28 40%, #0a1218 100%)",
  },
  SOC: {
    code: "SOC",
    label: "Soccer",
    positions: ["Goalkeeper", "Defender", "Midfielder", "Forward", "Striker", "Wing"],
    statsSchema: [
      { key: "goals", label: "Goals", unit: "" },
      { key: "assists", label: "Assists", unit: "" },
      { key: "apps", label: "Apps", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #0a2a1a 0%, #081a12 40%, #05120a 100%)",
  },
  TN: {
    code: "TN",
    label: "Tennis",
    positions: ["Singles", "Doubles"],
    statsSchema: [
      { key: "ranking", label: "Ranking", unit: "" },
      { key: "win-loss", label: "Win-Loss", unit: "" },
      { key: "aces", label: "Aces", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #2a3a0a 0%, #1a2a08 40%, #121a05 100%)",
  },
  SW: {
    code: "SW",
    label: "Swimming",
    positions: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "IM"],
    statsSchema: [
      { key: "100-free", label: "100 Free", unit: "s" },
      { key: "200-im", label: "200 IM", unit: "s" },
      { key: "best-time", label: "Best Time", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #0a1a3a 0%, #081228 40%, #050a18 100%)",
  },
  TF: {
    code: "TF",
    label: "Track & Field",
    positions: ["Sprints", "Distance", "Hurdles", "Jumps", "Throws", "Multi"],
    statsSchema: [
      { key: "100m", label: "100m", unit: "s" },
      { key: "200m", label: "200m", unit: "s" },
      { key: "state-rank", label: "State Rank", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #2a1a0a 0%, #1a1208 40%, #120a05 100%)",
  },
  VB: {
    code: "VB",
    label: "Volleyball",
    positions: ["Outside Hitter", "Middle Blocker", "Setter", "Libero", "Opposite", "Defensive Specialist"],
    statsSchema: [
      { key: "kills", label: "Kills", unit: "" },
      { key: "assists", label: "Assists", unit: "" },
      { key: "digs", label: "Digs", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #2a0a2a 0%, #1a081a 40%, #120512 100%)",
  },
  WR: {
    code: "WR",
    label: "Wrestling",
    positions: ["Lightweight", "Welterweight", "Middleweight", "Heavyweight"],
    statsSchema: [
      { key: "record", label: "Record", unit: "" },
      { key: "pins", label: "Pins", unit: "" },
      { key: "state-place", label: "State Place", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #3a1a0a 0%, #2a1208 40%, #1a0a05 100%)",
  },
  GL: {
    code: "GL",
    label: "Golf",
    positions: ["Individual"],
    statsSchema: [
      { key: "avg-score", label: "Avg Score", unit: "" },
      { key: "wins", label: "Wins", unit: "" },
      { key: "handicap", label: "Handicap", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #0a3a1a 0%, #082a12 40%, #051a0a 100%)",
  },
  LX: {
    code: "LX",
    label: "Lacrosse",
    positions: ["Attack", "Midfield", "Defense", "Goalie"],
    statsSchema: [
      { key: "goals", label: "Goals", unit: "" },
      { key: "assists", label: "Assists", unit: "" },
      { key: "gb", label: "GB", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #1a3a2a 0%, #0d2a1a 40%, #0a1a12 100%)",
  },
  HK: {
    code: "HK",
    label: "Hockey",
    positions: ["Center", "Left Wing", "Right Wing", "Defense", "Goaltender"],
    statsSchema: [
      { key: "goals", label: "Goals", unit: "" },
      { key: "assists", label: "Assists", unit: "" },
      { key: "points", label: "Points", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #0a2a3a 0%, #081a2a 40%, #05121a 100%)",
  },
  XC: {
    code: "XC",
    label: "Cross Country",
    positions: ["Runner"],
    statsSchema: [
      { key: "5k-time", label: "5K Time", unit: "" },
      { key: "10k-time", label: "10K Time", unit: "" },
      { key: "state-rank", label: "State Rank", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #1a2a1a 0%, #0d1a0d 40%, #0a120a 100%)",
  },
  GYM: {
    code: "GYM",
    label: "Gymnastics",
    positions: ["All-Around", "Vault", "Bars", "Beam", "Floor"],
    statsSchema: [
      { key: "aa-score", label: "AA Score", unit: "" },
      { key: "vt-score", label: "VT Score", unit: "" },
      { key: "fx-score", label: "FX Score", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #2a1a2a 0%, #1a0d1a 40%, #120a12 100%)",
  },
  FH: {
    code: "FH",
    label: "Field Hockey",
    positions: ["Forward", "Midfielder", "Defender", "Goalkeeper"],
    statsSchema: [
      { key: "goals", label: "Goals", unit: "" },
      { key: "assists", label: "Assists", unit: "" },
      { key: "shots", label: "Shots", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #0a2a2a 0%, #081a1a 40%, #051212 100%)",
  },
  SF: {
    code: "SF",
    label: "Softball",
    positions: [
      "Pitcher", "Catcher", "First Base", "Second Base",
      "Shortstop", "Third Base", "Left Field", "Center Field", "Right Field",
    ],
    statsSchema: [
      { key: "avg", label: "AVG", unit: "" },
      { key: "hr", label: "HR", unit: "" },
      { key: "rbi", label: "RBI", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #2a2a0a 0%, #1a1a08 40%, #121205 100%)",
  },
  WP: {
    code: "WP",
    label: "Water Polo",
    positions: ["Center Forward", "Driver", "Wing", "Point", "Goalkeeper"],
    statsSchema: [
      { key: "goals", label: "Goals", unit: "" },
      { key: "assists", label: "Assists", unit: "" },
      { key: "steals", label: "Steals", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #0a1a2a 0%, #081220 40%, #050a18 100%)",
  },
  ROW: {
    code: "ROW",
    label: "Rowing",
    positions: ["Single Sculls", "Double Sculls", "Quad Sculls", "Eight", "Pair", "Four"],
    statsSchema: [
      { key: "500m-time", label: "500m Time", unit: "" },
      { key: "2000m-time", label: "2K Time", unit: "" },
      { key: "wattage", label: "Wattage", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #0a2a0a 0%, #081a08 40%, #051205 100%)",
  },
  RUG: {
    code: "RUG",
    label: "Rugby",
    positions: ["Prop", "Hooker", "Lock", "Flanker", "Number 8", "Scrum Half", "Fly Half", "Wing", "Fullback"],
    statsSchema: [
      { key: "tries", label: "Tries", unit: "" },
      { key: "tackles", label: "Tackles", unit: "" },
      { key: "meters", label: "Meters", unit: "" },
    ],
    fallbackGradient: "linear-gradient(160deg, #1a1a1a 0%, #121212 40%, #0a0a0a 100%)",
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

export function getStatsSchemaForSport(sportName: string | null): StatSchema[] {
  const cfg = resolveSportConfig(sportName);
  return cfg?.statsSchema ?? [];
}

export function getFallbackGradient(sportName: string | null): string {
  const cfg = resolveSportConfig(sportName);
  return cfg?.fallbackGradient ?? "linear-gradient(160deg, #1a1a2a 0%, #0d0d18 40%, #08080f 100%)";
}
