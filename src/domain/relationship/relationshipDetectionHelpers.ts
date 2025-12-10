/**
 * Helper functions for relationship detection logic.
 * Extracted to improve testability and reduce mutation opportunities.
 */

import type { Boundary } from '@shared';
import { checkAncestorBarrel } from '@domain/pathCalculation';

/**
 * Check if this is an ancestor barrel import that should be forbidden.
 * Ancestor barrel imports create circular dependencies and are not fixable.
 */
export function isAncestorBarrelImport(
  rawSpec: string,
  fileBoundary: Boundary,
  rootDir: string,
  crossBoundaryStyle: 'alias' | 'absolute',
): boolean {
  return checkAncestorBarrel(rawSpec, fileBoundary, rootDir, crossBoundaryStyle);
}

/**
 * Check if this is a cross-boundary import.
 * Cross-boundary imports occur when:
 * - File has no boundary (fileBoundary is null), OR
 * - Target boundary is different from file boundary
 */
export function isCrossBoundaryImport(
  fileBoundary: Boundary | null,
  targetBoundary: Boundary | null,
): boolean {
  return fileBoundary === null || targetBoundary !== fileBoundary;
}

