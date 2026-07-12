import { test } from "@playwright/test";

const BASE = "http://localhost:3000";

test("LOCAL create account navigates to verify-email page", async ({ page }) => {
  const email = `kilo-local-${Date.now()}@example.com`;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(`${BASE}/auth/sign-up`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').waitFor({ state: "visible", timeout: 20000 });

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Password123");
  await page.getByRole("button", { name: /Create free account/i }).click();

  try {
    await page.waitForURL(/\/auth\/account-created/, { timeout: 25000 });
    console.log("NAVIGATED_TO_ACCOUNT_CREATED: true");
    const h1 = await page.locator("h1").first().textContent();
    const body = await page.locator("p").first().textContent().catch(() => null);
    console.log("H1:", JSON.stringify(h1));
    console.log("BODY:", JSON.stringify(body));
  } catch {
    console.log("NAVIGATED_TO_ACCOUNT_CREATED: false");
    console.log("CURRENT_URL:", page.url());
    const red = await page.locator("p.text-red-400").first().textContent().catch(() => null);
    console.log("RED_ERROR:", JSON.stringify(red));
  }
  console.log("PAGE_ERRORS:", JSON.stringify(errors));
});
