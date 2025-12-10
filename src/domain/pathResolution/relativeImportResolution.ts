/**
 * Relative import resolution (e.g., ./file, ../parent).
 *
 * Resolves relative import specifiers (starting with './' or '../').
 * Handles special case of ancestor barrel detection (./index).
 */

import path from 'node:path';
import { getBarrelPath, hasExtension } from '@domain/path';
import { resolveTarget } from './resolveTarget';

/**
 * Resolve relative import (e.g., ./file, ../parent).
 *
 * Relative imports are resolved relative to the file's directory.
 * Special handling for ancestor barrel detection: './index' or './barrelFileName'
 * refers to the same directory's barrel file, which is forbidden.
 *
 * @param rawSpec - Import specifier (e.g., './file', '../parent')
 * @param fileDir - Directory containing the importing file
 * @param barrelFileName - Name of barrel file (typically 'index')
 * @param fileExtensions - Array of file extensions to check for
 * @returns Object with targetAbs (absolute path) and targetDir (directory)
 */
export function resolveRelativeImport(
  rawSpec: string,
  fileDir: string,
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  // Check if this is a directory import (no extension)
  if (!hasExtension(rawSpec, fileExtensions)) {
    const basename = path.basename(rawSpec);

    // Special case: ./index or ./barrelFileName refers to same directory's index file
    // This is an ancestor barrel import (forbidden) - detect it explicitly
    if (basename === barrelFileName) {
      const normalizedSpec = path.normalize(rawSpec);
      if (
        normalizedSpec === `./${barrelFileName}` ||
        normalizedSpec === barrelFileName
      ) {
        // Same directory's index file (ancestor barrel)
        // Return explicitly so ancestor barrel detection can catch it
        return {
          targetAbs: getBarrelPath(fileDir, barrelFileName, fileExtensions),
          targetDir: fileDir,
        };
      }
      // Fall through to normal directory resolution
    }

    // Normal directory import - use shared resolution logic
    return resolveTarget(fileDir, rawSpec, barrelFileName, fileExtensions);
  }

  // File with extension - use shared resolution logic
  return resolveTarget(fileDir, rawSpec, barrelFileName, fileExtensions);
}
