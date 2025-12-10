import antfu from '@antfu/eslint-config';
import prettierConfig from 'eslint-config-prettier';
import importBoundaries from 'eslint-plugin-import-boundaries';
import { boundaries } from './boundaries.config.js';

export default antfu(
  {
    react: false,
    typescript: true,
    stylistic: false,
    markdown: false,
    ignores: [
      // Reports
      'coverage/**',
      'reports/**',
      // External files
      'node_modules/**',
      // Stryker mutation testing sandbox
      '.stryker-tmp/**',
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
    },
    plugins: {
      'import-boundaries': importBoundaries,
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.js'],
    rules: {
      'import-boundaries/enforce': [
        'error',
        {
          rootDir: 'src',
          boundaries,
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.js', '**/__tests__/**/*.ts'],
    rules: {
      'import-boundaries/enforce': [
        'error',
        {
          rootDir: 'src',
          boundaries,
          enforceBoundaries: false,
        },
      ],
    },
  },
  {
    ignores: [
      'pnpm-lock.yaml',
      'node_modules/**',
      'coverage/**',
      '.stryker-tmp/**',
      'reports/**',
      '*.yml',
      '**/*.md',
      '**/*.mdx',
      'dist/**',
      // Test files can import from all layers
      '**/*.test.ts',
      // Config files
      'vitest.config.ts',
      'tsdown.config.ts',
      'eslint.config.js',
      'boundaries.config.js',
    ],
  },
  prettierConfig,
);
