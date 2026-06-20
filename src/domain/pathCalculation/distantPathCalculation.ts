/**
 * Distant path calculation (cousin, top-level, etc.).
 */

import type { Boundary } from '@shared';
import {
  choosePathFormat,
  getBasenameWithoutExt,
  getBoundaryImportSubpath,
} from '@domain/path';

/**
 * Compute the path suffix from the common ancestor downward to the target.
 */
function getRelativeTargetSuffix(
  targetParts: string[],
  firstDifferingIndex: number,
  targetAbs: string,
  barrelFileName: string,
): string {
  const dirParts = targetParts.slice(firstDifferingIndex);
  const basename = getBasenameWithoutExt(targetAbs);

  if (basename === barrelFileName) {
    return dirParts.join('/');
  }

  if (dirParts.length === 0) {
    return basename;
  }

  return `${dirParts.join('/')}/${basename}`;
}

/**
 * Calculate path for distant imports (cousin, top-level, etc.).
 */
export function calculateDistantPath(
  targetParts: string[],
  fileParts: string[],
  firstDifferingIndex: number,
  targetAbs: string,
  targetDir: string,
  fileBoundary: Boundary,
  rootDir: string,
  barrelFileName: string,
  crossBoundaryStyle: 'alias' | 'absolute',
  maxRelativeDepth: number = 1,
): string {
  const relativeSuffix = getRelativeTargetSuffix(
    targetParts,
    firstDifferingIndex,
    targetAbs,
    barrelFileName,
  );
  const boundarySubpath = getBoundaryImportSubpath(
    targetAbs,
    targetDir,
    fileBoundary,
    barrelFileName,
  );

  // If first differing segment is at fileParts.length, it's a sibling (same parent directory)
  // This includes siblings at boundary root level (fileParts.length === 0, firstDifferingIndex === 0)
  // and subdirectories (fileParts.length > 0, firstDifferingIndex === fileParts.length)
  if (firstDifferingIndex === fileParts.length) {
    // Sibling or subdirectory - use relative path to prevent circular dependencies through boundary index
    return `./${relativeSuffix}`;
  }

  // Top-level: target is a direct child of the boundary root (targetParts.length === 1)
  // AND file is in a different branch (firstDifferingIndex === 0)
  // Always use alias/absolute path regardless of maxRelativeDepth (architectural boundary)
  const isTopLevel =
    targetParts.length === 1 &&
    fileParts.length > 0 &&
    firstDifferingIndex === 0;
  if (isTopLevel) {
    return choosePathFormat(
      fileBoundary,
      boundarySubpath,
      rootDir,
      crossBoundaryStyle,
    );
  }

  // Calculate number of '../' steps needed to reach the differing segment
  const steps = fileParts.length - firstDifferingIndex;
  if (steps <= maxRelativeDepth) {
    // Within allowed relative depth: use relative path (e.g., ../segment or ../../segment)
    return '../'.repeat(steps) + relativeSuffix;
  }

  // Exceeds maxRelativeDepth → use alias/absolute path with full boundary subpath
  return choosePathFormat(
    fileBoundary,
    boundarySubpath,
    rootDir,
    crossBoundaryStyle,
  );
}
