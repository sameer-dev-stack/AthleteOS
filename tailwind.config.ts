import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0A0A0B",
          elev: "#101012",
          card: "#121216",
        },
        line: "#1C1C22",
        ink: {
          DEFAULT: "#F5F5F7",
          muted: "#9A9AA3",
          dim: "#6B6B74",
        },
        accent: {
          DEFAULT: "#C6FF3D",
          soft: "#E4FF8A",
          deep: "#9BD400",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(3rem, 8vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(2.25rem, 5vw, 4rem)", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(1.75rem, 3.5vw, 2.75rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse at top, rgba(198,255,61,0.08), transparent 60%)",
        "noise":
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.4'/></svg>\")",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "shine": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "orb-1": {
          "0%, 100%": { transform: "translate(-50%, 0) scale(1)" },
          "50%": { transform: "translate(-48%, 30px) scale(1.06)" },
        },
        "orb-2": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(40px, -30px) scale(1.1)" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "marquee": "marquee 40s linear infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        "shine": "shine 6s linear infinite",
        "orb-1": "orb-1 18s ease-in-out infinite",
        "orb-2": "orb-2 22s ease-in-out infinite",
        "float-y": "float-y 5s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
