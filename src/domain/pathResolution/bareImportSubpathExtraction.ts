/**
 * Bare import subpath extraction.
 */

import type { Boundary } from '@shared';

/**
 * Extract subpath from bare import relative to matching boundary.
 */
export function extractBareImportSubpath(
  rawSpec: string,
  matchingBoundary: Boundary,
): string {
  if (rawSpec === matchingBoundary.dir) {
    return '';
  } else if (rawSpec.startsWith(`${matchingBoundary.dir}/`)) {
    return rawSpec.slice(matchingBoundary.dir.length + 1);
  } else {
    // Find the matching suffix and get the subpath
    const boundaryParts = matchingBoundary.dir.split('/');
    for (let i = boundaryParts.length - 1; i >= 0; i--) {
      const boundarySuffix = boundaryParts.slice(i).join('/');
      if (rawSpec.startsWith(`${boundarySuffix}/`)) {
        return rawSpec.slice(boundarySuffix.length + 1);
      } else if (rawSpec === boundarySuffix) {
        return '';
      }
    }
    return '';
  }
}
