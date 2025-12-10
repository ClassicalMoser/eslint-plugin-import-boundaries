/**
 * External package detection.
 */

/**
 * Check if the target is an external package (not in any boundary).
 */
export function isExternalPackage(targetAbs: string): boolean {
  return !targetAbs;
}
