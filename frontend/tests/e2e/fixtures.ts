import { test as base } from '@playwright/test';

/**
 * Extend base test with custom fixtures
 */
export const test = base.extend({
  // Add custom fixtures here as needed
});

export { expect } from '@playwright/test';
