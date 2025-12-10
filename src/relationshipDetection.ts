/**
 * Simplified import path calculation.
 * Main entry point that orchestrates target path resolution and import path calculation.
 */

import type { Boundary } from './types';
import { resolveToBoundary } from './boundaryDetection';
import {
  calculateCrossBoundaryPath,
  calculateSameBoundaryPath,
  checkAncestorBarrel,
} from './importPathCalculation';
import { resolveTargetPath } from './targetPathResolution';

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
  barrelFileName: string = 'index',
  fileExtensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
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
  if (!fileBoundary || targetBoundary !== fileBoundary) {
    return calculateCrossBoundaryPath(
      targetBoundary,
      rootDir,
      crossBoundaryStyle,
    );
  }

  // 2. Ancestor barrel: forbidden
  if (checkAncestorBarrel(rawSpec, fileBoundary, rootDir, crossBoundaryStyle)) {
    return null; // Handled separately (not fixable)
  }

  // 3. Same boundary: calculate path based on relationship
  return calculateSameBoundaryPath(
    targetDir,
    targetAbs,
    fileDir,
    fileBoundary,
    rootDir,
    barrelFileName,
    crossBoundaryStyle,
  );
}

// Re-export for backward compatibility
export {
  calculateBoundaryRootPath,
  calculateCrossBoundaryPath,
  calculateDistantPath,
  calculateSameBoundaryPath,
  calculateSameDirectoryPath,
  checkAncestorBarrel,
} from './importPathCalculation';

export {
  extractBareImportSubpath,
  findMatchingBoundary,
  resolveAbsoluteImport,
  resolveAliasImport,
  resolveBareImport,
  resolveRelativeImport,
  resolveTargetPath,
} from './targetPathResolution';
