/**
 * Shared target path resolution logic.
 * Centralizes the common pattern of resolving import specifiers to target paths,
 * handling both directory (barrel file) and file (with extension) cases.
 */

import path from 'node:path';
import { getBarrelPath, hasExtension } from '@domain/path';

/**
 * Resolve an import specifier to its target absolute path and directory.
 *
 * This function handles the common pattern across all import resolution functions:
 * - If specifier has no extension → treat as directory, resolve to barrel file
 * - If specifier has extension → treat as file, resolve directly
 *
 * @param baseDir - Base directory to resolve from (varies by import type)
 * @param spec - Import specifier (relative to baseDir)
 * @param barrelFileName - Name of barrel file (typically 'index')
 * @param fileExtensions - Array of file extensions to check for
 * @returns Object with targetAbs (absolute path) and targetDir (directory)
 *
 * @example
 * ```typescript
 * // Directory import (no extension)
 * resolveTarget('/project/src/domain', 'entities', 'index', ['.ts'])
 * // Returns: { targetAbs: '/project/src/domain/entities/index.ts', targetDir: '/project/src/domain/entities' }
 *
 * // File import (with extension)
 * resolveTarget('/project/src/domain', 'entities.ts', 'index', ['.ts'])
 * // Returns: { targetAbs: '/project/src/domain/entities.ts', targetDir: '/project/src/domain' }
 * ```
 */
export function resolveTarget(
  baseDir: string,
  spec: string,
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  // Check if specifier has a file extension
  if (!hasExtension(spec, fileExtensions)) {
    // No extension → treat as directory, resolve to barrel file
    const targetDir = path.resolve(baseDir, spec);
    return {
      targetAbs: getBarrelPath(targetDir, barrelFileName, fileExtensions),
      targetDir,
    };
  }

  // Has extension → treat as file, resolve directly
  const targetAbs = path.resolve(baseDir, spec);
  return {
    targetAbs,
    targetDir: path.dirname(targetAbs),
  };
}
