export type ThemePreset = {
  id: string;
  name: string;
  isPro: boolean;
  type: "solid" | "metallic" | "neon" | "holographic";
  primaryColor: string; // Used for fallbacks and accent indicators
  backgroundGradient?: string;
  borderGlow?: string;
  badgeStyle?: string;
};

export const STANDARD_THEMES: ThemePreset[] = [
  { id: "#C6FF3D", name: "Electric Lime", isPro: false, type: "solid", primaryColor: "#C6FF3D" },
  { id: "#FF6B6B", name: "Coral Red", isPro: false, type: "solid", primaryColor: "#FF6B6B" },
  { id: "#4ECDC4", name: "Teal Cyan", isPro: false, type: "solid", primaryColor: "#4ECDC4" },
  { id: "#A78BFA", name: "Lavender", isPro: false, type: "solid", primaryColor: "#A78BFA" },
  { id: "#38BDF8", name: "Sky Blue", isPro: false, type: "solid", primaryColor: "#38BDF8" },
  { id: "#FBBF24", name: "Amber Orange", isPro: false, type: "solid", primaryColor: "#FBBF24" },
];

export const PRO_PREMIUM_THEMES: ThemePreset[] = [
  {
    id: "theme-gold-metallic",
    name: "24K Gold Metallic",
    isPro: true,
    type: "metallic",
    primaryColor: "#FFD700",
    backgroundGradient: "linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)",
    borderGlow: "0 0 20px rgba(251, 245, 183, 0.4), 0 0 40px rgba(179, 135, 40, 0.2)",
    badgeStyle: "background: linear-gradient(135deg, #BF953F, #FCF6BA, #AA771C); color: #000;",
  },
  {
    id: "theme-cyber-neon",
    name: "Cyber Neon",
    isPro: true,
    type: "neon",
    primaryColor: "#00F2FE",
    backgroundGradient: "linear-gradient(135deg, #00F2FE 0%, #4FACFE 50%, #00C6FF 100%)",
    borderGlow: "0 0 25px rgba(0, 242, 254, 0.5), 0 0 50px rgba(79, 172, 254, 0.3)",
    badgeStyle: "background: linear-gradient(135deg, #00F2FE, #4FACFE); color: #000;",
  },
  {
    id: "theme-titanium",
    name: "Titanium Platinum",
    isPro: true,
    type: "metallic",
    primaryColor: "#E0E0E0",
    backgroundGradient: "linear-gradient(135deg, #E0E0E0 0%, #FFFFFF 30%, #9E9E9E 70%, #F5F5F5 100%)",
    borderGlow: "0 0 20px rgba(255, 255, 255, 0.4), 0 0 35px rgba(158, 158, 158, 0.2)",
    badgeStyle: "background: linear-gradient(135deg, #FFFFFF, #9E9E9E); color: #000;",
  },
  {
    id: "theme-holographic",
    name: "Holographic Iridescent",
    isPro: true,
    type: "holographic",
    primaryColor: "#FF9A9E",
    backgroundGradient: "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 30%, #A1C4FD 70%, #C2E9FB 100%)",
    borderGlow: "0 0 25px rgba(255, 154, 158, 0.5), 0 0 45px rgba(161, 196, 253, 0.3)",
    badgeStyle: "background: linear-gradient(135deg, #FF9A9E, #A1C4FD); color: #000;",
  },
  {
    id: "theme-rose-gold",
    name: "Rose Gold Shimmer",
    isPro: true,
    type: "metallic",
    primaryColor: "#ECC5C0",
    backgroundGradient: "linear-gradient(135deg, #ECC5C0 0%, #F9D9D6 30%, #E0A96D 70%, #C78B81 100%)",
    borderGlow: "0 0 20px rgba(236, 197, 192, 0.4), 0 0 40px rgba(199, 139, 129, 0.2)",
    badgeStyle: "background: linear-gradient(135deg, #ECC5C0, #E0A96D); color: #000;",
  },
];

export const ALL_THEMES = [...STANDARD_THEMES, ...PRO_PREMIUM_THEMES];

export function resolveTheme(themeId: string | null | undefined): ThemePreset {
  if (!themeId) return STANDARD_THEMES[0];
  const found = ALL_THEMES.find((t) => t.id === themeId);
  if (found) return found;
  // If it's a raw hex color string, return a dynamic solid theme
  if (themeId.startsWith("#")) {
    return {
      id: themeId,
      name: "Custom Accent",
      isPro: false,
      type: "solid",
      primaryColor: themeId,
    };
  }
  return STANDARD_THEMES[0];
}
