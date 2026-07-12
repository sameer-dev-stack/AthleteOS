import { test } from "@playwright/test";

const BASE = "https://athlete-os-vert.vercel.app";

test("observe create-account loading + navigation", async ({ page }) => {
  const email = `kilo-test-${Date.now()}@example.com`;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(`${BASE}/auth/sign-up`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Password123");

  await page.getByRole("button", { name: /Create free account/i }).click();

  const overlayVisible = await page
    .locator("text=Processing")
    .first()
    .isVisible()
    .catch(() => false);
  console.log("OVERLAY_VISIBLE_AFTER_SUBMIT:", overlayVisible);

  try {
    await page.waitForURL(/\/auth\/account-created/, { timeout: 20000 });
    console.log("NAVIGATED_TO_ACCOUNT_CREATED: true");
    const h1 = await page.locator("h1").first().textContent();
    console.log("ACCOUNT_CREATED_H1:", JSON.stringify(h1));
  } catch {
    console.log("NAVIGATED_TO_ACCOUNT_CREATED: false");
    console.log("CURRENT_URL:", page.url());
    const err = await page
      .locator("text=/error|already|valid|required/i")
      .first()
      .textContent()
      .catch(() => null);
    console.log("POSSIBLE_ERROR:", JSON.stringify(err));
  }
  console.log("PAGE_ERRORS:", JSON.stringify(errors.slice(0, 5)));
});
