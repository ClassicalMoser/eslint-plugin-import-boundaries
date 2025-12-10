/**
 * Infrastructure: ESLint adapters (imperative shell)
 * Implements ports and adapts ESLint APIs to our application layer.
 */

export { adaptESLintNode } from './astNodeAdapter';

export { createFixerFactory, toESLintReportFixer } from './fixerAdapter';

export { ESLintReporter } from './reporterAdapter';

export { rule } from './rule';

export {
  createFileDataGetter,
  extractRuleOptions,
  type RuleContextData,
} from './ruleContext';

export { ruleMessages, ruleSchema } from './ruleSchema';

export { createRuleVisitors, type RuleVisitorOptions } from './ruleVisitors';

// Schema helpers are internal implementation details - not exported
