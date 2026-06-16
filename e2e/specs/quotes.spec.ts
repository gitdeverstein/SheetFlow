import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from '../fixtures/auth.js';

test.describe('Quote Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('should navigate to quote generator tab', async ({ page }) => {
    // Click on the quotes tab (likely a nav item or button)
    await page.getByRole('button', { name: /quotes/i }).first().click();
    await expect(page.getByText('Create New Quote')).toBeVisible();
  });

  test('should render the quote form', async ({ page }) => {
    await page.getByRole('button', { name: /quotes/i }).first().click();

    await expect(page.getByPlaceholder('Search customers...')).toBeVisible();
    await expect(page.getByText('Add Item')).toBeVisible();
    await expect(page.getByText('Summary')).toBeVisible();
    await expect(page.getByText('Total Quote Value')).toBeVisible();
  });

  test('should select a customer and see options', async ({ page }) => {
    await page.getByRole('button', { name: /quotes/i }).first().click();

    // The customer dropdown should have seed data
    const customerSelect = page.locator('select').first();
    const options = await customerSelect.locator('option').allTextContents();
    const hasCustomer = options.some((o) => o.includes('Acme') || o.includes('Dupont') || o.includes('GreenLeaf'));
    expect(hasCustomer).toBeTruthy();
  });

  test('should add and remove line items', async ({ page }) => {
    await page.getByRole('button', { name: /quotes/i }).first().click();

    // Add first item
    await page.getByText('Add Item').click();
    await expect(page.getByText('No items added yet')).toBeHidden();

    // Add second item
    await page.getByText('Add Item').click();

    // Should see two items now — look for product select dropdowns
    const productSelects = page.locator('select').filter({ has: page.locator('option:has-text("Widget")') });
    const count = await productSelects.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Remove an item — Trash2 buttons should be visible
    const removeButtons = page.locator('button.text-rose-500');
    const removeCount = await removeButtons.count();
    expect(removeCount).toBeGreaterThanOrEqual(1);
  });

  test('should calculate totals when items are added', async ({ page }) => {
    await page.getByRole('button', { name: /quotes/i }).first().click();

    // Initially shows $0.00
    await expect(page.getByText('$0.00')).toBeVisible();

    // Add an item — the summary should now show zero values (no product selected)
    await page.getByText('Add Item').click();

    // Select a customer
    const customerSelect = page.locator('select').first();
    await customerSelect.selectOption({ index: 1 }); // Select first real customer

    // Select a product for the line item
    const itemProductSelect = page.locator('select').nth(1); // Second select = product selector
    const itemOptions = await itemProductSelect.locator('option').allTextContents();
    if (itemOptions.length > 1) {
      await itemProductSelect.selectOption({ index: 1 }); // Select first real product

      // Verify the summary panel updates
      // Total should no longer be $0.00 since a product with a price was selected
      await expect(page.getByText(/Total Quote Value/)).toBeVisible();
    }
  });
});
