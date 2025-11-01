import { test, expect } from '@playwright/test';
import {
  createAvatar,
  clearCollection,
  closeDatabaseConnection,
} from '../../helpers/db-helpers';

test.describe('Text to Image Generation', () => {
  // Clear avatars collection before each test
  test.beforeEach(async () => {
    await clearCollection('avatars');
  });

  // Close database connection after all tests
  test.afterAll(async () => {
    await closeDatabaseConnection();
  });

  test('should generate an image from text prompt', async ({ page }) => {
    //Create an avatar to use as for generation
    await createAvatar({
      name: 'Generation Avatar',
      src: '/avatar-gen.png',
      fileName: 'avatar-gen.png',
    });
    // Navigate to the text-to-image generation page
    await page.goto('/content_creation/generate_image');
    const typeNextButton = page.getByRole('button', { name: 'Next' });
    await expect(typeNextButton).toBeDisabled();
    await page.getByRole('button', { name: 'Text to Image' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    const avatarNextButton = page.getByRole('button', { name: 'Next' });
    await expect(avatarNextButton).toBeDisabled();
    await page.getByRole('button', { name: 'Generation Avatar Generation' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('textbox', { name: 'Positive Prompt* Describe the' }).dblclick();
    await page.getByRole('textbox', { name: 'Positive Prompt* Describe the' }).fill('a man on a tree');
    await page.getByRole('button', { name: 'Generate Image' }).click();
    await expect(page.getByText('Generating Text to Image for Generation Avatar')).toBeVisible();

    await expect(page.getByRole('button', { name: 'PENDING' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generating...' })).toBeVisible();

    // Wait for the generated image to appear
    await page.waitForTimeout(25000);
    await expect(page.getByRole('button', { name: 'Media thumbnail SUCCESS' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Generated' })).toBeVisible();

  });
});
