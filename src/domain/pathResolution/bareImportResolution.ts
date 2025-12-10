/**
 * Bare import resolution (e.g., entities/army).
 */

import type { Boundary } from '@shared';
import path from 'node:path';
import { hasExtension } from '@domain/path';
import { extractBareImportSubpath } from './bareImportSubpathExtraction';
import { findMatchingBoundary } from './boundaryMatching';

/**
 * Resolve bare import (e.g., entities/army) that matches a boundary.
 */
export function resolveBareImport(
  rawSpec: string,
  boundaries: Boundary[],
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  const matchingBoundary = findMatchingBoundary(rawSpec, boundaries);
  if (!matchingBoundary) {
    // Doesn't match any boundary - external package
    return { targetAbs: '', targetDir: '' };
  }

  const subpath = extractBareImportSubpath(rawSpec, matchingBoundary);

  if (subpath && !hasExtension(subpath, fileExtensions)) {
    // Directory - assume barrel file
    const targetDir = path.resolve(matchingBoundary.absDir, subpath);
    const targetAbs = path.join(
      targetDir,
      `${barrelFileName}${fileExtensions[0]}`,
    );
    return { targetAbs, targetDir };
  } else if (subpath) {
    // File with extension
    const targetAbs = path.resolve(matchingBoundary.absDir, subpath);
    const targetDir = path.dirname(targetAbs);
    return { targetAbs, targetDir };
  } else {
    // Just boundary dir (no subpath) - ancestor barrel
    const targetAbs = path.join(
      matchingBoundary.absDir,
      `${barrelFileName}${fileExtensions[0]}`,
    );
    return { targetAbs, targetDir: matchingBoundary.absDir };
  }
}
