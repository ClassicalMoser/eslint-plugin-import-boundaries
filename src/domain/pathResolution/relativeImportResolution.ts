/**
 * Relative import resolution (e.g., ./file, ../parent).
 */

import path from 'node:path';
import { hasExtension } from '@domain/path';

/**
 * Resolve relative import (e.g., ./file, ../parent).
 */
export function resolveRelativeImport(
  rawSpec: string,
  fileDir: string,
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  if (!hasExtension(rawSpec, fileExtensions)) {
    const basename = path.basename(rawSpec);

    // Special case: ./index or ./barrelFileName refers to same directory's index file
    // (ancestor barrel - forbidden)
    if (basename === barrelFileName) {
      const resolvedPath = path.resolve(fileDir, rawSpec);
      const normalizedSpec = path.normalize(rawSpec);
      if (
        normalizedSpec === `./${barrelFileName}` ||
        normalizedSpec === barrelFileName
      ) {
        // Same directory's index file (ancestor barrel)
        const targetDir = fileDir;
        const targetAbs = path.join(
          fileDir,
          `${barrelFileName}${fileExtensions[0]}`,
        );
        return { targetAbs, targetDir };
      } else {
        // Directory - assume barrel file
        const targetDir = resolvedPath;
        const targetAbs = path.join(
          targetDir,
          `${barrelFileName}${fileExtensions[0]}`,
        );
        return { targetAbs, targetDir };
      }
    } else {
      // Directory - assume barrel file
      const resolvedPath = path.resolve(fileDir, rawSpec);
      const targetDir = resolvedPath;
      const targetAbs = path.join(
        targetDir,
        `${barrelFileName}${fileExtensions[0]}`,
      );
      return { targetAbs, targetDir };
    }
  } else {
    // File with extension
    const targetAbs = path.resolve(fileDir, rawSpec);
    const targetDir = path.dirname(targetAbs);
    return { targetAbs, targetDir };
  }
}
