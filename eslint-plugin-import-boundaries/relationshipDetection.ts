/**
 * Simplified import path calculation.
 * Algorithm:
 * 1. Resolve both file and target to boundary-relative paths (as arrays)
 * 2. Compare arrays to find first differing segment
 * 3. Determine correct import path based on relationship
 */

import type { Boundary } from './types';
import path from 'node:path';
import { isInsideDir } from './pathUtils';

/**
 * Resolve the target path from an import specifier.
 */
export function resolveTargetPath(
  rawSpec: string,
  fileDir: string,
  boundaries: Boundary[],
  rootDir: string,
  cwd: string,
): { targetAbs: string; targetDir: string } {
  let targetAbs: string;
  let targetDir: string;

  if (rawSpec.startsWith('@')) {
    // Alias import - resolve via boundary
    const boundary = boundaries.find(
      (b) => rawSpec === b.alias || rawSpec.startsWith(`${b.alias}/`),
    );
    if (boundary) {
      const subpath = rawSpec.slice(boundary.alias.length + 1); // Remove '@boundary/'
      if (subpath && !subpath.endsWith('.ts')) {
        // Directory - assume barrel file
        targetDir = path.resolve(boundary.absDir, subpath);
        targetAbs = path.join(targetDir, 'index.ts');
      } else if (subpath) {
        targetAbs = path.resolve(boundary.absDir, subpath);
        targetDir = path.dirname(targetAbs);
      } else {
        // Just @boundary (no subpath) - ancestor barrel
        targetAbs = path.join(boundary.absDir, 'index.ts');
        targetDir = boundary.absDir;
      }
    } else {
      targetAbs = '';
      targetDir = '';
    }
  } else if (rawSpec.startsWith('.')) {
    // Relative import
    if (!rawSpec.endsWith('.ts')) {
      targetDir = path.resolve(fileDir, rawSpec);
      targetAbs = path.join(targetDir, 'index.ts');
    } else {
      targetAbs = path.resolve(fileDir, rawSpec);
      targetDir = path.dirname(targetAbs);
    }
  } else if (rawSpec.startsWith(rootDir)) {
    // Absolute path
    if (!rawSpec.endsWith('.ts')) {
      targetDir = path.resolve(cwd, rawSpec);
      targetAbs = path.join(targetDir, 'index.ts');
    } else {
      targetAbs = path.resolve(cwd, rawSpec);
      targetDir = path.dirname(targetAbs);
    }
  } else {
    targetAbs = '';
    targetDir = '';
  }

  return { targetAbs, targetDir };
}

/**
 * Calculate the correct import path using the simplified algorithm.
 */
export function calculateCorrectImportPath(
  rawSpec: string,
  fileDir: string,
  fileBoundary: Boundary | null,
  boundaries: Boundary[],
  rootDir: string,
  cwd: string,
  crossBoundaryStyle: 'alias' | 'absolute' = 'alias',
): string | null {
  // Resolve target path
  const { targetAbs, targetDir } = resolveTargetPath(
    rawSpec,
    fileDir,
    boundaries,
    rootDir,
    cwd,
  );

  // Find target boundary
  const targetBoundary =
    boundaries.find((b) => isInsideDir(b.absDir, targetAbs)) ?? null;

  // 1. Cross-boundary: use @boundary (no subpath) or absolute path
  if (!fileBoundary || targetBoundary !== fileBoundary) {
    if (targetBoundary) {
      if (crossBoundaryStyle === 'absolute') {
        // Use absolute path relative to rootDir (e.g., 'src/domain/entities')
        return path.join(rootDir, targetBoundary.dir).replace(/\\/g, '/');
      }
      return targetBoundary.alias;
    }
    // Target is outside all boundaries - return special marker
    return 'UNKNOWN_BOUNDARY';
  }

  // 2. Ancestor barrel: forbidden
  if (rawSpec === fileBoundary.alias) {
    return null; // Handled separately (not fixable)
  }

  // 3. Same boundary: resolve both to boundary-relative paths (as arrays)
  const targetRelativeToBoundary = path.relative(
    fileBoundary.absDir,
    targetDir,
  );
  const fileRelativeToBoundary = path.relative(fileBoundary.absDir, fileDir);

  // Convert to arrays for easy comparison
  // Normalize: empty string or '.' means boundary root (empty array)
  const targetParts =
    targetRelativeToBoundary === '' || targetRelativeToBoundary === '.'
      ? []
      : targetRelativeToBoundary.split(path.sep).filter((p) => p && p !== '.');
  const fileParts =
    fileRelativeToBoundary === '' || fileRelativeToBoundary === '.'
      ? []
      : fileRelativeToBoundary.split(path.sep).filter((p) => p && p !== '.');

  // Handle boundary root file (target is at boundary root)
  if (targetParts.length === 0) {
    const targetBasename = path.basename(targetAbs, '.ts');
    if (targetBasename !== 'index') {
      return `${fileBoundary.alias}/${targetBasename}`;
    }
    return null; // Ancestor barrel
  }

  // Find first differing segment using array comparison
  let firstDifferingIndex = 0;
  while (
    firstDifferingIndex < targetParts.length &&
    firstDifferingIndex < fileParts.length &&
    targetParts[firstDifferingIndex] === fileParts[firstDifferingIndex]
  ) {
    firstDifferingIndex++;
  }

  // Same directory: both paths exhausted, filename is the differing segment
  if (
    firstDifferingIndex >= targetParts.length &&
    firstDifferingIndex >= fileParts.length
  ) {
    const targetBasename = path.basename(targetAbs, '.ts');
    if (targetBasename !== 'index') {
      return `./${targetBasename}`;
    }
    return null; // Ancestor barrel (index.ts in same directory)
  }

  // Get first differing segment (only - we assume barrel files)
  const firstDifferingSegment = targetParts[firstDifferingIndex];
  if (!firstDifferingSegment) {
    return null;
  }

  // If first differing segment is at fileParts.length, it's in our directory (subdirectory)
  if (firstDifferingIndex === fileParts.length) {
    // Directory in our directory - use first differing segment only (barrel file)
    return `./${firstDifferingSegment}`;
  }

  // If first differing segment is at fileParts.length - 1, it's in our parent's directory (cousin)
  if (firstDifferingIndex === fileParts.length - 1) {
    const isTopLevel = firstDifferingIndex === 0;
    if (!isTopLevel) {
      // Cousin (parent's sibling, non-top-level) → ../segment (barrel file)
      return `../${firstDifferingSegment}`;
    }
    // Top-level → @boundary/segment (prefer alias even if ../ would work)
  }

  // Otherwise: top-level or requires >1 ../ → @boundary/segment (first differing segment only)
  return `${fileBoundary.alias}/${firstDifferingSegment}`;
}
