/**
 * Same-boundary path calculation.
 *
 * Calculates the correct import path for imports within the same boundary.
 * Handles same-directory, cousin, top-level, and distant imports.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { pathToParts } from '@domain/path';
import { calculateBoundaryRootPath } from './boundaryRootPathCalculation';
import { calculateDistantPath } from './distantPathCalculation';
import {
  areBothPathsExhausted,
  hasValidFirstDifferingSegment,
  isBoundaryRoot,
} from './sameBoundaryPathCalculationHelpers';
import { calculateSameDirectoryPath } from './sameDirectoryPathCalculation';

/**
 * Find first differing segment between target and file paths.
 */
function findFirstDifferingIndex(
  targetParts: string[],
  fileParts: string[],
): number {
  let firstDifferingIndex = 0;
  while (
    firstDifferingIndex < targetParts.length &&
    firstDifferingIndex < fileParts.length &&
    targetParts[firstDifferingIndex] === fileParts[firstDifferingIndex]
  ) {
    firstDifferingIndex++;
  }
  return firstDifferingIndex;
}

/**
 * Calculate path for same-boundary imports.
 */
export function calculateSameBoundaryPath(
  targetDir: string,
  targetAbs: string,
  fileDir: string,
  fileBoundary: Boundary,
  rootDir: string,
  barrelFileName: string,
  crossBoundaryStyle: 'alias' | 'absolute',
): string | null {
  // Resolve both to boundary-relative paths (as arrays)
  const targetRelativeToBoundary = path.relative(
    fileBoundary.absDir,
    targetDir,
  );
  const fileRelativeToBoundary = path.relative(fileBoundary.absDir, fileDir);

  // Convert to arrays for easy comparison
  const targetParts = pathToParts(targetRelativeToBoundary);
  const fileParts = pathToParts(fileRelativeToBoundary);

  // Handle boundary root file (target is at boundary root)
  if (isBoundaryRoot(targetParts)) {
    return calculateBoundaryRootPath(
      targetAbs,
      fileBoundary,
      rootDir,
      barrelFileName,
      crossBoundaryStyle,
    );
  }

  // Find first differing segment using array comparison
  const firstDifferingIndex = findFirstDifferingIndex(targetParts, fileParts);

  // Same directory: both paths exhausted, filename is the differing segment
  if (areBothPathsExhausted(firstDifferingIndex, targetParts, fileParts)) {
    return calculateSameDirectoryPath(targetAbs, barrelFileName);
  }

  // Get first differing segment (only - we assume barrel files)
  const firstDifferingSegment = targetParts[firstDifferingIndex];
  if (!hasValidFirstDifferingSegment(firstDifferingSegment)) {
    return null;
  }

  return calculateDistantPath(
    targetParts,
    fileParts,
    firstDifferingIndex,
    firstDifferingSegment,
    fileBoundary,
    rootDir,
    crossBoundaryStyle,
  );
}
