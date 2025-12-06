import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/types/**/*.ts', 'src/server/**/*.ts'],
    },
    testTimeout: 10000,
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'junit.xml',
    },
  },
});
