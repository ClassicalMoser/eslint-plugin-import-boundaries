/**
 * Barrel file path utilities.
 * Centralizes logic for constructing paths to barrel files (index.ts, etc.).
 */

import path from 'node:path';

/**
 * Construct the absolute path to a barrel file in a directory.
 *
 * Barrel files are typically `index.ts`, `index.js`, etc., and serve as
 * entry points for a directory/module. This function constructs the full
 * path to such a file.
 *
 * @param dir - The directory containing the barrel file
 * @param barrelFileName - The name of the barrel file (without extension), typically 'index'
 * @param fileExtensions - Array of file extensions to try, in priority order
 * @returns The absolute path to the barrel file
 *
 * @example
 * ```typescript
 * const barrelPath = getBarrelPath('/project/src/domain', 'index', ['.ts', '.js']);
 * // Returns: '/project/src/domain/index.ts'
 * ```
 */
export function getBarrelPath(
  dir: string,
  barrelFileName: string,
  fileExtensions: string[],
): string {
  // Use the first extension in the priority list
  return path.join(dir, `${barrelFileName}${fileExtensions[0]}`);
}
