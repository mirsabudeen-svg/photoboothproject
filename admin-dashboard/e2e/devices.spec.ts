import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

test('pairing QR renders with pairing code', async ({ page }) => {
  await gotoApp(page);
  await page.goto('/devices/pair');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('[data-testid="pairing-code"]')).toBeVisible();
});
