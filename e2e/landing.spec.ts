import { test, expect } from '@playwright/test';

test('landing page loads and displays hero', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /One card/i, level: 1 })).toBeVisible();
});

test('can navigate to sign in', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});

test('browse athletes works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /discover/i }).click();
  await expect(page).toHaveURL(/\/discover/);
});
