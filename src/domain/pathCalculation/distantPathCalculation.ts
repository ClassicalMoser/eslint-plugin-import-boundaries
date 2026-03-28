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
  maxRelativeDepth: number = 1,
): string {
  // If first differing segment is at fileParts.length, it's a sibling (same parent directory)
  // This includes siblings at boundary root level (fileParts.length === 0, firstDifferingIndex === 0)
  // and subdirectories (fileParts.length > 0, firstDifferingIndex === fileParts.length)
  if (firstDifferingIndex === fileParts.length) {
    // Sibling or subdirectory - use relative path to prevent circular dependencies through boundary index
    return `./${firstDifferingSegment}`;
  }

  // Top-level: target is at boundary root level (targetParts.length === 1)
  // AND file is in a subdirectory (fileParts.length > 0)
  // Always use alias/absolute path regardless of maxRelativeDepth (architectural boundary)
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

  // Calculate number of '../' steps needed to reach the differing segment
  const steps = fileParts.length - firstDifferingIndex;
  if (steps <= maxRelativeDepth) {
    // Within allowed relative depth: use relative path (e.g., ../segment or ../../segment)
    return '../'.repeat(steps) + firstDifferingSegment;
  }

  // Exceeds maxRelativeDepth → use alias/absolute path (first differing segment only)
  return choosePathFormat(
    fileBoundary,
    firstDifferingSegment,
    rootDir,
    crossBoundaryStyle,
  );
}
