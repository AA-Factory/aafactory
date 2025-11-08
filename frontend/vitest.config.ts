import { defineConfig } from 'vitest/config';
import path from 'path';
// process.env.BASE_UPLOAD_DIR = 'test/uploads';
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    env: {
      BASE_UPLOAD_DIR: 'test/uploads',
      MONGODB_URI: 'mongodb://admin:password@localhost:27017/myapp?authSource=admin',
      MONGODB_DB: 'aafactory_db_test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});