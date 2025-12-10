/**
 * Boundary root path calculation.
 */

import type { Boundary } from '@shared';
import { choosePathFormat, getBasenameWithoutExt } from '@domain/path';

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
