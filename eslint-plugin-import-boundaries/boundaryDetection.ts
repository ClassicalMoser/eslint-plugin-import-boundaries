/**
 * Boundary detection and matching logic for the boundary-alias-vs-relative ESLint rule.
 */

import type { AliasSubpathCheck, Boundary, FileData } from './types';
import path from 'node:path';
import { isInsideDir } from './pathUtils';

/**
 * Check if an import specifier is using an alias subpath (e.g., '@entities/army').
 * Subpaths should be converted to the base alias (e.g., '@entities').
 *
 * @param spec - Import specifier to check
 * @param boundaries - Array of resolved boundaries
 * @returns Object indicating if it's a subpath and which base alias it uses
 *
 * Examples:
 * - checkAliasSubpath('@entities/army', boundaries) => { isSubpath: true, baseAlias: '@entities' }
 * - checkAliasSubpath('@entities', boundaries) => { isSubpath: false }
 */
export function checkAliasSubpath(
  spec: string,
  boundaries: Boundary[],
): AliasSubpathCheck {
  for (const b of boundaries) {
    if (spec.startsWith(`${b.alias}/`)) {
      return { isSubpath: true, baseAlias: b.alias };
    }
  }
  return { isSubpath: false };
}

/**
 * Get metadata about the current file being linted.
 * Results are cached per file to avoid recomputation.
 *
 * @param filename - Absolute filename from ESLint context
 * @param boundaries - Array of resolved boundaries
 * @returns FileData with directory and boundary information, or { isValid: false } if file path is invalid
 */
export function getFileData(
  filename: string,
  boundaries: Boundary[],
): FileData {
  // If filename is not absolute, we can't determine boundaries
  // This can happen with virtual files or in some edge cases
  if (!path.isAbsolute(filename)) {
    return { isValid: false };
  }

  const fileDir = path.dirname(filename);

  // Find which boundary (if any) contains this file
  // If multiple boundaries match, use the most specific (longest path) one
  // This handles cases where boundaries might overlap (e.g., 'domain/entities' and 'domain/entities/army')
  const matchingBoundaries = boundaries.filter((b) =>
    isInsideDir(b.absDir, filename),
  );
  const fileBoundary =
    matchingBoundaries.length > 0
      ? matchingBoundaries.sort((a, b) => b.absDir.length - a.absDir.length)[0]!
      : null;

  return { isValid: true, fileDir, fileBoundary };
}
