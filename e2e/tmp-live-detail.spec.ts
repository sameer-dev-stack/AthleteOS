import { test } from "@playwright/test";

const BASE = "https://athlete-os-vert.vercel.app";

test("capture live create-account detail", async ({ page }) => {
  const email = `kilo-detail-${Date.now()}@example.com`;
  await page.goto(`${BASE}/auth/sign-up`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name="email"]', { timeout: 20000 });

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Password123");
  await page.getByRole("button", { name: /Create free account/i }).click();

  await page.waitForTimeout(12000);

  const overlay = await page.locator("text=Processing").first().isVisible().catch(() => false);
  const btn = await page.getByRole("button", { name: /Create free account|Processing/i }).first().textContent().catch(() => null);
  const redError = await page.locator("p.text-red-400").first().textContent().catch(() => null);
  const anyErr = await page.locator("text=/went wrong|failed|invalid|already|rate limit|confirm|required/i").first().textContent().catch(() => null);
  console.log("FINAL_URL:", page.url());
  console.log("OVERLAY:", overlay);
  console.log("BUTTON:", JSON.stringify(btn));
  console.log("RED_ERROR:", JSON.stringify(redError));
  console.log("ANY_ERR:", JSON.stringify(anyErr));
});
