/**
 * Helper functions for boundaryMatching.ts
 * Extracted to improve testability and reduce mutation opportunities.
 */

/**
 * Check if boundary dir matches (exact or prefix match).
 */
export function matchesBoundaryDir(
  rawSpec: string,
  boundaryDir: string,
): boolean {
  return rawSpec === boundaryDir || rawSpec.startsWith(`${boundaryDir}/`);
}

/**
 * Check if rawSpec or boundaryDir is empty (skip suffix matching).
 */
export function hasEmptyPath(rawSpec: string, boundaryDir: string): boolean {
  return rawSpec.length === 0 || boundaryDir.length === 0;
}

/**
 * Check if rawSpec matches a suffix of boundaryDir.
 * Tries matching from the end of boundaryDir (e.g., 'entities/army' matches 'domain/entities').
 */
export function matchesBoundarySuffix(
  rawSpec: string,
  boundaryDir: string,
): boolean {
  const boundaryParts = boundaryDir.split('/');
  // Check if import starts with the last segment(s) of boundary dir
  // Try matching from the end of boundary dir
  for (let i = boundaryParts.length - 1; i >= 0; i--) {
    const boundarySuffix = boundaryParts.slice(i).join('/');
    if (
      rawSpec === boundarySuffix ||
      rawSpec.startsWith(`${boundarySuffix}/`)
    ) {
      return true;
    }
  }
  return false;
}
