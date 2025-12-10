/**
 * Infrastructure: ESLint Reporter Adapter
 * Implements the Reporter port using ESLint's RuleContext.
 */

import type { Reporter, ReportOptions } from '@ports';
import type { Rule } from 'eslint';
import { toESLintReportFixer } from './fixerAdapter';

/**
 * ESLint implementation of the Reporter port.
 */
export class ESLintReporter implements Reporter {
  constructor(
    private readonly context: Rule.RuleContext,
    private readonly node: Rule.Node,
  ) {}

  report = (options: ReportOptions): void => {
    const reportOptions: Rule.ReportDescriptor = {
      node: this.node,
      messageId: options.messageId,
      data: options.data as Record<string, string>,
      ...(options.severity && {
        severity: options.severity === 'warn' ? 1 : 2,
      }),
    };

    // Convert port Fixer to ESLint ReportFixer
    if (options.fix) {
      reportOptions.fix = toESLintReportFixer(this.node, options.fix);
    }

    this.context.report(reportOptions);
  };
}
