import { test, expect } from '@playwright/test';
import { TEST_USERS, login, logout } from '../fixtures/auth.js';

test.describe('Authentication', () => {
  test.describe.configure({ mode: 'serial' });

  test('should show login form on first visit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WelcomeScreen should render the login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should log in with valid credentials', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Should be on the dashboard
    await expect(page.locator('h1')).toContainText(/Real-time KPIs|Dashboard/i);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('wrong@email.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('form').getByRole('button', { name: /sign in/i }).click();

    // Should still be on login page with an error message
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByText(/invalid (email|password|credentials)/i)).toBeVisible();
  });

  test('should persist session across page reload', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Reload the page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should still be authenticated on dashboard
    await expect(page.locator('h1')).toContainText(/Real-time KPIs|Dashboard/i);
  });

  test('should log out successfully', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await logout(page);

    // Should show the login form again
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
