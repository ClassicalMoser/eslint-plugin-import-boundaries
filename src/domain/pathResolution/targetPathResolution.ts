/**
 * Target path resolution from import specifiers.
 * Dispatches to specific resolution functions based on import type.
 */

import type { Boundary } from '@shared';
import { resolveAbsoluteImport } from './absoluteImportResolution';
import { resolveAliasImport } from './aliasImportResolution';
import { resolveBareImport } from './bareImportResolution';
import { resolveRelativeImport } from './relativeImportResolution';

/**
 * Resolve the target path from an import specifier.
 */
export function resolveTargetPath(
  rawSpec: string,
  fileDir: string,
  boundaries: Boundary[],
  rootDir: string,
  cwd: string,
  barrelFileName: string = 'index',
  fileExtensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
): { targetAbs: string; targetDir: string } {
  if (rawSpec.startsWith('@')) {
    return resolveAliasImport(
      rawSpec,
      boundaries,
      barrelFileName,
      fileExtensions,
    );
  } else if (rawSpec.startsWith('.')) {
    return resolveRelativeImport(
      rawSpec,
      fileDir,
      barrelFileName,
      fileExtensions,
    );
  } else if (rawSpec.startsWith(rootDir)) {
    return resolveAbsoluteImport(rawSpec, cwd, barrelFileName, fileExtensions);
  } else {
    return resolveBareImport(
      rawSpec,
      boundaries,
      barrelFileName,
      fileExtensions,
    );
  }
}

// Re-export for backward compatibility
export { resolveAbsoluteImport } from './absoluteImportResolution';
export { resolveAliasImport } from './aliasImportResolution';
export { resolveBareImport } from './bareImportResolution';
export { extractBareImportSubpath } from './bareImportSubpathExtraction';
export { findMatchingBoundary } from './boundaryMatching';
export { resolveRelativeImport } from './relativeImportResolution';
