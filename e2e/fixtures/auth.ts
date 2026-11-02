import { type Page, expect } from '@playwright/test';

/** Test user credentials matching the seed data in packages/db/src/seed.ts */
export const TEST_USERS = {
  admin: { email: 'admin@sheetflow.com', password: 'admin123!', name: 'Admin' },
  demo: { email: 'john@sheetflow.com', password: 'demo1234!', name: 'John Doe' },
} as const;

/**
 * Log in with the given credentials via API directly.
 * Uses a direct API call instead of the UI form for maximum reliability.
 * Returns when the dashboard is visible.
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  // Navigate to the app
  await page.goto('/');
  await page.waitForLoadState('load');

  // Login via API directly (more reliable than UI form interaction)
  const loginResult = await page.evaluate(async ({ email, password }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, error: body.error || 'Login failed', status: res.status };
      }
      const data = await res.json();
      return { ok: true, user: data.user };
    } catch (err) {
      return { ok: false, error: String(err), status: 0 };
    }
  }, { email, password });

  if (!loginResult.ok) {
    console.error('Login API failed:', loginResult);
    throw new Error(`Login failed: ${loginResult.error} (status: ${loginResult.status})`);
  }

  await emailInput.fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page
    .locator('form')
    .getByRole('button', { name: /sign in|login|log in/i })
    .click();

  // Scope to form to avoid ambiguity with tab buttons
  await page.locator('form').getByRole('button', { name: /sign in|login|log in/i }).click();

  // Wait for the dashboard to load
  await page.getByRole('heading', { name: /Real-time KPIs/i }).waitFor({ timeout: 15000 });
}

/**
 * Log out by posting to /api/auth/logout and reloading.
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }));
  await page.goto('/');
  await page.waitForLoadState('load');
}
