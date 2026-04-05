import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/__tests__/**/*.test.ts'],
    // Each test file runs in its own isolated worker so module-level state
    // (the mocked DB singleton) does not bleed between files.
    pool: 'forks',
    poolOptions: {
      forks: {
        // Prevent re-use of workers between test files to keep mocks clean.
        singleFork: false,
      },
    },
    // Silence noisy console output during the test run.
    silent: false,
  },
});
