import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    // Run test files in src directory
    include: ['src/**/*.test.{js,ts}'],
    // Exclude build output and node_modules
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.js', // Compiled output
        'src/**/types.ts', // Type definitions only
        'src/**/defaults.ts', // Helper functions (optional)
        'tsdown.config.ts',
        'vitest.config.ts',
      ],
    },
  },
});
