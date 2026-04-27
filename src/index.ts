// ESLint plugins must export an object with a 'rules' property
import {
  enforceRule,
  indexSiblingOnlyRule,
  noWildcardBarrelRule,
} from './infrastructure';
import type { ImportBoundariesPlugin, ImportBoundariesRules } from './eslintRuleTypes.js';

export { defineBoundaries, defineConfig } from './config.js';
// Re-export types for use in typed config files (boundaries.config.ts) and eslint flat config
export type { BarrelFileRuleOptions, BoundaryConfig, RuleOptions } from './shared';
export type { ImportBoundariesPlugin, ImportBoundariesRules };

export default {
  rules: {
    enforce: enforceRule,
    'no-wildcard-barrel': noWildcardBarrelRule,
    'index-sibling-only': indexSiblingOnlyRule,
  },
} satisfies ImportBoundariesPlugin;
