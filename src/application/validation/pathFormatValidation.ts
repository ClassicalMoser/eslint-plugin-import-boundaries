/**
 * Path format validation and reporting.
 */

import type { Fixer, Reporter } from '@ports';
import type { Boundary } from '@shared';

export interface PathFormatValidationOptions {
  rawSpec: string;
  correctPath: string;
  fileBoundary: Boundary | null;
  reporter: Reporter;
  createFixer: (newPath: string) => Fixer;
  defaultSeverity?: 'error' | 'warn';
}

/**
 * Validate and report incorrect import path format.
 *
 * @returns true if a violation was reported, false otherwise
 */
export function validatePathFormat(
  options: PathFormatValidationOptions,
): boolean {
  const {
    rawSpec,
    correctPath,
    fileBoundary,
    reporter,
    createFixer,
    defaultSeverity,
  } = options;

  // Check if current path is correct
  if (rawSpec === correctPath) {
    return false; // No violation
  }

  // Determine severity for this boundary
  const severity = fileBoundary?.severity || defaultSeverity;

  // Show the expected path directly
  reporter.report({
    messageId: 'incorrectImportPath',
    data: {
      expectedPath: correctPath,
      actualPath: rawSpec,
    },
    severity,
    fix: createFixer(correctPath),
  });

  return true;
}
