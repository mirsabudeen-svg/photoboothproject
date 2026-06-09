import { test, expect } from '@playwright/test';
import { gotoApp, hasSupabase } from './helpers';

test.describe('Authentication', () => {
  test('unauthenticated visit to / redirects to /login when Supabase configured', async ({ page }) => {
    test.skip(!hasSupabase, 'Dev mode allows unauthenticated access');
    await page.context().clearCookies();
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('invalid credentials show error message when Supabase configured', async ({ page }) => {
    test.skip(!hasSupabase, 'Dev mode skips credential validation');
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'wrong@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test('dev mode loads dashboard without login', async ({ page }) => {
    test.skip(hasSupabase, 'Only applies when Supabase is not configured');
    await page.goto('/');
    await expect(page.locator('[data-testid="stat-card-captures"]')).toBeVisible();
  });
});
