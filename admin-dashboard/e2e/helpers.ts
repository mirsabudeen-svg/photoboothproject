import type { Page } from '@playwright/test';

export const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export async function gotoApp(page: Page) {
  if (hasSupabase) {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'dev@photobooth.local');
    await page.fill('[data-testid="password"]', 'devpassword1');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL('/');
  } else {
    await page.goto('/');
  }
}
