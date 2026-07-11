export type StatTemplate = {
  label: string;
  placeholder: string;
  example: string;
};

export const SPORT_STAT_TEMPLATES: Record<string, StatTemplate[]> = {
  Basketball: [
    { label: "PPG", placeholder: "Points per game", example: "24.5" },
    { label: "RPG", placeholder: "Rebounds per game", example: "8.2" },
    { label: "APG", placeholder: "Assists per game", example: "5.1" },
    { label: "FG%", placeholder: "Field goal percentage", example: "48.3%" },
    { label: "3PT%", placeholder: "Three-point percentage", example: "38.7%" },
    { label: "FT%", placeholder: "Free throw percentage", example: "85.2%" },
    { label: "SPG", placeholder: "Steals per game", example: "1.8" },
    { label: "BPG", placeholder: "Blocks per game", example: "1.2" },
    { label: "MIN", placeholder: "Minutes per game", example: "32.4" },
    { label: "Height", placeholder: "Player height", example: "6'7\"" },
  ],
  Football: [
    { label: "40-yard", placeholder: "40-yard dash time", example: "4.42s" },
    { label: "Pass Yards", placeholder: "Passing yards", example: "3,245" },
    { label: "Pass TD", placeholder: "Passing touchdowns", example: "28" },
    { label: "Rush Yards", placeholder: "Rushing yards", example: "1,120" },
    { label: "Rush TD", placeholder: "Rushing touchdowns", example: "12" },
    { label: "Rec Yards", placeholder: "Receiving yards", example: "890" },
    { label: "Rec TD", placeholder: "Receiving touchdowns", example: "7" },
    { label: "Tackles", placeholder: "Total tackles", example: "95" },
    { label: "Sacks", placeholder: "Sacks", example: "8.5" },
    { label: "Interceptions", placeholder: "Interceptions", example: "4" },
    { label: "Bench", placeholder: "Bench press max", example: "315 lbs" },
    { label: "Squat", placeholder: "Squat max", example: "425 lbs" },
    { label: "Vertical", placeholder: "Vertical jump", example: "36\"" },
  ],
  Soccer: [
    { label: "Goals", placeholder: "Goals scored", example: "18" },
    { label: "Assists", placeholder: "Assists", example: "12" },
    { label: "Apps", placeholder: "Appearances", example: "24" },
    { label: "MOTM", placeholder: "Man of the Match awards", example: "6" },
    { label: "Pass%", placeholder: "Pass completion rate", example: "87.3%" },
    { label: "Shots/90", placeholder: "Shots per 90 minutes", example: "3.2" },
    { label: "Tackles/90", placeholder: "Tackles per 90 minutes", example: "2.8" },
    { label: "Distance/90", placeholder: "Distance covered per 90 (km)", example: "11.4" },
    { label: "Sprint Speed", placeholder: "Top sprint speed", example: "34.2 km/h" },
    { label: "Clean Sheets", placeholder: "Clean sheets (GK/DEF)", example: "10" },
  ],
  Baseball: [
    { label: "AVG", placeholder: "Batting average", example: ".342" },
    { label: "HR", placeholder: "Home runs", example: "15" },
    { label: "RBI", placeholder: "Runs batted in", example: "52" },
    { label: "OPS", placeholder: "On-base plus slugging", example: "1.024" },
    { label: "ERA", placeholder: "Earned run average", example: "2.45" },
    { label: "K/9", placeholder: "Strikeouts per 9 innings", example: "10.2" },
    { label: "WHIP", placeholder: "Walks+Hits per inning pitched", example: "1.05" },
    { label: "SB", placeholder: "Stolen bases", example: "22" },
    { label: "OBP", placeholder: "On-base percentage", example: ".415" },
    { label: "SLG", placeholder: "Slugging percentage", example: ".609" },
  ],
  Tennis: [
    { label: "Ranking", placeholder: "Singles ranking", example: "#125" },
    { label: "Win-Loss", placeholder: "Win-loss record", example: "32-14" },
    { label: "Aces", placeholder: "Aces (season)", example: "245" },
    { label: "1st Serve%", placeholder: "First serve percentage", example: "64.8%" },
    { label: "Break Points", placeholder: "Break points saved", example: "78%" },
    { label: "Titles", placeholder: "Titles (career/season)", example: "3" },
    { label: "Prize Money", placeholder: "Prize money earned", example: "$85,000" },
    { label: "Max Serve", placeholder: "Max serve speed", example: "135 mph" },
  ],
  Swimming: [
    { label: "100 Free", placeholder: "100m freestyle time", example: "48.23" },
    { label: "200 IM", placeholder: "200m individual medley time", example: "1:58.45" },
    { label: "Best Time", placeholder: "Personal best event + time", example: "200 Free 1:42.8" },
    { label: "State Rank", placeholder: "State ranking", example: "#3" },
    { label: "NCAA Qual", placeholder: "NCAA qualifying cuts", example: "3 events" },
    { label: "Relay Legs", placeholder: "Relay legs swum", example: "4" },
  ],
  Track: [
    { label: "100m", placeholder: "100m dash time", example: "10.42" },
    { label: "200m", placeholder: "200m dash time", example: "21.15" },
    { label: "400m", placeholder: "400m time", example: "48.32" },
    { label: "800m", placeholder: "800m time", example: "1:52.4" },
    { label: "Mile", placeholder: "Mile time", example: "4:12.8" },
    { label: "Long Jump", placeholder: "Long jump distance", example: "22'4\"" },
    { label: "High Jump", placeholder: "High jump height", example: "6'8\"" },
    { label: "Shot Put", placeholder: "Shot put distance", example: "52'6\"" },
    { label: "Discus", placeholder: "Discus throw distance", example: "165'2\"" },
    { label: "State Rank", placeholder: "State ranking", example: "#2 100m" },
  ],
  Volleyball: [
    { label: "Kills", placeholder: "Kills (season)", example: "320" },
    { label: "Assists", placeholder: "Assists (season)", example: "45" },
    { label: "Digs", placeholder: "Digs (season)", example: "180" },
    { label: "Blocks", placeholder: "Solo blocks (season)", example: "52" },
    { label: "Aces", placeholder: "Service aces (season)", example: "38" },
    { label: "Hitting%", placeholder: "Hitting percentage", example: ".312" },
    { label: "Kills/Set", placeholder: "Kills per set", example: "4.2" },
    { label: "Height", placeholder: "Player height / reach", example: "6'2\" / 10'4\"" },
  ],
  Wrestling: [
    { label: "Record", placeholder: "Win-loss record", example: "35-5" },
    { label: "Pins", placeholder: "Pins (season)", example: "18" },
    { label: "State Place", placeholder: "State tournament placing", example: "3rd" },
    { label: "Weight", placeholder: "Weight class", example: "145 lbs" },
    { label: "Takedowns", placeholder: "Takedowns (season)", example: "95" },
    { label: "Region Rank", placeholder: "Regional ranking", example: "#2" },
  ],
  Golf: [
    { label: "Avg Score", placeholder: "Average round score", example: "72.4" },
    { label: "Low Round", placeholder: "Lowest round", example: "65" },
    { label: "Wins", placeholder: "Tournament wins", example: "4" },
    { label: "Top 5", placeholder: "Top-5 finishes", example: "8" },
    { label: "Avg Putts", placeholder: "Average putts per round", example: "28.2" },
    { label: "Driving Dist", placeholder: "Average driving distance", example: "285 yds" },
    { label: "GIR%", placeholder: "Greens in regulation %", example: "68.4%" },
    { label: "Handicap", placeholder: "Golf handicap", example: "+2.3" },
  ],
  Lacrosse: [
    { label: "Goals", placeholder: "Goals (season)", example: "42" },
    { label: "Assists", placeholder: "Assists (season)", example: "28" },
    { label: "Points", placeholder: "Total points", example: "70" },
    { label: "GB", placeholder: "Ground balls", example: "85" },
    { label: "Caused TO", placeholder: "Caused turnovers", example: "22" },
    { label: "Save%", placeholder: "Save percentage (GK)", example: "62.4%" },
  ],
};

export const SPORT_NAMES = Object.keys(SPORT_STAT_TEMPLATES);

export function getStatTemplatesForSport(sport: string): StatTemplate[] | null {
  const normalized = sport.trim();
  return SPORT_STAT_TEMPLATES[normalized] || null;
}
