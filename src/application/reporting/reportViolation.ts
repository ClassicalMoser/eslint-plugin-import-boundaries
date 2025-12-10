/**
 * Violation reporting utilities.
 * Provides a consistent interface for reporting violations with proper severity handling.
 */

import type { Fixer, Reporter } from '@ports';
import type { Boundary } from '@shared';
import { getSeverity } from './severity';

/**
 * Options for reporting a violation.
 */
export interface ReportViolationOptions {
  /** Reporter instance to use */
  reporter: Reporter;
  /** Message ID from rule schema */
  messageId: string;
  /** Data to interpolate into the message */
  data: Record<string, string>;
  /** File boundary (for severity calculation) */
  fileBoundary?: Boundary | null;
  /** Default severity from rule options */
  defaultSeverity?: 'error' | 'warn';
  /** Optional fixer for auto-fixable violations */
  fix?: Fixer;
}

/**
 * Report a violation with proper severity handling.
 *
 * This centralizes the reporting logic, ensuring consistent severity calculation
 * across all validation functions. Severity is determined by:
 * 1. Boundary-specific severity (if set)
 * 2. Default severity (if provided)
 * 3. Rule-level default (if neither is set)
 *
 * @param options - Violation reporting options
 *
 * @example
 * ```typescript
 * reportViolation({
 *   reporter,
 *   messageId: 'incorrectImportPath',
 *   data: { expectedPath: '@domain', actualPath: '@domain/entities' },
 *   fileBoundary,
 *   defaultSeverity: 'error',
 *   fix: createFixer('@domain'),
 * });
 * ```
 */
export function reportViolation(options: ReportViolationOptions): void {
  const severity = getSeverity(
    options.fileBoundary ?? null,
    options.defaultSeverity,
  );

  options.reporter.report({
    messageId: options.messageId,
    data: options.data,
    severity,
    fix: options.fix,
  });
}
