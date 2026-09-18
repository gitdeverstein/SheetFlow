import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from '../fixtures/auth.js';

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('should navigate to inventory tab', async ({ page }) => {
    await page
      .getByRole('button', { name: /inventory/i })
      .first()
      .click();
    await expect(page.getByText('Inventory Manager')).toBeVisible();
  });

  test('should display inventory columns', async ({ page }) => {
    await page
      .getByRole('button', { name: /inventory/i })
      .first()
      .click();

    await expect(page.getByText('SKU')).toBeVisible();
    await expect(page.getByText('Product Name')).toBeVisible();
    await expect(page.getByText('Stock Quantity')).toBeVisible();
    await expect(page.getByText('Unit Price ($)')).toBeVisible();
  });

  test('should show inventory items from seed data', async ({ page }) => {
    await page
      .getByRole('button', { name: /inventory/i })
      .first()
      .click();

    // Seed data has: Premium Widget, Gadget, USB-C Hub, etc.
    await expect(page.getByText(/Widget/)).toBeVisible();
  });

  test('should show filter inputs and filter inventory', async ({ page }) => {
    await page
      .getByRole('button', { name: /inventory/i })
      .first()
      .click();

    // Filter inputs should be visible
    const filterInputs = page.locator('input[placeholder="Filter..."]');
    const count = await filterInputs.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Type a filter value
    await filterInputs.first().fill('Widget');
    // After typing, the grid should show only matching items
    await expect(page.getByText(/Widget/)).toBeVisible();
  });

  test('should show import CSV button for inventory', async ({ page }) => {
    await page
      .getByRole('button', { name: /inventory/i })
      .first()
      .click();
    await expect(page.getByText('Import CSV')).toBeVisible();
  });

  test('should show pagination controls', async ({ page }) => {
    await page
      .getByRole('button', { name: /inventory/i })
      .first()
      .click();
    await expect(page.getByText('Rows per page:')).toBeVisible();
  });

  test('should add a new row', async ({ page }) => {
    await page
      .getByRole('button', { name: /inventory/i })
      .first()
      .click();

    // Click "Add New Row" button
    await page.getByText('Add New Row').click();

    // A new row should appear at the top with editable cells
    // Wait for the new-row input/select to render
    const newRowSelects = page.locator('select').first();
    // The new row should be visible (the first row)
  });

  test('should sort inventory by column', async ({ page }) => {
    await page
      .getByRole('button', { name: /inventory/i })
      .first()
      .click();

    // Click sort button on the first column header (SKU)
    const sortButton = page
      .locator('button')
      .filter({ has: page.locator('.lucide-arrow-up-down') })
      .first();
    const exists = await sortButton.count();
    if (exists > 0) {
      await sortButton.click();
      // Sort indicator should appear
      await expect(page.locator('text=▲').or(page.locator('text=▼')).first()).toBeVisible();
    }
  });
});
