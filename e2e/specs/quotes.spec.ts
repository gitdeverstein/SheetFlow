import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from '../fixtures/auth.js';

test.describe('Quote Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('should navigate to quote generator tab', async ({ page }) => {
    // Click on the quotes tab (likely a nav item or button)
    await page
      .getByRole('button', { name: /quotes/i })
      .first()
      .click();
    await expect(page.getByText('Create New Quote')).toBeVisible();
  });

  test('should render the quote form', async ({ page }) => {
    await page
      .getByRole('button', { name: /quotes/i })
      .first()
      .click();

    await expect(page.getByRole('combobox', { name: /client \/ customer/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add item/i })).toBeVisible();
    await expect(page.getByText('Summary')).toBeVisible();
    await expect(page.getByText('Total Quote Value')).toBeVisible();
  });

  test('should select a customer and see options', async ({ page }) => {
    await page
      .getByRole('button', { name: /quotes/i })
      .first()
      .click();

    // Open the customer combobox — the listbox should contain seed data once loaded
    await page.getByRole('combobox', { name: /client \/ customer/i }).click();
    await expect(
      page.getByRole('option').filter({ hasText: /Acme|Dupont|GreenLeaf/ }).first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test('should add and remove line items', async ({ page }) => {
    await page
      .getByRole('button', { name: /quotes/i })
      .first()
      .click();

    // Add first item
    await page.getByRole('button', { name: /add item/i }).first().click();
    await expect(page.getByText('No items added yet')).toBeHidden();

    // Add second item
    await page.getByRole('button', { name: /add item/i }).first().click();

    // Should see two product comboboxes now
    await expect(page.getByRole('combobox', { name: /select product for item/i })).toHaveCount(2);

    // Remove an item — each line has its own remove button
    const removeButtons = page.getByRole('button', { name: /remove item/i });
    await expect(removeButtons).toHaveCount(2);
    await removeButtons.first().click();
    await expect(removeButtons).toHaveCount(1);
  });

  test('should calculate totals when items are added', async ({ page }) => {
    await page
      .getByRole('button', { name: /quotes/i })
      .first()
      .click();

    // Initially shows $0.00 — appears in subtotal, tax, and total
    await expect(page.getByText('$0.00').first()).toBeVisible();

    // Add an item — the summary should now show zero values (no product selected)
    await page.getByRole('button', { name: /add item/i }).first().click();

    // Select the first customer
    await page.getByRole('combobox', { name: /client \/ customer/i }).click();
    await page.getByRole('option').first().click();

    // Select the first product for the line item
    await page.getByRole('combobox', { name: /select product for item 1/i }).click();
    await page.getByRole('option').first().click();

    // The summary should update: a priced product was selected, so the total is no longer $0.00
    await expect(page.getByText(/Total Quote Value/)).toBeVisible();
    await expect(page.getByText('$0.00')).toHaveCount(0);
  });
});
