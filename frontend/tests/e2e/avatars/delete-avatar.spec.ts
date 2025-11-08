import { test, expect } from '@playwright/test';
import {
  createAvatar,
  clearCollection,
  closeDatabaseConnection,
} from '../helpers/db-helpers';
import path from 'path';
test.describe('Delete Avatar', () => {
  // Clear avatars collection before each test
  test.beforeEach(async () => {
    await clearCollection('avatars');
  });

  // Close database connection after all tests
  test.afterAll(async () => {
    await closeDatabaseConnection();
  });

  test('create avatar then delete in edit screen', async ({ page }) => {
    // Navigate to the avatar creation page
    await page.goto('/avatar/create');

    // Fill in the avatar name
    await page.getByLabel('Name').fill('Avatar to Delete');

    // Optional: Upload an image if the form supports it
    const fileInput = page.locator('input[name="image"]');
    //set input file path public/placeholder-avatar.png
    const filePath = path.resolve(
      __dirname,
      '../../files/images/image_1.jpeg'
    );
    await fileInput.setInputFiles(filePath);

    // Submit the form
    await page.getByRole('button', { name: /create avatar/i }).click();

    // Wait for navigation to avatars page
    await page.waitForURL('/avatars');

    // Verify the avatar was created
    await expect(page.getByText('Avatar to Delete')).toBeVisible();

    // Click on the avatar card to open it (or find delete button)
    await page.getByRole('link', { name: 'Edit Avatar' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Avatar' })).toBeVisible();


    // // Click delete button (adjust selector based on your UI)
    await page.getByRole('button', { name: 'Delete Avatar' }).click();
    await expect(page.getByRole('button', { name: 'Are you sure?' })).toBeVisible();
    await page.getByRole('button', { name: 'Are you sure?' }).click();
    // Verify the avatar is no longer visible
    await expect(page.getByText('Avatar to Delete')).not.toBeVisible();
  });

  test('create avatar then delete on avatars page', async ({ page }) => {
    // Navigate to the avatar creation page
    await page.goto('/avatar/create');

    // Fill in the avatar name
    await page.getByLabel('Name').fill('Avatar to Delete');

    // Optional: Upload an image if the form supports it
    const fileInput = page.locator('input[name="image"]');
    //set input file path public/placeholder-avatar.png
    const filePath = path.resolve(
      __dirname,
      '../../files/images/image_1.jpeg'
    );
    await fileInput.setInputFiles(filePath);

    // Submit the form
    await page.getByRole('button', { name: /create avatar/i }).click();

    // Wait for navigation to avatars page
    await page.waitForURL('/avatars');

    // Verify the avatar was created
    await expect(page.getByText('Avatar to Delete')).toBeVisible();
    await page.getByRole('button', { name: 'Delete Avatar' }).click();
    await page.getByRole('button', { name: 'Confirm Delete' }).click();

    // Verify the avatar is no longer visible
    await expect(page.getByText('Avatar to Delete')).not.toBeVisible();
  });

  test('should delete pre-seeded avatar from the database', async ({ page }) => {
    // Seed the database with a test avatar
    await createAvatar({
      name: 'Avatar To Be Deleted',
      src: '/avatar-to-be-deleted.png',
      fileName: 'avatar-to-be-deleted.png',
    });

    // Visit the avatars page
    await page.goto('/avatars');

    // Check that the avatar is displayed
    await expect(page.getByText('Avatar To Be Deleted')).toBeVisible();

    // Click delete button (adjust selector based on your UI)
    await page.getByRole('button', { name: 'Delete Avatar' }).click();
    await page.getByRole('button', { name: 'Confirm Delete' }).click();

    // Verify the avatar is no longer displayed
    await expect(page.getByText('Avatar To Be Deleted')).not.toBeVisible();
  });
});
