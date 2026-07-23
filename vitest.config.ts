import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Only the shipped component source is measured — barrels, story files,
      // type-only modules and the tests themselves carry no runtime logic.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/*.stories.tsx',
        'src/**/index.ts',
        'src/**/types.ts',
      ],
      // Enforce a coverage floor for the components directory so regressions in
      // test coverage fail CI rather than merging silently.
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        // Lower than the others: the components carry defensive ref-forwarding
        // and optional-callback branches that never execute in jsdom.
        branches: 60,
      },
    },
  },
});
