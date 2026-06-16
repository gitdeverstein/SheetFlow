import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from '../fixtures/auth.js';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  test('should display KPI cards with data', async ({ page }) => {
    await expect(page.getByText('Accepted Revenue')).toBeVisible();
    await expect(page.getByText('Total Customers')).toBeVisible();
    await expect(page.getByText('Catalog Products')).toBeVisible();
    await expect(page.getByText('Stock Alerts')).toBeVisible();
  });

  test('should display quote table', async ({ page }) => {
    await expect(page.getByText('Recent Quotes')).toBeVisible();

    // Seed data should have quotes visible
    const quoteNumbers = page.locator('table tbody tr td:first-child');
    const count = await quoteNumbers.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // First quote should have a quote number like QT-2026-*
    const firstQuote = await quoteNumbers.first().textContent();
    expect(firstQuote).toMatch(/QT-/);
  });

  test('should display stock warning section', async ({ page }) => {
    await expect(page.getByText('Stock Warning')).toBeVisible();

    // Seed data has low-stock items
    const stockItems = page.locator('text=/left/');
    const count = await stockItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display top customers', async ({ page }) => {
    await expect(page.getByText('Top Customers')).toBeVisible();
  });

  test('should display quote breakdown chart', async ({ page }) => {
    await expect(page.getByText('Quote Breakdown')).toBeVisible();
  });

  test('should show PDF and XLS export buttons for each quote', async ({ page }) => {
    await page.waitForSelector('table tbody tr');

    const pdfButtons = page.locator('button:has-text("PDF")');
    const xlsButtons = page.locator('button:has-text("XLS")');

    const pdfCount = await pdfButtons.count();
    const xlsCount = await xlsButtons.count();
    expect(pdfCount).toBeGreaterThanOrEqual(1);
    expect(xlsCount).toBeGreaterThanOrEqual(1);
  });
});
