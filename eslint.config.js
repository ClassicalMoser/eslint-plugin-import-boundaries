import antfu from '@antfu/eslint-config';
import prettierConfig from 'eslint-config-prettier';
import { boundariesConfig } from './boundaries.config.js';
import importBoundaries from './eslint-plugin-import-boundaries.js';

export default antfu(
  {
    react: false,
    typescript: true,
    stylistic: false,
    markdown: false,
    ignores: [
      // Reports
      'coverage/**',
      // External files
      'node_modules/**',
      // Build files
      'eslint-plugin-import-boundaries.js',
      'eslint-plugin-import-boundaries.d.ts',
    ],
    languageOptions: {
      globals: {
        describe: true,
        it: true,
        expect: true,
        vi: true,
        beforeAll: true,
        beforeEach: true,
        afterEach: true,
        afterAll: true,
      },
    },
    rules: {
      'no-console': ['error', { allow: ['error'] }],
      'import/no-duplicates': ['error', { 'prefer-inline': false }],
      'import-boundaries/enforce': ['error', boundariesConfig],
    },
    plugins: {
      'import-boundaries': importBoundaries,
    },
  },
  {
    ignores: [
      'pnpm-lock.yaml',
      'node_modules/**',
      'coverage/**',
      '*.yml',
      '**/*.md',
      '**/*.mdx',
      'eslint-plugin-import-boundaries.js',
      'eslint-plugin-import-boundaries.d.ts',
      // Test files can import from all layers
      '**/*.test.ts',
    ],
  },
  prettierConfig,
);
