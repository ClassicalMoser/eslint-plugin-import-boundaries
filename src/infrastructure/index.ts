/**
 * Infrastructure: Imperative shell (adapters)
 * Implements ports and adapts external systems (ESLint) to our application layer.
 */

export {
  adaptESLintNode,
  createFileDataGetter,
  createFixerFactory,
  createRuleVisitors,
  enforceRule,
  ESLintReporter,
  extractRuleOptions,
  indexSiblingOnlyRule,
  noWildcardBarrelRule,
  ruleMessages,
  ruleSchema,
  toESLintReportFixer,
} from './eslint';

export type { RuleContextData, RuleVisitorOptions } from './eslint';
