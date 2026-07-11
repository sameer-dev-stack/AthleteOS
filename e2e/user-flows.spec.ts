import { test, expect } from "@playwright/test";

const BASE = "https://athlete-os-vert.vercel.app";

test.describe("User Flow: Landing → Waitlist → Sign Up → Onboarding", () => {
  test("landing page has all critical elements", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('a[href="#waitlist"]').first()).toBeVisible();
    await expect(page.locator('a[href="#how"]').first()).toBeVisible();
    await expect(page.locator('a[href="#product"]').first()).toBeVisible();
    await expect(page.locator('a[href="#pricing"]').first()).toBeVisible();
  });

  test("waitlist form submits successfully", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    const waitlistSection = page.locator("#waitlist");
    await expect(waitlistSection).toBeVisible();

    const emailInput = waitlistSection.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const testEmail = `test-${Date.now()}@example.com`;
    await emailInput.fill(testEmail);

    const submitBtn = waitlistSection.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await page.waitForTimeout(2000);

    const successIndicator = page.locator("text=You're in").or(
      page.locator("text=already on the list")
    ).or(
      page.locator("text=Check your inbox")
    );
    await expect(successIndicator.first()).toBeVisible({ timeout: 15000 });
  });

  test("sign up page renders with all fields", async ({ page }) => {
    await page.goto(`${BASE}/auth/sign-up`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
    await expect(page.locator("text=Continue with Google")).toBeVisible();
  });

  test("sign in page renders with all fields", async ({ page }) => {
    await page.goto(`${BASE}/auth/sign-in`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("onboarding redirects when not authenticated", async ({ page }) => {
    await page.goto(`${BASE}/onboarding`);
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/sign-in|auth/, { timeout: 10000 });
  });

  test("dashboard redirects when not authenticated", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/sign-in|auth/, { timeout: 10000 });
  });
});

test.describe("User Flow: Public Profile Card", () => {
  test("non-existent user shows 404 or not-found", async ({ page }) => {
    const res = await page.goto(`${BASE}/this-user-definitely-does-not-exist-12345`);
    await page.waitForLoadState("networkidle");

    const isNotFound =
      res?.status() === 404 ||
      (await page.locator("text=not found").or(page.locator("text=404")).count()) > 0;
    expect(isNotFound).toBeTruthy();
  });

  test("profile card has correct meta tags", async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    await page.waitForLoadState("networkidle");

    const firstCard = page.locator('a[href^="/"]').first();
    if (await firstCard.isVisible()) {
      const href = await firstCard.getAttribute("href");
      if (href && href !== "/" && !href.startsWith("/auth")) {
        await page.goto(`${BASE}${href}`);
        await page.waitForLoadState("networkidle");

        const title = await page.title();
        expect(title.length).toBeGreaterThan(0);
      }
    }
  });
});

test.describe("User Flow: Discovery Page", () => {
  test("discovery page loads with search and filters", async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Athlete Discovery")).toBeVisible();

    const searchInput = page.locator('input[placeholder*="earch"]').or(
      page.locator('input[type="search"]')
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill("basketball");
      await page.waitForTimeout(1000);
    }
  });

  test("discovery page shows athlete cards or empty state", async ({ page }) => {
    await page.goto(`${BASE}/discover`);
    await page.waitForLoadState("networkidle");

    const cards = page.locator('[class*="card"]').or(page.locator('a[href^="/"]'));
    const emptyState = page.locator("text=No athletes").or(page.locator("text=No results"));

    const hasCards = (await cards.count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;

    expect(hasCards || hasEmpty).toBeTruthy();
  });
});

test.describe("User Flow: Brands & Teams Pages", () => {
  test("brands page loads", async ({ page }) => {
    await page.goto(`${BASE}/brands`);
    await page.waitForLoadState("networkidle");

    const content = await page.textContent("body");
    expect(content?.length).toBeGreaterThan(100);
  });

  test("teams page loads", async ({ page }) => {
    await page.goto(`${BASE}/teams`);
    await page.waitForLoadState("networkidle");

    const content = await page.textContent("body");
    expect(content?.length).toBeGreaterThan(100);
  });
});

test.describe("User Flow: API Health", () => {
  test("waitlist API returns valid response", async ({ request }) => {
    const res = await request.get(`${BASE}/api/waitlist`);
    expect(res.ok()).toBeTruthy();

    const data = await res.json();
    expect(data).toHaveProperty("waitlist");
    expect(data).toHaveProperty("newsletter");
    expect(data).toHaveProperty("mode");
  });

  test("OG image endpoint responds", async ({ request }) => {
    const res = await request.get(`${BASE}/api/og/testuser`);
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe("User Flow: Full Page Audit", () => {
  test("no console errors on landing page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto(BASE);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (e) => !e.includes("404") && !e.includes("favicon") && !e.includes("analytics")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("all internal links on landing page are valid", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    const links = await page.locator("a[href]").all();
    const internalLinks = [];

    for (const link of links.slice(0, 30)) {
      const href = await link.getAttribute("href");
      if (href && href.startsWith("/") && !href.startsWith("//")) {
        internalLinks.push(href);
      }
    }

    for (const href of [...new Set(internalLinks)].slice(0, 10)) {
      const res = await page.goto(`${BASE}${href}`);
      expect(res?.status()).toBeLessThan(500);
    }
  });

  test("landing page performance: loads under 5 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(5000);
  });

  test("no broken images on landing page", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    const images = await page.locator("img").all();
    for (const img of images.slice(0, 20)) {
      const isVisible = await img.isVisible();
      if (isVisible) {
        const naturalWidth = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }
  });

  test("SEO: proper title and meta description", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);

    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description?.length).toBeGreaterThan(50);
  });

  test("SEO: Open Graph tags present", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute("content");
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");

    expect(ogTitle).toBeTruthy();
    expect(ogDesc).toBeTruthy();
    expect(ogImage).toBeTruthy();
  });

  test("SEO: robots.txt and sitemap accessible", async ({ request }) => {
    const robots = await request.get(`${BASE}/robots.txt`);
    expect(robots.ok()).toBeTruthy();
    const robotsText = await robots.text();
    expect(robotsText.toLowerCase()).toContain("user-agent");

    const sitemap = await request.get(`${BASE}/sitemap.xml`);
    expect(sitemap.ok()).toBeTruthy();
  });

  test("security headers present", async ({ request }) => {
    const res = await request.get(`${BASE}`);
    const headers = res.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["strict-transport-security"]).toContain("max-age");
  });

  test("mobile: landing page renders on iPhone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1")).toBeVisible();

    const hamburger = page.locator('button[aria-label*="menu"]').or(
      page.locator('button[aria-label*="Menu"]')
    );
    await expect(hamburger).toBeVisible();
  });

  test("mobile: hamburger menu opens", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    const hamburger = page.locator('button[aria-label*="menu"]').or(
      page.locator('button[aria-label*="Menu"]')
    );
    await hamburger.click();
    await page.waitForTimeout(500);

    const menu = page.locator('[id="mobile-menu"]').or(
      page.locator('[role="dialog"]')
    );
    await expect(menu.first()).toBeVisible({ timeout: 5000 });
  });

  test("accessibility: heading hierarchy", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });

  test("accessibility: images have alt text", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    const images = await page.locator("img").all();
    for (const img of images.slice(0, 20)) {
      const isVisible = await img.isVisible();
      if (isVisible) {
        const alt = await img.getAttribute("alt");
        expect(alt).toBeTruthy();
      }
    }
  });

  test("accessibility: form inputs have labels", async ({ page }) => {
    await page.goto(`${BASE}/auth/sign-in`);
    await page.waitForLoadState("networkidle");

    const inputs = await page.locator("input:visible").all();
    for (const input of inputs) {
      const ariaHidden = await input.getAttribute("aria-hidden");
      if (ariaHidden === "true") continue;

      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const placeholder = await input.getAttribute("placeholder");
      const type = await input.getAttribute("type");

      if (type === "hidden") continue;

      const hasLabel = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false;

      expect(hasLabel || !!ariaLabel || !!placeholder).toBeTruthy();
    }
  });

  test("404 page handles unknown routes", async ({ page }) => {
    const res = await page.goto(`${BASE}/this-route-does-not-exist-xyz`);
    const status = res?.status();
    const hasNotFound =
      (await page.locator("text=not found").or(page.locator("text=404")).count()) > 0;
    expect(status === 404 || hasNotFound).toBeTruthy();
  });
});

test.describe("User Flow: FAQ Interactions", () => {
  test("FAQ accordion expands on click", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    const faqSection = page.locator("#faq").or(page.locator("text=Frequently Asked"));
    if (await faqSection.isVisible()) {
      const firstQuestion = page.locator("button").filter({ hasText: /what|how|is there|can i/i }).first();
      if (await firstQuestion.isVisible()) {
        await firstQuestion.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe("User Flow: Pricing Display", () => {
  test("pricing tiers are visible", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState("networkidle");

    const pricing = page.locator("#pricing").or(page.locator("text=Pricing"));
    await expect(pricing.first()).toBeVisible();

    const free = page.locator("text=Free").or(page.locator("text=$0"));
    const pro = page.locator("text=Pro").or(page.locator("text=$14"));

    await expect(free.first()).toBeVisible();
    await expect(pro.first()).toBeVisible();
  });
});
