/**
 * Cross-boundary path calculation.
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { absoluteToRelativePath, formatAbsolutePath } from '@domain/path';

/**
 * Determine if targetBoundary is a direct ancestor of fileBoundary.
 * Used for nestedPathFormat: when a nested boundary imports from its parent.
 */
function isParentBoundary(
  fileBoundary: Boundary,
  targetBoundary: Boundary,
): boolean {
  return (
    fileBoundary.absDir.length > targetBoundary.absDir.length &&
    fileBoundary.absDir.startsWith(targetBoundary.absDir + path.sep)
  );
}

/**
 * Calculate path for cross-boundary imports.
 *
 * Supports nestedPathFormat on the file's boundary:
 * - 'relative': use a relative path when importing from a parent boundary
 * - 'alias': use alias path (regardless of crossBoundaryStyle)
 * - 'inherit' or undefined: use crossBoundaryStyle default
 */
export function calculateCrossBoundaryPath(
  targetBoundary: Boundary | null,
  fileBoundary: Boundary | null,
  fileDir: string,
  targetDir: string,
  rootDir: string,
  crossBoundaryStyle: 'alias' | 'absolute',
  barrelFileName: string,
): string | 'UNKNOWN_BOUNDARY' {
  if (!targetBoundary) {
    return 'UNKNOWN_BOUNDARY';
  }

  // Apply nestedPathFormat when the file's boundary explicitly configures it
  // and the target is a parent boundary of the file's boundary.
  if (
    fileBoundary?.nestedPathFormat &&
    fileBoundary.nestedPathFormat !== 'inherit' &&
    isParentBoundary(fileBoundary, targetBoundary)
  ) {
    if (fileBoundary.nestedPathFormat === 'relative') {
      return absoluteToRelativePath(targetDir, fileDir, barrelFileName);
    }
    if (fileBoundary.nestedPathFormat === 'alias') {
      if (targetBoundary.alias) return targetBoundary.alias;
      return formatAbsolutePath(rootDir, targetBoundary.dir);
    }
  }

  if (crossBoundaryStyle === 'absolute') {
    return formatAbsolutePath(rootDir, targetBoundary.dir);
  }

  // Alias style requires alias to be present
  if (!targetBoundary.alias) {
    // Handle gracefully: fall back to absolute path
    return formatAbsolutePath(rootDir, targetBoundary.dir);
  }

  return targetBoundary.alias;
}
