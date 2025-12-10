/**
 * Distant path calculation (cousin, top-level, etc.).
 */

import type { Boundary } from '@shared';
import { choosePathFormat } from '@domain/path';

/**
 * Calculate path for distant imports (cousin, top-level, etc.).
 */
export function calculateDistantPath(
  targetParts: string[],
  fileParts: string[],
  firstDifferingIndex: number,
  firstDifferingSegment: string,
  fileBoundary: Boundary,
  rootDir: string,
  crossBoundaryStyle: 'alias' | 'absolute',
): string {
  // If first differing segment is at fileParts.length, it's in our directory (subdirectory)
  if (firstDifferingIndex === fileParts.length) {
    // Directory in our directory - use first differing segment only (barrel file)
    return `./${firstDifferingSegment}`;
  }

  // Top-level: target is at boundary root level (targetParts.length === 1)
  // AND file is in a subdirectory (fileParts.length > 0)
  // Use alias/absolute path (prefer alias even if ../ would work)
  // Note: If both are at root (fileParts.length === 0), they're siblings, handled above
  const isTopLevel = targetParts.length === 1 && fileParts.length > 0;
  if (isTopLevel) {
    return choosePathFormat(
      fileBoundary,
      firstDifferingSegment,
      rootDir,
      crossBoundaryStyle,
    );
  }

  // If first differing segment is at fileParts.length - 1, it's in our parent's directory (cousin)
  if (firstDifferingIndex === fileParts.length - 1) {
    // Cousin (parent's sibling, non-top-level) → ../segment (barrel file)
    return `../${firstDifferingSegment}`;
  }

  // Otherwise: requires >1 ../ → @boundary/segment (first differing segment only)
  return choosePathFormat(
    fileBoundary,
    firstDifferingSegment,
    rootDir,
    crossBoundaryStyle,
  );
}
