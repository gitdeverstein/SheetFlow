import { type Page } from '@playwright/test';

/** Test user credentials matching the seed data in packages/db/src/seed.ts */
export const TEST_USERS = {
  admin: { email: 'admin@sheetflow.com', password: 'admin123!', name: 'Admin' },
  demo: { email: 'john@sheetflow.com', password: 'demo1234!', name: 'John Doe' },
} as const;

/**
 * Log in with the given credentials.
 * Returns when the dashboard is visible.
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // The WelcomeScreen should show login form
  const emailInput = page.locator('input[type="email"]');
  if (!(await emailInput.isVisible())) {
    // Already authenticated — possibly already on dashboard
    return;
  }

  await emailInput.fill(email);
  await page.locator('input[type="password"]').fill(password);
  // Using form scope to avoid strict mode violation with tab buttons
  await page.locator('form').getByRole('button', { name: /sign in|login|log in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/dashboard/);
  await page.waitForLoadState('networkidle');
}

/**
 * Log out by posting to /api/auth/logout and reloading.
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}
