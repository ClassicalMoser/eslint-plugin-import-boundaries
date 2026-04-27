import type { BarrelFileRuleOptions, RuleOptions } from '@shared';
/**
 * Types for ESLint flat config (`defineConfig` from `eslint/config`) and
 * typed `rules` entries for this plugin.
 *
 * @example
 * ```ts
 * import type { Linter } from 'eslint';
 * import type { ImportBoundariesRules } from 'eslint-plugin-import-boundaries';
 *
 * const rules = {
 *   'import-boundaries/enforce': ['error', { rootDir: 'src', boundaries: [] }],
 * } satisfies Partial<ImportBoundariesRules>;
 * ```
 */
import type { Linter, Rule } from 'eslint';

/**
 * Default export shape of this package — for typing `plugins['import-boundaries']`.
 */
export interface ImportBoundariesPlugin {
  rules: {
    enforce: Rule.RuleModule;
    'no-wildcard-barrel': Rule.RuleModule;
    'index-sibling-only': Rule.RuleModule;
  };
}

/**
 * Typed `rules` keys for this plugin. Use with `satisfies Partial<...>` (or
 * `Pick`) when composing a `rules` object alongside other plugins.
 */
export interface ImportBoundariesRules {
  'import-boundaries/enforce': Linter.RuleEntry<[RuleOptions]>;
  'import-boundaries/no-wildcard-barrel': Linter.RuleEntry<
    [BarrelFileRuleOptions]
  >;
  'import-boundaries/index-sibling-only': Linter.RuleEntry<
    [BarrelFileRuleOptions]
  >;
}
