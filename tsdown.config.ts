import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsdown';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: {
    'eslint-plugin-import-boundaries': path.resolve(
      __dirname,
      'src/index.ts',
    ),
  },
  format: ['esm'],
  dts: true,
  unbundle: false, // Bundle all modules into a single file
  sourcemap: false,
  clean: false,
  outDir: __dirname,
  outExtensions: () => ({
    js: '.js',
  }),
});
