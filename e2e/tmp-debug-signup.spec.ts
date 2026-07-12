import { test } from "@playwright/test";

test("debug sign-up render", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto("http://localhost:3000/auth/sign-up");
  await page.waitForTimeout(3000);

  const bodyText = await page.locator("body").innerText().catch(() => "<no body>");
  console.log("BODY_TEXT:", JSON.stringify(bodyText.slice(0, 500)));
  console.log("ERRORS:", JSON.stringify(errors.slice(0, 10)));
});
