import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('displays settings page title', async ({ page }) => {
    const title = page.locator('h1', { hasText: 'Settings' });
    await expect(title).toBeVisible();
  });

  test('displays Redis configuration section', async ({ page }) => {
    const redisSection = page.locator('h2', {
      hasText: 'Redis Configuration',
    });
    await expect(redisSection).toBeVisible();
  });

  test('has Redis endpoint input field', async ({ page }) => {
    const input = page.locator('input#redis-endpoint');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'redis:6379');
  });

  test('shows mock mode message for default endpoint', async ({ page }) => {
    const mockModeMessage = page.locator('text=Mock Mode');
    await expect(mockModeMessage).toBeVisible();
  });

  test('validates invalid Redis endpoint format', async ({ page }) => {
    const input = page.locator('input#redis-endpoint');

    // Clear and enter invalid format
    await input.clear();
    await input.fill('invalid-format');

    // Wait for validation message
    const errorMessage = page.locator('text=Invalid Format');
    await expect(errorMessage).toBeVisible();
  });

  test('shows remote server message for IP endpoint', async ({ page }) => {
    const input = page.locator('input#redis-endpoint');

    // Enter valid IP:port format
    await input.clear();
    await input.fill('192.168.1.100:6379');

    // Check for remote server message
    const remoteMessage = page.locator('text=Remote Server Set');
    await expect(remoteMessage).toBeVisible();
  });

  test('displays environment variables for remote endpoint', async ({
    page,
  }) => {
    const input = page.locator('input#redis-endpoint');

    // Enter valid IP:port format
    await input.clear();
    await input.fill('91.199.227.82:29617');

    // Check that env vars box appears
    const envVarsBox = page.locator('text=REDIS_HOST=91.199.227.82');
    await expect(envVarsBox).toBeVisible();

    const portBox = page.locator('text=REDIS_PORT=29617');
    await expect(portBox).toBeVisible();
  });

  test('save button is disabled for invalid endpoint', async ({ page }) => {
    const input = page.locator('input#redis-endpoint');
    const saveButton = page.locator('button[type="submit"]', {
      hasText: 'Save Redis Configuration',
    });

    // Enter invalid format
    await input.clear();
    await input.fill('invalid');

    // Check button is disabled
    await expect(saveButton).toBeDisabled();
  });

  test('save button is enabled for valid endpoint', async ({ page }) => {
    const saveButton = page.locator('button[type="submit"]', {
      hasText: 'Save Redis Configuration',
    });

    // With default value (redis:6379), button should be enabled
    await expect(saveButton).toBeEnabled();
  });

  test('copy button exists for remote endpoint', async ({ page }) => {
    const input = page.locator('input#redis-endpoint');

    // Enter valid IP:port format
    await input.clear();
    await input.fill('192.168.1.100:6379');

    // Check for copy button
    const copyButton = page.locator('button[title="Copy to clipboard"]');
    await expect(copyButton).toBeVisible();
  });
});
