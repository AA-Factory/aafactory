# E2E Testing with Playwright

This directory contains end-to-end tests for the AA Factory frontend using Playwright.

## Installation

Playwright is already installed as a dev dependency. To install the browsers:

```bash
npx playwright install
```

For Docker environments:

```bash
npx playwright install --with-deps
```

## Running Tests

### Local Development

```bash
# Run all tests in headless mode
npm run test:e2e

# Run tests with UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Run Specific Tests

```bash
# Run a specific test file
npx playwright test e2e/settings.spec.ts

# Run tests matching a title
npx playwright test -g "Redis"

# Run in a specific browser
npx playwright test --project=chromium
```

## Running in Docker

Since your app runs in Docker, you have two options:

### Option 1: Run tests from host machine

The tests will connect to your Docker-running app at `http://localhost:3000`:

```bash
npm run test:e2e
```

### Option 2: Run tests inside Docker

Add a Playwright service to your `docker-compose.yml`:

```yaml
playwright:
  image: mcr.microsoft.com/playwright:v1.56.1-jammy
  working_dir: /app
  volumes:
    - ./frontend:/app
  environment:
    - PLAYWRIGHT_BASE_URL=http://frontend-app:3000
  command: npm run test:e2e
  depends_on:
    - frontend-app
  profiles:
    - test
```

Then run:

```bash
docker compose --profile test run playwright
```

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Your test code
  });
});
```

### Database Test Helpers

The `helpers/db-helpers.ts` file provides utility functions for managing test data in MongoDB.

#### Usage Example

```typescript
import {
  createAvatar,
  createTask,
  clearCollection,
  seedAvatars,
  closeDatabaseConnection,
} from './helpers/db-helpers';

test.describe('Avatar Tests', () => {
  // Clear collection before each test
  test.beforeEach(async () => {
    await clearCollection('avatars');
  });

  // Close DB connection after all tests
  test.afterAll(async () => {
    await closeDatabaseConnection();
  });

  test('displays seeded avatars', async ({ page }) => {
    // Seed 3 test avatars
    await seedAvatars(3);

    await page.goto('/avatars');
    await expect(page.getByText('Test Avatar 1')).toBeVisible();
  });

  test('creates custom avatar', async ({ page }) => {
    // Create specific avatar
    const avatar = await createAvatar({
      name: 'John Doe',
      src: '/avatar.png',
      fileName: 'avatar.png',
    });

    await page.goto('/avatars');
    await expect(page.getByText('John Doe')).toBeVisible();
  });
});
```

#### Available Functions

**Avatar Helpers:**
- `createAvatar(data)` - Create a single avatar
- `getAvatarById(id)` - Get avatar by ID
- `getAllAvatars()` - Get all avatars
- `deleteAvatar(id)` - Delete an avatar
- `seedAvatars(count)` - Create multiple test avatars

**Task Helpers:**
- `createTask(data)` - Create a task
- `getTaskById(taskId)` - Get task by ID
- `getAllTasks()` - Get all tasks
- `deleteTask(taskId)` - Delete a task

**Video Helpers:**
- `createVideo(data)` - Create a video record
- `getAllVideos()` - Get all videos
- `deleteVideo(id)` - Delete a video

**Cleanup Helpers:**
- `clearCollection(name)` - Clear a specific collection
- `clearAllCollections()` - Clear all collections
- `closeDatabaseConnection()` - Close DB connection (use in `afterAll`)

### Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Use data-testid attributes** for stable selectors
3. **Avoid hard-coded waits** - use Playwright's auto-waiting
4. **Keep tests isolated** - each test should be independent
5. **Use fixtures** for common setup (see `fixtures.ts`)

### Example Test

```typescript
test('validates form input', async ({ page }) => {
  await page.goto('/settings');

  const input = page.locator('input#redis-endpoint');
  await input.fill('invalid-value');

  const error = page.locator('text=Invalid Format');
  await expect(error).toBeVisible();
});
```

## Debugging

### Debug Mode

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through tests
- See console logs
- Inspect the DOM
- Take screenshots

### Visual Debugging

```bash
npm run test:e2e:ui
```

The UI mode provides:
- Time-travel debugging
- Watch mode for file changes
- Test filtering
- Step-by-step execution

### Screenshots and Videos

Failed tests automatically capture:
- Screenshot on failure
- Trace file for debugging

Access them in `test-results/` directory.

## CI/CD Integration

For GitHub Actions, add this workflow:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npm run test:e2e
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

## Configuration

See `playwright.config.ts` for:
- Browser configurations
- Test timeout settings
- Base URL
- Screenshot/video settings
- Reporter options

## Troubleshooting

### Tests timing out
- Increase timeout in config
- Check if app is running
- Verify `baseURL` is correct

### Browser not launching in Docker
- Use `npx playwright install --with-deps`
- Ensure Docker has enough resources
- Run in headless mode

### Flaky tests
- Add explicit waits for async operations
- Use `toBeVisible()` instead of checking existence
- Avoid testing timing-dependent behavior
