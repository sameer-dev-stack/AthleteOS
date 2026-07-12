import { test } from "@playwright/test";

const BASE = "http://localhost:3000";

test("diagnose local submit", async ({ page }) => {
  const email = `kilo-diag-${Date.now()}@example.com`;
  const logs: string[] = [];
  const failed: string[] = [];
  page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => logs.push("PAGEERROR: " + e.message));
  page.on("requestfailed", (r) => failed.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText}`));

  await page.goto(`${BASE}/auth/sign-up`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').waitFor({ state: "visible", timeout: 20000 });

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Password123");

  const reqs: string[] = [];
  page.on("request", (r) => { if (r.method() === "POST") reqs.push(r.url()); });

  await page.getByRole("button", { name: /Create free account/i }).click();

  await page.waitForTimeout(4000);
  const overlayMid = await page.locator("text=Processing").first().isVisible().catch(() => false);
  const btnMid = await page.getByRole("button", { name: /Create free account|Processing/i }).first().textContent().catch(() => null);
  console.log("MID overlay:", overlayMid, "btn:", JSON.stringify(btnMid));

  await page.waitForTimeout(18000);
  const overlayEnd = await page.locator("text=Processing").first().isVisible().catch(() => false);
  const btnEnd = await page.getByRole("button", { name: /Create free account|Processing/i }).first().textContent().catch(() => null);
  const red = await page.locator("p.text-red-400").first().textContent().catch(() => null);
  console.log("END url:", page.url());
  console.log("END overlay:", overlayEnd, "btn:", JSON.stringify(btnEnd), "red:", JSON.stringify(red));
  console.log("POST_REQUESTS:", JSON.stringify(reqs));
  console.log("FAILED_REQUESTS:", JSON.stringify(failed.slice(0, 5)));
  console.log("CONSOLE:", JSON.stringify(logs.slice(-15)));
});
