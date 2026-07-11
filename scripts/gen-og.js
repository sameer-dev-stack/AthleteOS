#!/usr/bin/env node
/**
 * Generates static social-share images (Open Graph + Twitter) and the
 * Apple touch icon. Run with `npm run gen:og` whenever the design changes.
 *
 * Renders SVG -> PNG via sharp. Output goes to /public.
 *
 * Why static? Next 14's @vercel/og ImageResponse is broken on Windows
 * (fileURLToPath fails on import.meta.url for bundled CJS modules —
 * see https://github.com/vercel/next.js/issues/64715). Static PNGs
 * work everywhere and don't add serverless render time.
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT = path.join(process.cwd(), "public");
fs.mkdirSync(OUT, { recursive: true });

const ACCENT = "#C6FF3D";
const BG = "#0A0A0B";
const INK = "#F5F5F7";
const INK_MUTED = "#9A9AA3";
const INK_DIM = "#6B6B74";
const CARD = "#121216";

const LOGO_MARK = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 22 L11 9 L16 18 L19 13 L27 22" fill="none" stroke="#0A0A0B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="orb" cx="50%" cy="0%" r="60%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.18"/>
      <stop offset="60%" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cover" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="avatar" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0.1"/>
    </linearGradient>
    <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M 56 0 L 0 0 0 56" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
    <mask id="gridmask">
      <rect width="1200" height="630" fill="url(#orb)"/>
    </mask>
  </defs>

  <rect width="1200" height="630" fill="${BG}"/>
  <rect width="1200" height="630" fill="url(#grid)" mask="url(#gridmask)" opacity="0.7"/>
  <rect width="1400" height="700" x="-100" y="-200" fill="url(#orb)"/>
  <ellipse cx="1100" cy="600" rx="320" ry="240" fill="${ACCENT}" opacity="0.05"/>

  <!-- Top bar -->
  <g transform="translate(80,60)">
    <rect width="56" height="56" rx="12" fill="${ACCENT}" filter="drop-shadow(0 0 16px rgba(198,255,61,0.5))"/>
    <g transform="translate(11,11)">${LOGO_MARK.replace('<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">', '<svg width="34" height="34" viewBox="0 0 32 32">')}</g>
    <text x="74" y="38" font-family="Inter, system-ui, sans-serif" font-size="30" font-weight="700" fill="${INK}">AthleteOS</text>
  </g>

  <!-- Main content -->
  <g transform="translate(80,200)">
    <!-- Pill chip -->
    <g>
      <rect x="0" y="0" width="232" height="34" rx="17" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)"/>
      <circle cx="18" cy="17" r="3" fill="${ACCENT}"/>
      <text x="32" y="22" font-family="Inter, system-ui, sans-serif" font-size="14" fill="${INK_MUTED}">The NIL operating system</text>
    </g>

    <!-- Headline -->
    <text x="0" y="100" font-family="Inter, system-ui, sans-serif" font-size="74" font-weight="700" letter-spacing="-3" fill="${INK}">One card.</text>
    <text x="0" y="180" font-family="Inter, system-ui, sans-serif" font-size="74" font-weight="700" letter-spacing="-3" fill="${ACCENT}">One link.</text>
    <text x="0" y="260" font-family="Inter, system-ui, sans-serif" font-size="74" font-weight="700" letter-spacing="-3" fill="${INK}">Your entire</text>
    <text x="0" y="340" font-family="Inter, system-ui, sans-serif" font-size="74" font-weight="700" letter-spacing="-3" fill="${ACCENT}">NIL business.</text>
  </g>

  <!-- Athlete card mockup -->
  <g transform="translate(760,180)">
    <!-- Card glow -->
    <rect x="-8" y="-8" width="376" height="448" rx="36" fill="${ACCENT}" opacity="0.05" filter="blur(20px)"/>
    <!-- Card body -->
    <rect x="0" y="0" width="360" height="432" rx="28" fill="${CARD}" stroke="rgba(255,255,255,0.08)"/>
    <!-- Cover -->
    <path d="M0 28 Q0 0 28 0 L332 0 Q360 0 360 28 L360 96 L0 96 Z" fill="url(#cover)"/>
    <rect x="0" y="0" width="360" height="96" rx="28" fill="url(#cover)"/>
    <!-- Avatar -->
    <g transform="translate(24,52)">
      <rect x="0" y="0" width="80" height="80" rx="20" fill="url(#avatar)" stroke="${CARD}" stroke-width="4"/>
      <text x="40" y="56" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="700" fill="#0A0A0B">MR</text>
    </g>
    <!-- Name -->
    <text x="120" y="100" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" fill="${INK}">Maya Reyes</text>
    <text x="120" y="124" font-family="Inter, system-ui, sans-serif" font-size="14" fill="${INK_MUTED}">Guard · Stanford</text>
    <!-- Verified -->
    <g transform="translate(305,86)">
      <circle cx="0" cy="0" r="11" fill="${ACCENT}"/>
      <path d="M-4 0 L-1 3 L5 -3" fill="none" stroke="#0A0A0B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <!-- Stats -->
    <g transform="translate(24,168)">
      <rect width="312" height="68" rx="16" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)"/>
      <g transform="translate(52,16)">
        <text x="0" y="22" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" fill="${INK}">18.4</text>
        <text x="0" y="40" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" letter-spacing="1" fill="${INK_DIM}">PPG</text>
      </g>
      <g transform="translate(156,16)">
        <text x="0" y="22" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" fill="${INK}">6.2</text>
        <text x="0" y="40" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" letter-spacing="1" fill="${INK_DIM}">APG</text>
      </g>
      <g transform="translate(260,16)">
        <text x="0" y="22" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" fill="${ACCENT}">142K</text>
        <text x="0" y="40" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" letter-spacing="1" fill="${INK_DIM}">REACH</text>
      </g>
    </g>
    <!-- Deal row -->
    <g transform="translate(24,256)">
      <rect width="312" height="60" rx="14" fill="rgba(198,255,61,0.08)" stroke="rgba(198,255,61,0.3)"/>
      <rect x="12" y="14" width="32" height="32" rx="8" fill="${ACCENT}"/>
      <text x="28" y="36" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="#0A0A0B">$</text>
      <text x="56" y="26" font-family="Inter, system-ui, sans-serif" font-size="11" letter-spacing="1" fill="${INK_DIM}">NEW DEAL</text>
      <text x="56" y="46" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="600" fill="${INK}">Gymshark · $2,400</text>
    </g>
    <!-- Action tiles -->
    <g transform="translate(24,332)">
      <rect width="148" height="50" rx="12" fill="${ACCENT}" opacity="0.08" stroke="${ACCENT}" stroke-opacity="0.3"/>
      <text x="74" y="22" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="600" fill="${INK}">Tip Maya</text>
      <text x="74" y="38" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" fill="${INK_DIM}">From $3</text>
    </g>
  </g>

  <!-- Bottom bar -->
  <g transform="translate(0,560)">
    <text x="80" y="0" font-family="Inter, system-ui, sans-serif" font-size="20" fill="${INK_DIM}">athleteos.app</text>
    <g transform="translate(960,-22)">
      <rect width="160" height="44" rx="22" fill="${ACCENT}"/>
      <text x="32" y="28" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600" fill="#0A0A0B">Join the waitlist</text>
      <text x="138" y="28" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="600" fill="#0A0A0B">→</text>
    </g>
  </g>
</svg>`;
}

function twitterSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <radialGradient id="orb" cx="50%" cy="0%" r="60%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.18"/>
      <stop offset="60%" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="675" fill="${BG}"/>
  <rect width="1200" height="675" fill="url(#orb)"/>

  <g transform="translate(600,180)">
    <g>
      <rect x="-60" y="-60" width="120" height="120" rx="26" fill="${ACCENT}" filter="drop-shadow(0 0 40px rgba(198,255,61,0.6))"/>
      <g transform="translate(-32,-32)">${LOGO_MARK.replace('<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">', '<svg width="64" height="64" viewBox="0 0 32 32">')}</g>
    </g>
    <text x="0" y="120" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" letter-spacing="-1.5" fill="${INK}">AthleteOS</text>
  </g>

  <g transform="translate(600,440)">
    <text x="0" y="-30" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="72" font-weight="700" letter-spacing="-2" fill="${INK}">One card. One link.</text>
    <text x="0" y="56" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="72" font-weight="700" letter-spacing="-2" fill="${ACCENT}">Your entire NIL business.</text>
  </g>

  <g transform="translate(490,580)">
    <rect width="220" height="56" rx="28" fill="${ACCENT}"/>
    <text x="32" y="36" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="600" fill="#0A0A0B">Join the waitlist</text>
    <text x="194" y="36" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="600" fill="#0A0A0B">→</text>
  </g>
</svg>`;
}

function appleIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="36" fill="${ACCENT}"/>
  <g transform="translate(45,45)">${LOGO_MARK.replace('<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">', '<svg width="90" height="90" viewBox="0 0 32 32">')}</g>
</svg>`;
}

async function svgToPng(svg, outPath, width, height) {
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toFile(outPath);
  console.log(`  wrote ${outPath} (${width}x${height})`);
}

(async () => {
  console.log("Generating social images…");
  await svgToPng(ogSvg(), path.join(OUT, "og-image.png"), 1200, 630);
  await svgToPng(twitterSvg(), path.join(OUT, "twitter-image.png"), 1200, 675);
  await svgToPng(appleIconSvg(), path.join(OUT, "apple-icon.png"), 180, 180);
  console.log("Done.");
})();
