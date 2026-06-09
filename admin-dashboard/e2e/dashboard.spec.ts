import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('dashboard loads with stat cards', async ({ page }) => {
    await expect(page.locator('[data-testid="stat-card-captures"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-card-shares"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-card-devices"]')).toBeVisible();
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.click('[data-testid="nav-events"]');
    await expect(page).toHaveURL('/events');
  });
});
