/**
 * Import path calculation based on file relationships.
 * Determines the correct import path format (alias, absolute, relative) based on
 * the relationship between the importing file and the target.
 */

import type { Boundary } from './types';
import path from 'node:path';
import { getBasenameWithoutExt } from './pathUtils';
import { choosePathFormat, formatAbsolutePath } from './pathFormatting';

/**
 * Calculate path for cross-boundary imports.
 */
export function calculateCrossBoundaryPath(
  targetBoundary: Boundary | null,
  rootDir: string,
  crossBoundaryStyle: 'alias' | 'absolute',
): string | 'UNKNOWN_BOUNDARY' {
  if (!targetBoundary) {
    return 'UNKNOWN_BOUNDARY';
  }

  if (crossBoundaryStyle === 'absolute') {
    return formatAbsolutePath(rootDir, targetBoundary.dir);
  }

  // Alias style requires alias to be present
  if (!targetBoundary.alias) {
    // This shouldn't happen if validation is correct, but handle gracefully
    return formatAbsolutePath(rootDir, targetBoundary.dir);
  }

  return targetBoundary.alias;
}

/**
 * Check if import is an ancestor barrel (forbidden).
 */
export function checkAncestorBarrel(
  rawSpec: string,
  fileBoundary: Boundary,
  rootDir: string,
  crossBoundaryStyle: 'alias' | 'absolute',
): boolean {
  if (crossBoundaryStyle === 'alias') {
    return fileBoundary.alias !== null && rawSpec === fileBoundary.alias;
  } else {
    // Absolute style: check if rawSpec matches the absolute path to boundary root
    const boundaryAbsPath = formatAbsolutePath(rootDir, fileBoundary.dir);
    return rawSpec === boundaryAbsPath || rawSpec === `${boundaryAbsPath}/`;
  }
}

/**
 * Convert boundary-relative paths to arrays for comparison.
 */
function pathToParts(relativePath: string): string[] {
  return relativePath === '' || relativePath === '.'
    ? []
    : relativePath.split(path.sep).filter((p) => p && p !== '.');
}

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
 * Calculate path for boundary root file (target at boundary root).
 */
export function calculateBoundaryRootPath(
  targetAbs: string,
  fileBoundary: Boundary,
  rootDir: string,
  barrelFileName: string,
  crossBoundaryStyle: 'alias' | 'absolute',
): string | null {
  const targetBasename = getBasenameWithoutExt(targetAbs);
  if (targetBasename !== barrelFileName) {
    return choosePathFormat(
      fileBoundary,
      targetBasename,
      rootDir,
      crossBoundaryStyle,
    );
  }
  return null; // Ancestor barrel
}

/**
 * Calculate path for same directory file.
 */
export function calculateSameDirectoryPath(
  targetAbs: string,
  barrelFileName: string,
): string | null {
  const targetBasename = getBasenameWithoutExt(targetAbs);
  if (targetBasename !== barrelFileName) {
    return `./${targetBasename}`;
  }
  return null; // Ancestor barrel (barrel file in same directory)
}

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
  if (targetParts.length === 0) {
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
  if (
    firstDifferingIndex >= targetParts.length &&
    firstDifferingIndex >= fileParts.length
  ) {
    return calculateSameDirectoryPath(targetAbs, barrelFileName);
  }

  // Get first differing segment (only - we assume barrel files)
  const firstDifferingSegment = targetParts[firstDifferingIndex];
  if (!firstDifferingSegment) {
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

