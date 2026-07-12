import { test } from "@playwright/test";

const BASE = "https://athlete-os-vert.vercel.app";

test("capture final sign-up state after submit", async ({ page }) => {
  const email = `kilo-test-${Date.now()}@example.com`;
  await page.goto(`${BASE}/auth/sign-up`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name="email"]', { timeout: 15000 });

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Password123");
  await page.getByRole("button", { name: /Create free account/i }).click();

  await page.waitForTimeout(8000);

  const overlayVisible = await page
    .locator("text=Processing")
    .first()
    .isVisible()
    .catch(() => false);
  const btnText = await page
    .getByRole("button", { name: /Create free account|Processing/i })
    .first()
    .textContent()
    .catch(() => null);
  const redError = await page
    .locator("p.text-red-400")
    .first()
    .textContent()
    .catch(() => null);
  console.log("FINAL_URL:", page.url());
  console.log("OVERLAY_VISIBLE:", overlayVisible);
  console.log("BUTTON_TEXT:", JSON.stringify(btnText));
  console.log("RED_ERROR:", JSON.stringify(redError));
});
