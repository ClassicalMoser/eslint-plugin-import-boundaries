/**
 * Infrastructure: ESLint adapters (imperative shell)
 * Implements ports and adapts ESLint APIs to our application layer.
 *
 * Adapters (fixer, reporter, rule context, visitors, schema) are internal
 * implementation details wired together by rule.ts - not exported.
 */

export { rule as enforceRule } from './rule';

export { indexSiblingOnlyRule, noWildcardBarrelRule } from './rules';
