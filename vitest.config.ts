import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to create alias entries
const createAliases = (prefix: string, dir: string) => [
  {
    find: new RegExp(`^${prefix}$`),
    replacement: path.resolve(__dirname, `${dir}/index.ts`),
  },
  {
    find: new RegExp(`^${prefix}/(.+)$`),
    replacement: `${path.resolve(__dirname, dir)}/$1`,
  },
];

export default defineConfig({
  resolve: {
    alias: [
      ...createAliases('@domain', 'src/domain'),
      ...createAliases('@application', 'src/application'),
      ...createAliases('@ports', 'src/ports'),
      ...createAliases('@infrastructure', 'src/infrastructure'),
      ...createAliases('@shared', 'src/shared'),
    ],
  },
  test: {
    watch: false,
    include: ['src/**/*.test.{js,ts}'],
    exclude: ['dist/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**', // Test utils: Skip coverage
        'src/**/*.test.ts', // Test files: Skip coverage
        'src/**/*.js', // Build files: Skip coverage
        'src/**/index.ts', // Barrel files: Skip coverage
        'src/**/types.ts', // Types: Declarations only
        'src/**/defaults.ts', // Defaults: Configuration only
        'src/infrastructure/**', // Adapters: Don't test what you don't own
        'src/shared/**', // Shared: Pure types and declarations
        'src/ports/**', // Ports: Interfaces only (dependency inversion contracts)
        'tsdown.config.ts', // build config: Skip coverage
        'vitest.config.ts', // Test config: Skip coverage
      ],
    },
  },
});
