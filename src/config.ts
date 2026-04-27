/**
 * Configuration helpers for import-boundaries.
 *
 * These utilities allow you to define your boundaries in a separate
 * TypeScript or JSON file with full type safety, then import them
 * into your ESLint config.
 *
 * @example Full rule options in TypeScript (boundaries.config.ts):
 * ```typescript
 * import { defineConfig } from 'eslint-plugin-import-boundaries';
 *
 * export default defineConfig({
 *   rootDir: 'src',
 *   crossBoundaryStyle: 'alias',
 *   boundaries: [
 *     { identifier: 'domain',         dir: 'domain',         alias: '@domain',         allowImportsFrom: [] },
 *     { identifier: 'application',    dir: 'application',    alias: '@application',    allowImportsFrom: ['domain'] },
 *     { identifier: 'infrastructure', dir: 'infrastructure', alias: '@infrastructure', allowImportsFrom: ['domain'] },
 *   ],
 * });
 * ```
 *
 * @example Boundaries only (boundaries.ts) with options in eslint.config:
 * ```typescript
 * import { defineBoundaries } from 'eslint-plugin-import-boundaries';
 *
 * export const boundaries = defineBoundaries([
 *   { identifier: 'domain', dir: 'domain', alias: '@domain', allowImportsFrom: [] },
 * ]);
 * ```
 *
 * @example ESLint config (eslint.config.ts):
 * ```typescript
 * import importBoundaries from 'eslint-plugin-import-boundaries';
 * import boundariesConfig from './boundaries.config';
 *
 * export default [
 *   {
 *     plugins: { 'import-boundaries': importBoundaries },
 *     rules: {
 *       'import-boundaries/enforce': ['error', boundariesConfig],
 *     },
 *   },
 * ];
 * ```
 *
 * @example JSON config file (boundaries.json):
 * ```json
 * {
 *   "rootDir": "src",
 *   "crossBoundaryStyle": "alias",
 *   "boundaries": [
 *     { "identifier": "domain",      "dir": "domain",      "alias": "@domain",      "allowImportsFrom": [] },
 *     { "identifier": "application", "dir": "application", "alias": "@application", "allowImportsFrom": ["domain"] }
 *   ]
 * }
 * ```
 * Then in eslint.config.js:
 * ```javascript
 * import boundariesConfig from './boundaries.json' with { type: 'json' };
 * ```
 */

import type { BoundaryConfig, RuleOptions } from '@shared';

/**
 * Define a type-safe boundaries configuration.
 * This is a pure identity function — it exists solely to provide type inference
 * and IDE autocompletion when defining your config in a separate TS file.
 *
 * @param config - The rule options to type-check
 * @returns The same config object unchanged
 */
export function defineConfig(config: RuleOptions): RuleOptions {
  return config;
}

/**
 * Type-check only the `boundaries` array in a file such as `boundaries.ts`
 * (when the rest of the rule options live in `eslint.config`).
 *
 * @param boundaries - The boundary list to validate
 * @returns The same array, for convenient `export default defineBoundaries([...])`
 */
export function defineBoundaries(
  boundaries: readonly BoundaryConfig[],
): BoundaryConfig[] {
  return boundaries.slice() as BoundaryConfig[];
}
