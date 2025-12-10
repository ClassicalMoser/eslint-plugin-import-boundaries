/**
 * Helper functions for boundaryRules.ts
 * Extracted to improve testability and reduce mutation opportunities.
 */

import type { Boundary } from '@shared';

/**
 * Check if a boundary has a non-empty allow list.
 */
export function hasAllowList(boundary: Boundary): boolean {
  return Boolean(boundary.allowImportsFrom && boundary.allowImportsFrom.length > 0);
}

/**
 * Check if a boundary has a non-empty deny list.
 */
export function hasDenyList(boundary: Boundary): boolean {
  return Boolean(boundary.denyImportsFrom && boundary.denyImportsFrom.length > 0);
}

/**
 * Check if a target boundary is in the deny list.
 */
export function isInDenyList(
  fileBoundary: Boundary,
  targetBoundary: Boundary,
  matchesBoundaryIdentifier: (id: string, target: Boundary) => boolean,
): boolean {
  if (!hasDenyList(fileBoundary)) {
    return false;
  }
  return fileBoundary.denyImportsFrom!.some((id) =>
    matchesBoundaryIdentifier(id, targetBoundary),
  );
}

/**
 * Check if a target boundary is in the allow list.
 */
export function isInAllowList(
  fileBoundary: Boundary,
  targetBoundary: Boundary,
  matchesBoundaryIdentifier: (id: string, target: Boundary) => boolean,
): boolean {
  if (!hasAllowList(fileBoundary)) {
    return false;
  }
  return fileBoundary.allowImportsFrom!.some((id) =>
    matchesBoundaryIdentifier(id, targetBoundary),
  );
}

