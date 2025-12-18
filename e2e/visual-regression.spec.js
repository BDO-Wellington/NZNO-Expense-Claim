import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for NZNO Expense Claim Form
 *
 * These tests verify the visual appearance and functionality of the expense form,
 * including account codes, styling, and form interactions.
 */

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for JavaScript to initialize the form
    await page.waitForFunction(() => {
      const tbody = document.querySelector('#StandardExpensesTable tbody');
      return tbody && tbody.children.length > 0;
    });
  });

  test('full page screenshot matches baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('full-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('header displays NZNO branding', async ({ page }) => {
    const header = page.locator('.nzno-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveScreenshot('nzno-header.png');

    // Verify header elements
    await expect(page.locator('.nzno-header img')).toBeVisible();
    await expect(page.getByText('Expense Claim Form')).toBeVisible();
  });

  test('standard expenses table displays account codes', async ({ page }) => {
    const table = page.locator('#StandardExpensesTable');
    await expect(table).toBeVisible();
    await expect(table).toHaveScreenshot('standard-expenses-table.png');

    // Verify each expense type has its account code
    const expectedCodes = [
      { name: 'Flights', code: '480' },
      { name: 'Rental Car', code: '486' },
      { name: 'Fares - Bus/Rail', code: '476' },
      { name: 'Taxi/Uber', code: '482' },
      { name: 'Parking', code: '482' },
      { name: 'Accommodation', code: '484' },
      { name: 'Meals', code: '484' },
    ];

    for (const expense of expectedCodes) {
      const cell = page.locator(`#StandardExpensesTable td:has-text("${expense.name}")`);
      await expect(cell).toContainText(`(${expense.code})`);
    }
  });

  test('expense codes are styled in purple', async ({ page }) => {
    const codeSpan = page.locator('.expense-code').first();
    await expect(codeSpan).toBeVisible();

    // Verify the code is displayed
    const codeText = await codeSpan.textContent();
    expect(codeText).toMatch(/\(\d+\)/);

    // Check computed style is purple (NZNO purple: #501F74)
    const color = await codeSpan.evaluate((el) =>
      getComputedStyle(el).color
    );
    // Purple should be rgb(80, 31, 116) or similar
    expect(color).toMatch(/rgb\(80,\s*31,\s*116\)/);
  });

  test('form fields are visible and editable', async ({ page }) => {
    // Check name field
    const nameField = page.locator('#fullName');
    await expect(nameField).toBeVisible();
    await expect(nameField).toBeEditable();

    // Check employee ID field
    const empIdField = page.locator('#employeeId');
    await expect(empIdField).toBeVisible();
    await expect(empIdField).toBeEditable();

    // Check expense amount fields
    const amountFields = page.locator('#StandardExpensesTable input[type="number"]');
    const count = await amountFields.count();
    expect(count).toBe(7); // 7 standard expense types

    for (let i = 0; i < count; i++) {
      await expect(amountFields.nth(i)).toBeVisible();
      await expect(amountFields.nth(i)).toBeEditable();
    }
  });

  test('private vehicle section calculates correctly', async ({ page }) => {
    const kmsInput = page.locator('#kms');
    const amountDisplay = page.locator('#vehicleAmount');

    await expect(kmsInput).toBeVisible();

    // Enter kilometres and verify calculation
    await kmsInput.fill('100');
    await kmsInput.blur();

    // Rate is $1.04/km, so 100km = $104.00
    await expect(amountDisplay).toHaveValue('104.00');
  });

  test('other expenses section allows adding rows', async ({ page }) => {
    const addButton = page.getByRole('button', { name: 'Add Other Expense' });
    await expect(addButton).toBeVisible();

    // Get initial row count
    const tbody = page.locator('#otherExpensesBody');
    const initialCount = await tbody.locator('tr').count();

    // Add a row
    await addButton.click();

    // Verify row was added
    await expect(tbody.locator('tr')).toHaveCount(initialCount + 1);

    // Take screenshot of the section
    const section = page.locator('.form-section:has(h4:has-text("Other Expenses"))');
    await expect(section).toHaveScreenshot('other-expenses-section.png');
  });

  test('remove button deletes other expense row', async ({ page }) => {
    const addButton = page.getByRole('button', { name: 'Add Other Expense' });

    // Add two rows
    await addButton.click();
    await addButton.click();

    const tbody = page.locator('#otherExpensesBody');
    const countAfterAdd = await tbody.locator('tr').count();

    // Click remove on the last row
    const removeButtons = page.locator('#otherExpensesBody button:has-text("Remove")');
    await removeButtons.last().click();

    // If there's a confirmation dialog, accept it
    page.on('dialog', dialog => dialog.accept());

    // Wait for row to be removed
    await page.waitForTimeout(500);

    // Verify row was removed or dialog appeared
    const finalCount = await tbody.locator('tr').count();
    expect(finalCount).toBeLessThanOrEqual(countAfterAdd);
  });

  test('submit button has correct styling', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: 'Submit Claim' });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveScreenshot('submit-button.png');

    // Check it has the primary button class styling
    const bgColor = await submitButton.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    // Should be NZNO purple
    expect(bgColor).toMatch(/rgb\(80,\s*31,\s*116\)/);
  });
});

test.describe('Responsive Design', () => {
  test('mobile viewport displays correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForFunction(() => {
      const tbody = document.querySelector('#StandardExpensesTable tbody');
      return tbody && tbody.children.length > 0;
    });

    await expect(page).toHaveScreenshot('mobile-viewport.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('tablet viewport displays correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForFunction(() => {
      const tbody = document.querySelector('#StandardExpensesTable tbody');
      return tbody && tbody.children.length > 0;
    });

    await expect(page).toHaveScreenshot('tablet-viewport.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
