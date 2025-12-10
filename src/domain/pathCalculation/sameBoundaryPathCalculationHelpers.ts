/**
 * Helper functions for sameBoundaryPathCalculation.ts
 * Extracted to improve testability and reduce mutation opportunities.
 */

/**
 * Check if target is at boundary root (empty parts array).
 */
export function isBoundaryRoot(targetParts: string[]): boolean {
  return targetParts.length === 0;
}

/**
 * Check if both paths are exhausted (same directory case).
 */
export function areBothPathsExhausted(
  firstDifferingIndex: number,
  targetParts: string[],
  fileParts: string[],
): boolean {
  return (
    firstDifferingIndex >= targetParts.length &&
    firstDifferingIndex >= fileParts.length
  );
}

/**
 * Check if first differing segment is valid (not falsy).
 */
export function hasValidFirstDifferingSegment(
  firstDifferingSegment: string | undefined,
): firstDifferingSegment is string {
  return Boolean(firstDifferingSegment);
}
