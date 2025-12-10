/**
 * Helper functions for aliasSubpathValidation.ts
 * Extracted to improve testability and reduce mutation opportunities.
 */

import type { Boundary } from '@shared';

/**
 * Check if all conditions are met to report a cross-boundary alias subpath violation.
 * Conditions:
 * 1. Target boundary exists and has an alias
 * 2. File boundary exists
 * 3. This is a cross-boundary import (target !== file)
 *
 * Type guard: if this returns true, targetBoundary is guaranteed to be defined and have an alias.
 */
export function shouldReportAliasSubpathViolation(
  targetBoundary: Boundary | undefined,
  fileBoundary: Boundary | null,
): targetBoundary is Boundary & { alias: string } {
  return (
    targetBoundary !== undefined &&
    targetBoundary.alias !== undefined &&
    fileBoundary !== null &&
    targetBoundary !== fileBoundary
  );
}
