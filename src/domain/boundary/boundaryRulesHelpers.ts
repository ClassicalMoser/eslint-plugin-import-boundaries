/**
 * Helper functions for boundaryRules.ts
 * Extracted to improve testability and reduce mutation opportunities.
 */

import type { Boundary } from '@shared';

/**
 * Check if a boundary has a non-empty allow list.
 * Type guard: if this returns true, allowImportsFrom is guaranteed to be a non-empty array.
 */
export function hasAllowList(
  boundary: Boundary,
): boundary is Boundary & { allowImportsFrom: string[] } {
  return Boolean(
    boundary.allowImportsFrom && boundary.allowImportsFrom.length > 0,
  );
}

/**
 * Check if a boundary has a non-empty deny list.
 * Type guard: if this returns true, denyImportsFrom is guaranteed to be a non-empty array.
 */
export function hasDenyList(
  boundary: Boundary,
): boundary is Boundary & { denyImportsFrom: string[] } {
  return Boolean(
    boundary.denyImportsFrom && boundary.denyImportsFrom.length > 0,
  );
}

/**
 * Check if a target boundary is in the deny list.
 *
 * @param fileBoundary - The boundary to check
 * @param targetBoundary - The target boundary to look for
 * @param matchesBoundaryIdentifier - Function to match boundary identifiers
 * @returns true if target is in deny list, false otherwise
 */
export function isInDenyList(
  fileBoundary: Boundary,
  targetBoundary: Boundary,
  matchesBoundaryIdentifier: (id: string, target: Boundary) => boolean,
): boolean {
  if (!hasDenyList(fileBoundary)) {
    return false;
  }
  // Type guard ensures denyImportsFrom exists and is non-empty
  return fileBoundary.denyImportsFrom.some((id) =>
    matchesBoundaryIdentifier(id, targetBoundary),
  );
}

/**
 * Check if a target boundary is in the allow list.
 *
 * @param fileBoundary - The boundary to check
 * @param targetBoundary - The target boundary to look for
 * @param matchesBoundaryIdentifier - Function to match boundary identifiers
 * @returns true if target is in allow list, false otherwise
 */
export function isInAllowList(
  fileBoundary: Boundary,
  targetBoundary: Boundary,
  matchesBoundaryIdentifier: (id: string, target: Boundary) => boolean,
): boolean {
  if (!hasAllowList(fileBoundary)) {
    return false;
  }
  // Type guard ensures allowImportsFrom exists and is non-empty
  return fileBoundary.allowImportsFrom.some((id) =>
    matchesBoundaryIdentifier(id, targetBoundary),
  );
}
