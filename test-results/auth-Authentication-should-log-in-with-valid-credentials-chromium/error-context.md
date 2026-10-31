# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> should log in with valid credentials
- Location: e2e/specs/auth.spec.ts:16:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.waitFor: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('heading', { name: /Real-time KPIs/i }) to be visible

```

# Page snapshot

```yaml
- generic [ref=e7]:
  - button "Switch to light mode" [ref=e9] [cursor=pointer]:
    - img [ref=e10]
  - generic [ref=e16]:
    - generic [ref=e17]: SF
    - generic [ref=e18]: SheetFlow
    - paragraph [ref=e19]: Streamline your workflow
  - generic [ref=e20]:
    - button "Sign in" [ref=e21]
    - button "Sign up" [ref=e22]
  - generic [ref=e23]:
    - generic [ref=e24]:
      - generic [ref=e25]:
        - text: Email
        - textbox "you@example.com" [ref=e26]: admin@sheetflow.com
      - generic [ref=e27]:
        - text: Password
        - generic [ref=e28]:
          - textbox "••••••••" [ref=e29]: admin123!
          - button "Show password" [ref=e30]:
            - img [ref=e31]
      - paragraph [ref=e34]: Authentication failed
      - button "Sign in" [ref=e35]
    - generic [ref=e40]: or continue with
    - link "Google" [ref=e41] [cursor=pointer]:
      - /url: /api/auth/google
      - img [ref=e42]
      - text: Google
```

# Test source

```ts
  1  | import { type Page, expect } from '@playwright/test';
  2  |
  3  | /** Test user credentials matching the seed data in packages/db/src/seed.ts */
  4  | export const TEST_USERS = {
  5  |   admin: { email: 'admin@sheetflow.com', password: 'admin123!', name: 'Admin' },
  6  |   demo: { email: 'john@sheetflow.com', password: 'demo1234!', name: 'John Doe' },
  7  | } as const;
  8  |
  9  | /**
  10 |  * Log in with the given credentials.
  11 |  * Returns when the dashboard is visible.
  12 |  */
  13 | export async function login(page: Page, email: string, password: string): Promise<void> {
  14 |   await page.goto('/');
  15 |   await page.waitForLoadState('networkidle');
  16 |
  17 |   // The WelcomeScreen should show login form
  18 |   const emailInput = page.locator('input[type="email"]');
  19 |   if (!(await emailInput.isVisible())) {
  20 |     // Already authenticated — possibly already on dashboard
  21 |     return;
  22 |   }
  23 |
  24 |   await emailInput.fill(email);
  25 |   await page.locator('input[type="password"]').fill(password);
  26 |   // Scope to form to avoid strict mode violation with the Sign in tab button
  27 |   await page.locator('form').getByRole('button', { name: /sign in|login|log in/i }).click();
  28 |
  29 |   // Wait for dashboard to load
> 30 |   await page.getByRole("heading", { name: /Real-time KPIs/i }).waitFor();
     |                                                                ^ Error: locator.waitFor: Test timeout of 30000ms exceeded.
  31 | }
  32 |
  33 | /**
  34 |  * Log out by posting to /api/auth/logout and reloading.
  35 |  */
  36 | export async function logout(page: Page): Promise<void> {
  37 |   await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }));
  38 |   await page.goto('/');
  39 |   await page.waitForLoadState('networkidle');
  40 | }
  41 |
```