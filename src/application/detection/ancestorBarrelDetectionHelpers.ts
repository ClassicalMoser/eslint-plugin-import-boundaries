/**
 * Helper functions for ancestorBarrelDetection.ts
 * Extracted to improve testability and reduce mutation opportunities.
 */

import type { Boundary } from '@shared';
import { checkAncestorBarrel } from '@domain/pathCalculation/ancestorBarrelCheck';

/**
 * Check if an import is an ancestor barrel import.
 * Uses the domain checkAncestorBarrel function for consistency.
 */
export function isAncestorBarrelImport(
  rawSpec: string,
  fileBoundary: Boundary,
  rootDir: string,
  crossBoundaryStyle: 'alias' | 'absolute',
): boolean {
  return checkAncestorBarrel(rawSpec, fileBoundary, rootDir, crossBoundaryStyle);
}

