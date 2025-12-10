/**
 * Unknown boundary handling.
 *
 * Handles imports from paths that don't match any configured boundary.
 * These are typically external packages or paths outside the project structure.
 */

import type { Reporter } from '@ports';
import { reportViolation } from '@application/reporting';

export interface UnknownBoundaryHandlingOptions {
  rawSpec: string;
  allowUnknownBoundaries: boolean;
  reporter: Reporter;
  defaultSeverity?: 'error' | 'warn';
}

/**
 * Handle unknown boundary imports (target outside all boundaries).
 *
 * Reports a violation if the import path doesn't match any configured boundary
 * and unknown boundaries are not allowed. External packages (node_modules) are
 * typically handled separately and don't reach this function.
 *
 * @param options - Handling options
 * @returns true if a violation was reported, false otherwise
 */
export function handleUnknownBoundary(
  options: UnknownBoundaryHandlingOptions,
): boolean {
  const { rawSpec, allowUnknownBoundaries, reporter, defaultSeverity } =
    options;

  // If unknown boundaries are allowed, skip reporting
  if (allowUnknownBoundaries) {
    return false;
  }

  // Report violation - not fixable (don't know correct path)
  reportViolation({
    reporter,
    messageId: 'unknownBoundaryImport',
    data: {
      path: rawSpec,
    },
    defaultSeverity,
    // No fix - don't know what the correct path should be
  });

  return true;
}
