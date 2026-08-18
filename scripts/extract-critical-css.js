const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  
  const criticalCSS = await page.evaluate(() => {
    const criticalSelectors = [
      "body", "html", "main", "nav", "header", "h1", "h2", "p", "a", "button",
      ".bg-bg", ".text-ink", ".text-accent", ".btn-primary",
      "[class*='bg-']", "[class*='text-']", "[class*='flex']", "[class*='grid']"
    ];
    
    const elements = [];
    criticalSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el.getBoundingClientRect().bottom > 0 && el.getBoundingClientRect().top < 900) {
          elements.push(el);
        }
      });
    });
    
    const uniqueElements = [...new Set(elements)];
    let css = "";
    uniqueElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      css += `${el.tagName.toLowerCase()} { color: ${styles.color}; background: ${styles.backgroundColor}; font-size: ${styles.fontSize}; font-weight: ${styles.fontWeight}; }\n`;
    });
    
    return css;
  });
  
  fs.writeFileSync("critical.css", criticalCSS);
  console.log("Critical CSS extracted:", criticalCSS.length, "bytes");
  await browser.close();
})();
