import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('successful login flow', async ({ page }) => {
    // Fill in login form
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('text=Welcome back, testuser')).toBeVisible();
  });

  test('failed login with invalid credentials', async ({ page }) => {
    // Fill in login form with invalid credentials
    await page.fill('[data-testid="username-input"]', 'wronguser');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Verify error message is shown
    await expect(page.locator('text=Invalid credentials')).toBeVisible();

    // Verify user stays on login page
    await expect(page).toHaveURL('/login');
  });

  test('form validation for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="login-button"]');

    // Verify validation errors
    await expect(page.locator('text=Username is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('[data-testid="password-input"]');
    const toggleButton = page.locator('[data-testid="password-toggle"]');

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('remember me functionality', async ({ page }) => {
    // Fill in login form
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Check remember me
    await page.check('[data-testid="remember-me"]');

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Wait for redirect
    await page.waitForURL('/dashboard');

    // Verify token is stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  test('logout functionality', async ({ page }) => {
    // First login
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await page.waitForURL('/dashboard');

    // Open user menu and logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Verify redirect to login page
    await page.waitForURL('/login');

    // Verify token is removed from localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('session persistence across page reloads', async ({ page }) => {
    // Login
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await page.waitForURL('/dashboard');

    // Reload page
    await page.reload();

    // Verify user is still logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });

  test('automatic redirect to login when not authenticated', async ({
    page,
  }) => {
    // Try to access protected route without authentication
    await page.goto('/employees');

    // Should be redirected to login
    await page.waitForURL('/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('keyboard navigation accessibility', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="username-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="remember-me"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="login-button"]')).toBeFocused();

    // Submit form with Enter key
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.keyboard.press('Enter');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test('responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify login form is properly displayed on mobile
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="username-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();

    // Verify form is usable on mobile
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/dashboard');
  });
});
