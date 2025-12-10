/**
 * Boundary matching for bare imports.
 */

import type { Boundary } from '@shared';
import {
  hasEmptyPath,
  matchesBoundaryDir,
  matchesBoundarySuffix,
} from './boundaryMatchingHelpers';

/**
 * Find matching boundary for bare import (e.g., entities/army).
 */
export function findMatchingBoundary(
  rawSpec: string,
  boundaries: Boundary[],
): Boundary | null {
  const matchingBoundary = boundaries.find((b) => {
    // Check if import starts with boundary dir (e.g., 'domain/entities/army' matches 'domain/entities')
    if (matchesBoundaryDir(rawSpec, b.dir)) {
      return true;
    }
    // Check if import matches a suffix of boundary dir (e.g., 'entities/army' matches 'domain/entities')
    // This handles path mappings like 'entities' -> 'src/domain/entities'
    // Skip if either is empty (no parts to match)
    if (hasEmptyPath(rawSpec, b.dir)) {
      return false;
    }
    // Check if import starts with the last segment(s) of boundary dir
    return matchesBoundarySuffix(rawSpec, b.dir);
  });

  return matchingBoundary ?? null;
}
