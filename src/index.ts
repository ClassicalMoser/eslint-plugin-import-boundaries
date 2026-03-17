// ESLint plugins must export an object with a 'rules' property
// eslint-disable-next-line import-boundaries/enforce
import { rule as enforceRule } from './infrastructure/eslint/rule.js';
// eslint-disable-next-line import-boundaries/enforce
import { rule as indexSiblingOnlyRule } from './infrastructure/eslint/rules/indexSiblingOnly.js';
// eslint-disable-next-line import-boundaries/enforce
import { rule as noWildcardBarrelRule } from './infrastructure/eslint/rules/noWildcardBarrel.js';

// Re-export types for use in typed config files (boundaries.config.ts)
export type { BoundaryConfig, RuleOptions } from '@shared';
export { defineConfig } from './config.js';

export default {
  rules: {
    enforce: enforceRule,
    'no-wildcard-barrel': noWildcardBarrelRule,
    'index-sibling-only': indexSiblingOnlyRule,
  },
};
