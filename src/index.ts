// ESLint plugins must export an object with a 'rules' property
import { enforceRule, indexSiblingOnlyRule, noWildcardBarrelRule } from './infrastructure';

export { defineConfig } from './config.js';
// Re-export types for use in typed config files (boundaries.config.ts)
export type { BoundaryConfig, RuleOptions } from './shared';

export default {
  rules: {
    enforce: enforceRule,
    'no-wildcard-barrel': noWildcardBarrelRule,
    'index-sibling-only': indexSiblingOnlyRule,
  },
};
