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
  if (fileBoundary.alias == null) {
    return false;
  }

  return (
    rawSpec === fileBoundary.alias || rawSpec === `${fileBoundary.alias}/index`
  );
}

/**
 * Check if absolute path matches for ancestor barrel detection.
 */
export function absolutePathMatchesAncestorBarrel(
  rawSpec: string,
  boundaryAbsPath: string,
): boolean {
  return (
    rawSpec === boundaryAbsPath ||
    rawSpec === `${boundaryAbsPath}/` ||
    rawSpec === `${boundaryAbsPath}/index`
  );
}
