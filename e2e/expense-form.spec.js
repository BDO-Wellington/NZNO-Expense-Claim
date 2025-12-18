import { test, expect } from '@playwright/test';

/**
 * Functional Tests for NZNO Expense Claim Form
 *
 * These tests verify the core functionality of the expense claim form
 * including form submission, validation, and user interactions.
 */

test.describe('Expense Claim Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for JavaScript to initialize the form
    await page.waitForFunction(() => {
      const tbody = document.querySelector('#StandardExpensesTable tbody');
      return tbody && tbody.children.length > 0;
    });
  });

  test('should display the expense claim form with title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Expense Claim Submission');
    await expect(page.locator('form#expenseForm')).toBeVisible();
  });

  test('should have required personal information fields', async ({ page }) => {
    // Name field
    const nameField = page.locator('#fullName');
    await expect(nameField).toBeVisible();
    await expect(nameField).toBeEditable();

    // Employee ID field
    const empIdField = page.locator('#employeeId');
    await expect(empIdField).toBeVisible();
    await expect(empIdField).toBeEditable();

    // Date field - should default to today
    const dateField = page.locator('#expenseDate');
    await expect(dateField).toBeVisible();
    await expect(dateField).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('should display all standard expense types', async ({ page }) => {
    const expenseTypes = [
      'Flights',
      'Rental Car',
      'Fares - Bus/Rail',
      'Taxi/Uber',
      'Parking',
      'Accommodation',
      'Meals',
    ];

    for (const expenseType of expenseTypes) {
      const cell = page.locator(`#StandardExpensesTable td:has-text("${expenseType}")`);
      await expect(cell).toBeVisible();
    }
  });

  test('should allow entering expense amounts', async ({ page }) => {
    // Find the Flights amount input
    const flightsAmount = page.locator('input[name="flightsAmount"]');
    await expect(flightsAmount).toBeVisible();

    // Enter an amount
    await flightsAmount.fill('250.50');
    await expect(flightsAmount).toHaveValue('250.50');
  });

  test('should calculate private vehicle reimbursement', async ({ page }) => {
    const kmsInput = page.locator('#kms');
    const rateInput = page.locator('#rate');
    const amountInput = page.locator('#vehicleAmount');

    // Verify rate is set to $1.04
    await expect(rateInput).toHaveValue('1.04');

    // Enter kilometres
    await kmsInput.fill('50');
    await kmsInput.blur();

    // Amount should be 50 * 1.04 = 52.00
    await expect(amountInput).toHaveValue('52.00');
  });

  test('should allow adding other expenses', async ({ page }) => {
    const addButton = page.getByRole('button', { name: 'Add Other Expense' });
    const tbody = page.locator('#otherExpensesBody');

    // Get initial count
    const initialCount = await tbody.locator('tr').count();

    // Add a new row
    await addButton.click();

    // Verify row was added
    await expect(tbody.locator('tr')).toHaveCount(initialCount + 1);

    // Fill in the new row
    const newRow = tbody.locator('tr').last();
    await newRow.locator('input[type="text"]').fill('Conference registration');
    await newRow.locator('input[type="number"]').fill('150.00');
  });

  test('should validate required fields on submit', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: 'Submit Claim' });

    // Try to submit without filling required fields
    await submitButton.click();

    // The form should show validation or the native browser validation should trigger
    // Check that we're still on the same page (form wasn't submitted)
    await expect(page.locator('form#expenseForm')).toBeVisible();
  });

  test('should accept file attachments', async ({ page }) => {
    const fileInputs = page.locator('#StandardExpensesTable input[type="file"]');
    const count = await fileInputs.count();

    // Should have 7 file inputs for standard expenses
    expect(count).toBe(7);

    // Each should accept multiple files
    for (let i = 0; i < count; i++) {
      await expect(fileInputs.nth(i)).toHaveAttribute('multiple', '');
    }
  });
});

test.describe('Form Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      const tbody = document.querySelector('#StandardExpensesTable tbody');
      return tbody && tbody.children.length > 0;
    });
  });

  test('all form inputs have accessible labels', async ({ page }) => {
    // Check that amount inputs have aria-labels
    const amountInputs = page.locator('#StandardExpensesTable input[type="number"]');
    const count = await amountInputs.count();

    for (let i = 0; i < count; i++) {
      const ariaLabel = await amountInputs.nth(i).getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('amount');
    }
  });

  test('form can be navigated with keyboard', async ({ page }) => {
    // Focus the name field
    await page.locator('#fullName').focus();

    // Tab to employee ID
    await page.keyboard.press('Tab');
    await expect(page.locator('#employeeId')).toBeFocused();

    // Tab to date field
    await page.keyboard.press('Tab');
    await expect(page.locator('#expenseDate')).toBeFocused();
  });
});
