import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {

  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AA Factory/i);
    await expect(page.getByRole('heading', { name: 'Welcome to AAFactory' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Your Avatar' })).toBeVisible();
  });

  test('has navigation header', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header');
    await expect(header).toBeVisible();

    await expect(page.getByRole('button', { name: 'Avatars' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Content Creation' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  });

});
