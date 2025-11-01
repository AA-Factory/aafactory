import { test, expect } from '@playwright/test';
import {
  createAvatar,
  clearCollection,
  closeDatabaseConnection,
} from '../helpers/db-helpers';
import path from 'path';
test.describe('Update Avatar', () => {
  // Clear avatars collection before each test
  test.beforeEach(async () => {
    await clearCollection('avatars');
  });

  // Close database connection after all tests
  test.afterAll(async () => {
    await closeDatabaseConnection();
  });

  test('should create an avatar then update the name', async ({ page }) => {
    // Navigate to the avatar creation page
    await page.goto('/avatar/create');

    // Fill in the avatar name
    await page.getByLabel('Name').fill('Test Avatar');

    // Optional: Upload an image if the form supports it
    const fileInput = page.locator('input[name="image"]');
    //set input file path public/placeholder-avatar.png
    const filePath = path.resolve(
      __dirname,
      '../../files/images/image_1.jpeg'
    );
    await fileInput.setInputFiles(filePath);

    // Submit the form
    await page.getByRole('button', { name: /Create Avatar/i }).click();

    // Wait for navigation to avatars page
    await page.waitForURL('/avatars');

    // Verify the avatar appears in the list
    await expect(page.getByText('Test Avatar')).toBeVisible();

    // Click on the avatar card to open it
    await page.getByRole('link', { name: 'Edit Avatar' }).click();

    // Update the avatar name
    const nameInput = page.getByLabel('Name');
    await nameInput.fill('Updated Avatar Name');

    // Submit the update form
    await page.getByRole('button', { name: /Update Avatar/i }).click();

    // Wait for navigation back to avatars page
    await page.waitForURL('/avatars');

    // Verify the updated avatar name appears in the list
    await expect(page.getByText('Updated Avatar Name')).toBeVisible();
  });

  test('should create an avatar then update the image', async ({ page }) => {
    // Navigate to the avatar creation page
    await page.goto('/avatar/create');

    // Fill in the avatar name
    await page.getByLabel('Name').fill('Image Update Avatar');

    // Optional: Upload an image if the form supports it
    const fileInput = page.locator('input[name="image"]');
    //set input file path public/placeholder-avatar.png
    const filePath = path.resolve(
      __dirname,
      '../../files/images/image_1.jpeg'
    );
    await fileInput.setInputFiles(filePath);

    // Submit the form
    await page.getByRole('button', { name: /Create Avatar/i }).click();

    // Wait for navigation to avatars page
    await page.waitForURL('/avatars');
    const avatarImage = page.locator('img[alt*="Image Update Avatar"]'); // Adjust selector as needed
    const originalImageSrc = await avatarImage.getAttribute('src');

    console.log('Original image src:', originalImageSrc);

    // Verify the avatar appears in the list
    await expect(page.getByText('Image Update Avatar')).toBeVisible();

    // Click on the avatar card to open it
    await page.getByRole('link', { name: 'Edit Avatar' }).click();

    // Update the avatar image
    const updateFileInput = page.locator('input[name="image"]');
    //set input file path public/placeholder-avatar-2.png
    const newFilePath = path.resolve(
      __dirname,
      '../../files/images/image_2.jpeg'
    );
    await updateFileInput.setInputFiles(newFilePath);

    // Submit the update form
    await page.getByRole('button', { name: /Update Avatar/i }).click();

    // Wait for navigation back to avatars page
    await page.waitForURL('/avatars');
    await expect(page.locator('div').filter({ hasText: 'Avatar data successfully' }).first()).toBeVisible();
    await page.waitForTimeout(1000);
    const updatedImageSrc = await avatarImage.getAttribute('src');

    console.log('Updated image src:', updatedImageSrc);

    // Assert the image src has changed
    expect(updatedImageSrc).not.toBe(originalImageSrc);
  });

  test('should update a pre-seeded avatar', async ({ page }) => {
    // Seed the database with a test avatar
    const avatar = await createAvatar({
      name: 'Original Avatar',
      src: '/original-avatar.png',
      fileName: 'original-avatar.png',
    });

    // Visit the avatars page
    await page.goto('/avatars');

    // Verify the seeded avatar appears in the list
    await expect(page.getByText('Original Avatar')).toBeVisible();

    // Click on the avatar card to open it
    await page.getByRole('link', { name: 'Edit Avatar' }).click();

    // Update the avatar name
    const nameInput = page.getByLabel('Name');
    await nameInput.fill('Modified Avatar Name');

    // Submit the update form
    await page.getByRole('button', { name: /Update Avatar/i }).click();

    // Wait for navigation back to avatars page
    await page.waitForURL('/avatars');

    // Verify the updated avatar name appears in the list
    await expect(page.getByText('Modified Avatar Name')).toBeVisible();
  });
});
