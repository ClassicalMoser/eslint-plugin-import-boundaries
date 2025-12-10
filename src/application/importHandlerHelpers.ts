/**
 * Helper functions for import handler logic.
 * Extracted to improve testability and reduce mutation opportunities.
 */

import type { Boundary } from '@shared';

/**
 * Check if alias subpath validation should be performed.
 * This is only needed when using alias style for cross-boundary imports.
 */
export function shouldValidateAliasSubpath(
  crossBoundaryStyle: 'alias' | 'absolute',
): boolean {
  return crossBoundaryStyle === 'alias';
}

/**
 * Check if boundary rules should be validated.
 * Rules are checked when:
 * - Not skipping boundary rules
 * - File boundary exists
 * - Target boundary exists
 * - Boundaries are different (same-boundary imports don't need rule checks)
 */
export function shouldValidateBoundaryRules(
  skipBoundaryRules: boolean,
  fileBoundary: Boundary | null,
  targetBoundary: Boundary | null,
): boolean {
  return (
    !skipBoundaryRules &&
    fileBoundary !== null &&
    targetBoundary !== null &&
    fileBoundary !== targetBoundary
  );
}

/**
 * Check if ancestor barrel detection should be performed.
 * Only needed when file boundary exists and correctPath is null.
 */
export function shouldDetectAncestorBarrel(
  correctPath: string | null,
  fileBoundary: Boundary | null,
): boolean {
  return correctPath === null && fileBoundary !== null;
}

/**
 * Check if correctPath indicates an unknown boundary.
 */
export function isUnknownBoundary(correctPath: string | null): boolean {
  return correctPath === 'UNKNOWN_BOUNDARY';
}

/**
 * Check if correctPath is null (ancestor barrel or edge case).
 */
export function isNullPath(correctPath: string | null): boolean {
  return correctPath === null;
}

/**
 * Check if correctPath is a valid non-empty string path.
 * Used to ensure we don't pass invalid paths to validation functions.
 * Type guard: if this returns true, correctPath is guaranteed to be a non-empty string.
 */
export function isValidPath(correctPath: string | null): correctPath is string {
  return (
    correctPath !== null &&
    correctPath !== 'UNKNOWN_BOUNDARY' &&
    correctPath.trim().length > 0
  );
}
