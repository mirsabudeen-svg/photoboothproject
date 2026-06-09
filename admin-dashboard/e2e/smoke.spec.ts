import { test, expect } from '@playwright/test';

test('dashboard home shows wedding title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Wedding Photobooth Dashboard')).toBeVisible();
});

test('events page route loads', async ({ page }) => {
  await page.goto('/events');
  await expect(page.getByText('Events')).toBeVisible();
});
