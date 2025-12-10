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
 */
export function shouldReportAliasSubpathViolation(
  targetBoundary: Boundary | undefined,
  fileBoundary: Boundary | null,
): boolean {
  return (
    Boolean(targetBoundary) &&
    Boolean(targetBoundary?.alias) &&
    fileBoundary !== null &&
    targetBoundary !== fileBoundary
  );
}

