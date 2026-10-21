import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      TEST_DB_NAME: 'newleaf_test',
    },
    globalSetup: ['./test/global-setup.cjs'],
    setupFiles: ['./test/setup.js'],
    fileParallelism: false,
  },
});