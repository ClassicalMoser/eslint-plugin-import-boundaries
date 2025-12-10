/**
 * Helper functions for ancestorBarrelCheck.ts
 * Extracted to improve testability and reduce mutation opportunities.
 */

import type { Boundary } from '@shared';

/**
 * Check if alias matches for ancestor barrel detection.
 */
export function aliasMatchesAncestorBarrel(
  fileBoundary: Boundary,
  rawSpec: string,
): boolean {
  return fileBoundary.alias !== null && rawSpec === fileBoundary.alias;
}

/**
 * Check if absolute path matches for ancestor barrel detection.
 */
export function absolutePathMatchesAncestorBarrel(
  rawSpec: string,
  boundaryAbsPath: string,
): boolean {
  return rawSpec === boundaryAbsPath || rawSpec === `${boundaryAbsPath}/`;
}
