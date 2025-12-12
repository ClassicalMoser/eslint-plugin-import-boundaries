/**
 * Simplified import path calculation.
 * Main entry point that orchestrates target path resolution and import path calculation.
 */

import type { Boundary } from '@shared';
import { resolveToBoundary } from '@domain/boundary';
import { absoluteToRelativePath, getBasenameWithoutExt } from '@domain/path';
import {
  calculateCrossBoundaryPath,
  calculateSameBoundaryPath,
} from '@domain/pathCalculation';
import { resolveTargetPath } from '@domain/pathResolution';
import {
  DEFAULT_BARREL_FILE_NAME,
  DEFAULT_CROSS_BOUNDARY_STYLE,
  getDefaultFileExtensions,
} from './relationshipDetectionDefaults';
import {
  isAncestorBarrelImport,
  isCrossBoundaryImport,
} from './relationshipDetectionHelpers';

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
  crossBoundaryStyle: 'alias' | 'absolute' = DEFAULT_CROSS_BOUNDARY_STYLE,
  barrelFileName: string = DEFAULT_BARREL_FILE_NAME,
  fileExtensions: string[] = getDefaultFileExtensions(),
): string | null {
  // Resolve target path
  const { targetAbs, targetDir } = resolveTargetPath(
    rawSpec,
    fileDir,
    boundaries,
    rootDir,
    cwd,
    barrelFileName,
    fileExtensions,
  );

  // Resolve target to nearest boundary (even if it has no rules)
  const targetBoundary = resolveToBoundary(targetAbs, boundaries);

  // 1. Cross-boundary: use @boundary (no subpath) or absolute path
  if (isCrossBoundaryImport(fileBoundary, targetBoundary)) {
    // Special case: boundary isn't enforced (fileBoundary is null) and
    // path doesn't resolve to a boundary (targetBoundary is null).
    // In such cases, convert to relative path from fileDir instead of UNKNOWN_BOUNDARY.
    // Only applies when targetAbs is not empty (internal file, not external package).
    if (fileBoundary === null && targetBoundary === null && targetAbs) {
      // Use targetDir if target is an index file to avoid /index loops
      // Check if targetAbs ends with barrelFileName (e.g., /index.ts)
      const basenameWithoutExt = getBasenameWithoutExt(targetAbs);
      const pathToUse =
        basenameWithoutExt === barrelFileName ? targetDir : targetAbs;
      return absoluteToRelativePath(pathToUse, fileDir, barrelFileName);
    }
    return calculateCrossBoundaryPath(
      targetBoundary,
      rootDir,
      crossBoundaryStyle,
    );
  }

  // 2. Ancestor directory: forbidden (same-boundary only)
  // Early return if ancestor directory import detected
  // At this point, fileBoundary is guaranteed to be non-null (same-boundary check above)
  if (
    isAncestorBarrelImport(rawSpec, fileBoundary!, rootDir, crossBoundaryStyle)
  ) {
    return null; // Handled separately (not fixable)
  }

  // 3. Same boundary: calculate path based on relationship
  // At this point, fileBoundary is guaranteed to be non-null (same-boundary check above)
  return calculateSameBoundaryPath(
    targetDir,
    targetAbs,
    fileDir,
    fileBoundary!,
    rootDir,
    barrelFileName,
    crossBoundaryStyle,
  );
}

// Re-export for backward compatibility
export * from '@domain/pathCalculation';
export * from '@domain/pathResolution';
