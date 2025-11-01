import { test, expect } from '@playwright/test';
import {
  createAvatar,
  clearCollection,
  closeDatabaseConnection,
} from '../helpers/db-helpers';
import path from 'path';
test.describe('Create Avatar', () => {
  // Clear avatars collection before each test
  test.beforeEach(async () => {
    await clearCollection('avatars');
  });

  // Close database connection after all tests
  test.afterAll(async () => {
    await closeDatabaseConnection();
  });

  test('should create an avatar', async ({ page }) => {
    // Navigate to the avatar creation page
    await page.goto('/');
    await page.getByRole('button', { name: 'Create Your Avatar' }).click();

    // Fill in the avatar name
    await page.getByLabel('Name').fill('Test Avatar');

    // Optional: Upload an image if the form supports it
    const imageFileInput = page.locator('input[name="image"]');
    //set input file path public/placeholder-avatar.png
    const imageFilePath = path.resolve(
      __dirname,
      '../../files/images/image_1.jpeg'
    );
    await imageFileInput.setInputFiles(imageFilePath);

    const audioFileInput = page.locator('input[name="trainingAudio"]');
    //set input file path public/placeholder-audio.mp3
    const audioFilePath = path.resolve(
      __dirname,
      '../../files/audio/audio_1.wav'
    );
    await audioFileInput.setInputFiles(audioFilePath);
    // Submit the form
    await page.getByRole('button', { name: /Create Avatar/i }).click();

    // Wait for navigation to avatars page
    await page.waitForURL('/avatars');

    // Verify the avatar appears in the list
    await expect(page.getByText('Test Avatar')).toBeVisible();
  });

  test('should display pre-seeded avatars from the database', async ({ page }) => {
    // Seed the database with test avatars
    await createAvatar({
      name: 'Avatar One',
      src: '/avatar-1.png',
      fileName: 'avatar-1.png',
    });
    await createAvatar({
      name: 'Avatar Two',
      src: '/avatar-2.png',
      fileName: 'avatar-2.png',
    });

    // Visit the avatars page
    await page.goto('/avatars');

    // Check that both avatars are displayed
    await expect(page.getByText('Avatar One')).toBeVisible();
    await expect(page.getByText('Avatar Two')).toBeVisible();
  });

  test('should save and create image', async ({ page }) => {
    // Navigate to the avatar creation page
    await page.goto('/avatar/create');

    // Fill in the avatar name
    await page.getByLabel('Name').fill('Image Avatar');

    // Submit the form
    await page.getByRole('button', { name: 'Save & Create Image' }).click();

    // Wait for navigation to avatars page
    await page.waitForURL('/content_creation/generate_image');
    await page.getByRole('button', { name: 'Text to Image' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    // Verify the avatar appears in the list
    await expect(page.getByText('Image Avatar')).toBeVisible();
  });
});

