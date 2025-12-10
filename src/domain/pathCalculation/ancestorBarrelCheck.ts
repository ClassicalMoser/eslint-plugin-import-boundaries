/**
 * Ancestor barrel detection.
 */

import type { Boundary } from '@shared';
import { formatAbsolutePath } from '@domain/path';

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
