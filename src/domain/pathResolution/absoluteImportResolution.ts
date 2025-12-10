/**
 * Absolute import resolution (e.g., src/domain/entities).
 *
 * Resolves absolute import specifiers that start with rootDir (e.g., 'src/domain').
 * These are used when crossBoundaryStyle is 'absolute'.
 */

import { resolveTarget } from './resolveTarget';

/**
 * Resolve absolute import (e.g., src/domain/entities).
 *
 * Absolute imports start with the rootDir (e.g., 'src/domain/entities').
 * They are resolved relative to the project root (cwd).
 *
 * @param rawSpec - Import specifier (e.g., 'src/domain/entities')
 * @param cwd - Current working directory (project root)
 * @param barrelFileName - Name of barrel file (typically 'index')
 * @param fileExtensions - Array of file extensions to check for
 * @returns Object with targetAbs (absolute path) and targetDir (directory)
 */
export function resolveAbsoluteImport(
  rawSpec: string,
  cwd: string,
  barrelFileName: string,
  fileExtensions: string[],
): { targetAbs: string; targetDir: string } {
  // Resolve relative to project root
  return resolveTarget(cwd, rawSpec, barrelFileName, fileExtensions);
}
