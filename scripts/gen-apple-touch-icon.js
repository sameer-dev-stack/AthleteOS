const sharp = require("sharp");
const fs = require("fs");

const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
    <rect width="180" height="180" rx="40" fill="#C6FF3D"/>
    <text x="90" y="118" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="#000000" text-anchor="middle">N</text>
  </svg>`
);

Promise.all([
  sharp(svg).resize(180, 180).png().toFile("public/apple-touch-icon.png"),
  sharp(svg).resize(180, 180).png().toFile("app/apple-touch-icon.png"),
])
  .then(() => console.log("Created apple-touch-icon.png files"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
