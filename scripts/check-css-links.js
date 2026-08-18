const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(".next/static/index.html", "utf8");
const cssLinks = html.match(/<link[^>]*stylesheet[^>]*>/g) || [];

console.log("CSS links found:", cssLinks.length);
cssLinks.forEach((link, i) => console.log(`${i + 1}. ${link}`));
