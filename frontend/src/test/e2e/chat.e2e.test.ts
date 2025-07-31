import { test, expect } from '@playwright/test';

test.describe('Chat E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // Navigate to chat page
    await page.click('[data-testid="nav-chat"]');
    await page.waitForURL('/chat');
  });

  test('displays chat interface', async ({ page }) => {
    // Verify chat interface elements
    await expect(page.locator('[data-testid="chat-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-main"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
  });

  test('sends and receives messages', async ({ page }) => {
    // Select a conversation or start new one
    await page.locator('[data-testid="conversation-item"]').first().click();

    // Type and send message
    const messageText = 'Hello, this is a test message';
    await page.fill('[data-testid="message-input"]', messageText);
    await page.click('[data-testid="send-button"]');

    // Verify message appears in chat
    await expect(page.locator(`text=${messageText}`)).toBeVisible();

    // Verify message input is cleared
    await expect(page.locator('[data-testid="message-input"]')).toHaveValue('');
  });

  test('starts new conversation', async ({ page }) => {
    // Click new conversation button
    await page.click('[data-testid="new-conversation-button"]');

    // Select user to chat with
    await page.click('[data-testid="user-selector"]');
    await page.locator('[data-testid="user-option"]').first().click();

    // Send first message
    const firstMessage = 'Hi there! Starting a new conversation.';
    await page.fill('[data-testid="message-input"]', firstMessage);
    await page.click('[data-testid="send-button"]');

    // Verify new conversation appears in sidebar
    await expect(
      page.locator('[data-testid="conversation-item"]').first()
    ).toContainText(firstMessage);
  });
});
