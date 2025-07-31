import { test, expect } from '@playwright/test';

test.describe('Employee CRUD E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // Navigate to employees page
    await page.click('[data-testid="nav-employees"]');
    await page.waitForURL('/employees');
  });

  test('displays employee list', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1')).toContainText('Employees');

    // Verify employee table is visible
    await expect(page.locator('[data-testid="employee-table"]')).toBeVisible();

    // Verify table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Department")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();

    // Verify at least one employee row exists
    await expect(
      page.locator('[data-testid="employee-row"]').first()
    ).toBeVisible();
  });

  test('creates new employee successfully', async ({ page }) => {
    // Click add employee button
    await page.click('[data-testid="add-employee-button"]');

    // Verify form modal opens
    await expect(
      page.locator('[data-testid="employee-form-modal"]')
    ).toBeVisible();

    // Fill in employee form
    await page.fill('[data-testid="employee-number-input"]', 'EMP999');
    await page.fill('[data-testid="first-name-input"]', 'Test');
    await page.fill('[data-testid="last-name-input"]', 'Employee');
    await page.fill('[data-testid="email-input"]', 'test.employee@example.com');
    await page.fill('[data-testid="phone-input"]', '+1234567890');

    // Select department
    await page.click('[data-testid="department-select"]');
    await page.click('[data-testid="department-option-engineering"]');

    // Select position
    await page.click('[data-testid="position-select"]');
    await page.click('[data-testid="position-option-developer"]');

    // Set hire date
    await page.fill('[data-testid="hire-date-input"]', '2024-01-15');

    // Submit form
    await page.click('[data-testid="save-employee-button"]');

    // Verify success notification
    await expect(
      page.locator('text=Employee created successfully')
    ).toBeVisible();

    // Verify modal closes
    await expect(
      page.locator('[data-testid="employee-form-modal"]')
    ).not.toBeVisible();

    // Verify new employee appears in list
    await expect(page.locator('text=Test Employee')).toBeVisible();
    await expect(page.locator('text=test.employee@example.com')).toBeVisible();
  });

  test('edits existing employee', async ({ page }) => {
    // Click edit button for first employee
    await page
      .click('[data-testid="employee-row"]')
      .first()
      .locator('[data-testid="edit-button"]');

    // Verify form modal opens with existing data
    await expect(
      page.locator('[data-testid="employee-form-modal"]')
    ).toBeVisible();

    // Verify form is pre-filled
    const firstNameInput = page.locator('[data-testid="first-name-input"]');
    await expect(firstNameInput).not.toHaveValue('');

    // Update employee information
    await firstNameInput.clear();
    await firstNameInput.fill('Updated Name');

    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.clear();
    await emailInput.fill('updated.email@example.com');

    // Submit form
    await page.click('[data-testid="save-employee-button"]');

    // Verify success notification
    await expect(
      page.locator('text=Employee updated successfully')
    ).toBeVisible();

    // Verify updated information appears in list
    await expect(page.locator('text=Updated Name')).toBeVisible();
    await expect(page.locator('text=updated.email@example.com')).toBeVisible();
  });

  test('deletes employee with confirmation', async ({ page }) => {
    // Get initial employee count
    const initialCount = await page
      .locator('[data-testid="employee-row"]')
      .count();

    // Click delete button for first employee
    await page
      .click('[data-testid="employee-row"]')
      .first()
      .locator('[data-testid="delete-button"]');

    // Verify confirmation dialog appears
    await expect(
      page.locator('[data-testid="delete-confirmation-dialog"]')
    ).toBeVisible();
    await expect(
      page.locator('text=Are you sure you want to delete this employee?')
    ).toBeVisible();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify success notification
    await expect(
      page.locator('text=Employee deleted successfully')
    ).toBeVisible();

    // Verify employee count decreased
    await expect(page.locator('[data-testid="employee-row"]')).toHaveCount(
      initialCount - 1
    );
  });

  test('cancels employee deletion', async ({ page }) => {
    // Get initial employee count
    const initialCount = await page
      .locator('[data-testid="employee-row"]')
      .count();

    // Click delete button for first employee
    await page
      .click('[data-testid="employee-row"]')
      .first()
      .locator('[data-testid="delete-button"]');

    // Verify confirmation dialog appears
    await expect(
      page.locator('[data-testid="delete-confirmation-dialog"]')
    ).toBeVisible();

    // Cancel deletion
    await page.click('[data-testid="cancel-delete-button"]');

    // Verify dialog closes
    await expect(
      page.locator('[data-testid="delete-confirmation-dialog"]')
    ).not.toBeVisible();

    // Verify employee count unchanged
    await expect(page.locator('[data-testid="employee-row"]')).toHaveCount(
      initialCount
    );
  });

  test('searches employees', async ({ page }) => {
    // Enter search term
    await page.fill('[data-testid="employee-search-input"]', 'John');
    await page.click('[data-testid="search-button"]');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Verify search results contain the search term
    const employeeRows = page.locator('[data-testid="employee-row"]');
    const count = await employeeRows.count();

    for (let i = 0; i < count; i++) {
      const row = employeeRows.nth(i);
      const text = await row.textContent();
      expect(text?.toLowerCase()).toContain('john');
    }
  });

  test('filters employees by department', async ({ page }) => {
    // Open department filter
    await page.click('[data-testid="department-filter"]');

    // Select Engineering department
    await page.click('[data-testid="filter-option-engineering"]');

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Verify all visible employees are from Engineering department
    const employeeRows = page.locator('[data-testid="employee-row"]');
    const count = await employeeRows.count();

    for (let i = 0; i < count; i++) {
      const row = employeeRows.nth(i);
      const departmentCell = row.locator('[data-testid="department-cell"]');
      await expect(departmentCell).toContainText('Engineering');
    }
  });

  test('sorts employees by name', async ({ page }) => {
    // Click on Name column header to sort
    await page.click('th:has-text("Name")');

    // Wait for sort to apply
    await page.waitForTimeout(1000);

    // Get all employee names
    const nameElements = page.locator('[data-testid="employee-name-cell"]');
    const names = await nameElements.allTextContents();

    // Verify names are sorted alphabetically
    const sortedNames = [...names].sort();
    expect(names).toEqual(sortedNames);
  });

  test('paginates through employee list', async ({ page }) => {
    // Verify pagination controls are visible
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();

    // Get current page info
    const currentPageInfo = page.locator('[data-testid="page-info"]');
    await expect(currentPageInfo).toContainText('Page 1');

    // Click next page if available
    const nextButton = page.locator('[data-testid="next-page-button"]');
    if (await nextButton.isEnabled()) {
      await nextButton.click();

      // Verify page changed
      await expect(currentPageInfo).toContainText('Page 2');

      // Verify different employees are shown
      await expect(
        page.locator('[data-testid="employee-row"]').first()
      ).toBeVisible();
    }
  });

  test('validates form fields', async ({ page }) => {
    // Click add employee button
    await page.click('[data-testid="add-employee-button"]');

    // Try to submit empty form
    await page.click('[data-testid="save-employee-button"]');

    // Verify validation errors are shown
    await expect(
      page.locator('text=Employee number is required')
    ).toBeVisible();
    await expect(page.locator('text=First name is required')).toBeVisible();
    await expect(page.locator('text=Last name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();

    // Fill in invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="save-employee-button"]');

    // Verify email validation error
    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  test('handles bulk operations', async ({ page }) => {
    // Select multiple employees
    await page
      .check('[data-testid="employee-row"]')
      .first()
      .locator('[data-testid="select-checkbox"]');
    await page
      .check('[data-testid="employee-row"]')
      .nth(1)
      .locator('[data-testid="select-checkbox"]');

    // Verify bulk actions are enabled
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();

    // Click bulk delete
    await page.click('[data-testid="bulk-delete-button"]');

    // Verify confirmation dialog
    await expect(
      page.locator('[data-testid="bulk-delete-confirmation"]')
    ).toBeVisible();
    await expect(
      page.locator('text=Delete 2 selected employees?')
    ).toBeVisible();

    // Cancel bulk delete
    await page.click('[data-testid="cancel-bulk-delete-button"]');

    // Verify dialog closes
    await expect(
      page.locator('[data-testid="bulk-delete-confirmation"]')
    ).not.toBeVisible();
  });
});
