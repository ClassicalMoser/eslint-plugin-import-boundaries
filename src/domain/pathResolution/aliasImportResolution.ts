/**
 * Alias import resolution (e.g., @boundary, @boundary/path).
 *
 * Resolves alias import specifiers (starting with '@') to their target paths.
 * Handles both boundary root imports (@boundary) and subpath imports (@boundary/path).
 */

import type { Boundary } from '@shared';
import { getBarrelPath } from '@domain/path';
import { resolveTarget } from './resolveTarget';

/**
 * Resolve alias import (e.g., @boundary, @boundary/path).
 *
 * Alias imports use boundary aliases (e.g., '@domain', '@application').
 * They can reference the boundary root (@boundary) or a subpath (@boundary/path).
 *
 * @param rawSpec - Import specifier (e.g., '@domain', '@domain/entities')
 * @param boundaries - Array of all configured boundaries
 * @param barrelFileName - Name of barrel file (typically 'index')
 * @param fileExtensions - Array of file extensions to check for
 * @returns Object with targetAbs (absolute path) and targetDir (directory),
 *          or empty strings if no matching boundary found
 */
export function resolveAliasImport(
  rawSpec: string,
  boundaries: Boundary[],
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  // Find boundary matching this alias
  const boundary = boundaries.find(
    (b) =>
      b.alias && (rawSpec === b.alias || rawSpec.startsWith(`${b.alias}/`)),
  );
  if (!boundary?.alias) {
    // No matching boundary - treat as external package
    return { targetAbs: '', targetDir: '' };
  }

  // Extract subpath (everything after '@boundary/')
  const subpath = rawSpec.slice(boundary.alias.length + 1);

  // No subpath → boundary root (ancestor barrel if importing from same boundary)
  if (!subpath) {
    return {
      targetAbs: getBarrelPath(boundary.absDir, barrelFileName, fileExtensions),
      targetDir: boundary.absDir,
    };
  }

  // Has subpath → resolve relative to boundary root
  return resolveTarget(
    boundary.absDir,
    subpath,
    barrelFileName,
    fileExtensions,
  );
}
