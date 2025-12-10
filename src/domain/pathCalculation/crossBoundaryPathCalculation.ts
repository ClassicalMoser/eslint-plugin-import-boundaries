/**
 * Cross-boundary path calculation.
 */

import type { Boundary } from '@shared';
import { formatAbsolutePath } from '@domain/path';

/**
 * Calculate path for cross-boundary imports.
 */
export function calculateCrossBoundaryPath(
  targetBoundary: Boundary | null,
  rootDir: string,
  crossBoundaryStyle: 'alias' | 'absolute',
): string | 'UNKNOWN_BOUNDARY' {
  if (!targetBoundary) {
    return 'UNKNOWN_BOUNDARY';
  }

  if (crossBoundaryStyle === 'absolute') {
    return formatAbsolutePath(rootDir, targetBoundary.dir);
  }

  // Alias style requires alias to be present
  if (!targetBoundary.alias) {
    // This shouldn't happen if validation is correct, but handle gracefully
    return formatAbsolutePath(rootDir, targetBoundary.dir);
  }

  return targetBoundary.alias;
}
