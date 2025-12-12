/**
 * Same directory path calculation.
 */

import { getBasenameWithoutExt } from '@domain/path';

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
  return null; // Ancestor directory (index file in same directory)
}
