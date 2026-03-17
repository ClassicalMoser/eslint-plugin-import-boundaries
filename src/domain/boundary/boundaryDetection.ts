/**
 * Boundary detection and matching logic for the boundary-alias-vs-relative ESLint rule.
 */

import type { AliasSubpathCheck, Boundary, FileData } from '@shared';
import path from 'node:path';
import { isInsideDir } from '@domain/path';

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
    if (b.alias && spec.startsWith(`${b.alias}/`)) {
      return { isSubpath: true, baseAlias: b.alias };
    }
  }
  return { isSubpath: false };
}

/**
 * Resolve a file/path to the nearest boundary (regardless of rules).
 * Used for target boundaries - returns the boundary if it exists, even without rules.
 *
 * @param filename - Absolute filename
 * @param boundaries - Array of all boundaries
 * @returns The nearest boundary, or null if none found
 */
export function resolveToBoundary(
  filename: string,
  boundaries: Boundary[],
): Boundary | null {
  // Find all boundaries where the file is inside the boundary's directory
  const matchingBoundaries = boundaries.filter((b) =>
    isInsideDir(b.absDir, filename),
  );

  if (matchingBoundaries.length > 0) {
    // Return the most specific (longest path) boundary
    return matchingBoundaries.sort(
      (a, b) => b.absDir.length - a.absDir.length,
    )[0]!;
  }

  return null;
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

  // Resolve to actual boundary (for same-boundary detection and path calculation)
  // This returns the boundary even if it has no rules
  const fileBoundary = resolveToBoundary(filename, boundaries);

  return { isValid: true, fileDir, fileBoundary };
}
