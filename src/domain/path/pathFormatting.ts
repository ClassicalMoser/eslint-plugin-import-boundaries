/**
 * Path formatting utilities for import path calculation.
 */

import type { Boundary } from '@shared';
import path from 'node:path';

/**
 * Format a path as a forward-slash path relative to rootDir.
 */
export function formatAbsolutePath(
  rootDir: string,
  ...pathSegments: string[]
): string {
  return path.join(rootDir, ...pathSegments).replace(/\\/g, '/');
}

/**
 * Convert an absolute file or directory path to a relative path from fileDir.
 * Used when boundary isn't enforced and path doesn't resolve to a boundary.
 * Removes file extensions as import paths typically don't include them.
 * Also removes index file names (e.g., /index) from directory imports.
 *
 * @param targetPath - Absolute file or directory path
 * @param fileDir - Directory containing the importing file
 * @param barrelFileName - Name of index file (typically 'index')
 * @returns Relative path from fileDir (e.g., './helper' or '../utils/helper')
 */
export function absoluteToRelativePath(
  targetPath: string,
  fileDir: string,
  barrelFileName: string = 'index',
): string {
  // Get relative path from file directory
  const relativeFromFile = path.relative(fileDir, targetPath);
  // Normalize to forward slashes
  const normalized = relativeFromFile.replace(/\\/g, '/');

  // Ensure it starts with ./ if it's in the same directory or a subdirectory
  // (Node.js requires explicit relative paths)
  let result = normalized;
  if (!result.startsWith('.')) {
    result = `./${result}`;
  }

  // Check if this is a directory (no extension) or a file (has extension)
  const ext = path.extname(normalized);
  if (ext) {
    // File path: remove extension
    result = result.slice(0, -ext.length);
    // Remove index file name if path ends with it (e.g., /index)
    const basename = path.basename(result);
    if (basename === barrelFileName) {
      // Remove the barrel file name and preceding slash
      const dirname = path.dirname(result);
      if (dirname === '.' || dirname === './') {
        // If dirname is '.', the barrel file is in the same directory
        result = './';
      } else {
        // Normalize dirname: replace backslashes
        // Since result already starts with ./ or ../ (from line 42-44), dirname preserves it
        result = dirname.replace(/\\/g, '/');
      }
    }
  }
  // Note: If no extension, result already starts with ./ from line 42-44, so no additional check needed

  return result;
}

/**
 * Choose between alias and absolute path based on crossBoundaryStyle.
 * Returns the appropriate path format for same-boundary imports.
 */
export function choosePathFormat(
  boundary: Boundary,
  segment: string,
  rootDir: string,
  crossBoundaryStyle: 'alias' | 'absolute',
): string {
  if (crossBoundaryStyle === 'absolute') {
    return formatAbsolutePath(rootDir, boundary.dir, segment);
  }
  // Alias style: use alias if available
  if (boundary.alias) {
    return `${boundary.alias}/${segment}`;
  }
  // Fallback: use absolute path if no alias
  return formatAbsolutePath(rootDir, boundary.dir, segment);
}
