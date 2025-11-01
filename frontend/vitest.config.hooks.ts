import { defineProject } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineProject({
  plugins: [react()],
  test: {
    name: 'hooks',
    environment: 'happy-dom',
    globals: true,
    // setupFiles: ['./tests/setup-react.ts'],
    include: ['tests/unit/**/*.test.tsx'],
    env: {
      NEXT_PUBLIC_CELERY_BASE_URL: 'http://0.0.0.0:8000',
    },
    exclude: [
      'tests/integration/**/*',
    ],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react': path.resolve(__dirname, './node_modules/react'),
    },
    conditions: ['development'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
});