/**
 * Boundary matching for bare imports.
 */

import type { Boundary } from '@shared';

/**
 * Find matching boundary for bare import (e.g., entities/army).
 */
export function findMatchingBoundary(
  rawSpec: string,
  boundaries: Boundary[],
): Boundary | null {
  return (
    boundaries.find((b) => {
      // Check if import starts with boundary dir (e.g., 'domain/entities/army' matches 'domain/entities')
      if (rawSpec === b.dir || rawSpec.startsWith(`${b.dir}/`)) {
        return true;
      }
      // Check if import matches a suffix of boundary dir (e.g., 'entities/army' matches 'domain/entities')
      // This handles path mappings like 'entities' -> 'src/domain/entities'
      const boundaryParts = b.dir.split('/');
      const importParts = rawSpec.split('/');
      // Check if import starts with the last segment(s) of boundary dir
      if (importParts.length > 0 && boundaryParts.length > 0) {
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
      }
      return false;
    }) || null
  );
}
