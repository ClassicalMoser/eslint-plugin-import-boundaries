/**
 * Unknown boundary handling.
 */

import type { Reporter } from '@ports';

export interface UnknownBoundaryHandlingOptions {
  rawSpec: string;
  allowUnknownBoundaries: boolean;
  reporter: Reporter;
  defaultSeverity?: 'error' | 'warn';
}

/**
 * Handle unknown boundary imports (target outside all boundaries).
 *
 * @returns true if a violation was reported, false otherwise
 */
export function handleUnknownBoundary(
  options: UnknownBoundaryHandlingOptions,
): boolean {
  const { rawSpec, allowUnknownBoundaries, reporter, defaultSeverity } =
    options;

  if (allowUnknownBoundaries) {
    return false; // Allowed, no violation
  }

  reporter.report({
    messageId: 'unknownBoundaryImport',
    data: {
      path: rawSpec,
    },
    severity: defaultSeverity,
    // No fix - don't know what the correct path should be
  });

  return true;
}

