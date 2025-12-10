import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm'],
  dts: true,
  unbundle: false, // Bundle all modules into a single file
  sourcemap: false,
  clean: false,
  outExtensions: () => ({
    js: '.js',
  }),
});
