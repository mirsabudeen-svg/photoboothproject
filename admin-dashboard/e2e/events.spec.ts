import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

test.describe('Event creation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
  });

  test('create event — valid payload succeeds', async ({ page }) => {
    await page.goto('/events/new');
    await page.fill('[data-testid="event-name"]', 'Playwright Test Wedding');
    await page.fill(
      '[data-testid="consent-text"]',
      'I consent to my photos being taken at this event for promotional use. Data retained 30 days.',
    );
    await page.click('[data-testid="create-event-submit"]');
    await expect(page).toHaveURL(/\/events/);
    await expect(page.locator('text=Playwright Test Wedding')).toBeVisible();
  });

  test('create event — validation prevents short name', async ({ page }) => {
    await page.goto('/events/new');
    await page.fill('[data-testid="event-name"]', 'AB');
    await page.click('[data-testid="create-event-submit"]');
    await expect(page.locator('[data-testid="error-name"]')).toBeVisible();
    await expect(page).toHaveURL(/\/events\/new/);
  });
});
