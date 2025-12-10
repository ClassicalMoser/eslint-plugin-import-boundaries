/**
 * Bare import resolution (e.g., entities/army).
 *
 * Resolves bare import specifiers (no '@', './', or '../' prefix) that match
 * boundary directory patterns. Used for path mappings like 'entities' → 'src/domain/entities'.
 */

import type { Boundary } from '@shared';
import { getBarrelPath } from '@domain/path';
import { extractBareImportSubpath } from './bareImportSubpathExtraction';
import { findMatchingBoundary } from './boundaryMatching';
import { resolveTarget } from './resolveTarget';

/**
 * Resolve bare import (e.g., entities/army) that matches a boundary.
 *
 * Bare imports don't have a prefix and match boundary directory patterns.
 * For example, 'entities/army' might match 'domain/entities' boundary.
 *
 * @param rawSpec - Import specifier (e.g., 'entities/army')
 * @param boundaries - Array of all configured boundaries
 * @param barrelFileName - Name of barrel file (typically 'index')
 * @param fileExtensions - Array of file extensions to check for
 * @returns Object with targetAbs (absolute path) and targetDir (directory),
 *          or empty strings if no matching boundary found
 */
export function resolveBareImport(
  rawSpec: string,
  boundaries: Boundary[],
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  // Find boundary matching this bare import pattern
  const matchingBoundary = findMatchingBoundary(rawSpec, boundaries);
  if (!matchingBoundary) {
    // Doesn't match any boundary - treat as external package
    return { targetAbs: '', targetDir: '' };
  }

  // Extract subpath relative to matching boundary
  const subpath = extractBareImportSubpath(rawSpec, matchingBoundary);

  // No subpath → boundary root (ancestor barrel if importing from same boundary)
  if (!subpath) {
    return {
      targetAbs: getBarrelPath(
        matchingBoundary.absDir,
        barrelFileName,
        fileExtensions,
      ),
      targetDir: matchingBoundary.absDir,
    };
  }

  // Has subpath → resolve relative to boundary root
  return resolveTarget(
    matchingBoundary.absDir,
    subpath,
    barrelFileName,
    fileExtensions,
  );
}
