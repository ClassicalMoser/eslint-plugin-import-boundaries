/**
 * Boundary detection and matching logic for the boundary-alias-vs-relative ESLint rule.
 */

import type { AliasSubpathCheck, Boundary, FileData } from "./types";
import path from "node:path";
import { isInsideDir } from "./pathUtils";

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
 * Resolve a file to the nearest boundary that has rules specified.
 * If no boundaries with rules are found, returns null.
 *
 * @param filename - Absolute filename
 * @param boundaries - Array of all boundaries
 * @returns The nearest boundary with rules, or null if none found
 */
export function resolveToSpecifiedBoundary(
  filename: string,
  boundaries: Boundary[],
): Boundary | null {
  // Find all boundaries where the file is inside the boundary's directory
  const matchingBoundaries = boundaries.filter((b) =>
    isInsideDir(b.absDir, filename),
  );

  // Filter to only boundaries that have rules specified
  // An empty array counts as having rules (empty allow = deny all, empty deny = allow all)
  // allowTypeImportsFrom also counts as having rules (even if only for type imports)
  const specifiedBoundaries = matchingBoundaries.filter(
    (b) =>
      b.allowImportsFrom !== undefined ||
      b.denyImportsFrom !== undefined ||
      b.allowTypeImportsFrom !== undefined,
  );

  if (specifiedBoundaries.length > 0) {
    // Return the most specific (longest path) specified boundary
    return specifiedBoundaries.sort(
      (a, b) => b.absDir.length - a.absDir.length,
    )[0]!;
  }

  // If no specified boundaries match, find the nearest ancestor with rules
  // An empty array counts as having rules (empty allow = deny all, empty deny = allow all)
  // allowTypeImportsFrom also counts as having rules (even if only for type imports)
  const allSpecifiedBoundaries = boundaries.filter(
    (b) =>
      b.allowImportsFrom !== undefined ||
      b.denyImportsFrom !== undefined ||
      b.allowTypeImportsFrom !== undefined,
  );

  // Find ancestors (boundaries that contain the file)
  const ancestors = allSpecifiedBoundaries.filter((b) =>
    isInsideDir(b.absDir, filename),
  );

  if (ancestors.length > 0) {
    // Return the most specific ancestor (longest path)
    return ancestors.sort((a, b) => b.absDir.length - a.absDir.length)[0]!;
  }

  // No specified boundaries found - return null (import will be rejected)
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

  // Resolve to nearest specified boundary (one with rules)
  const fileBoundary = resolveToSpecifiedBoundary(filename, boundaries);

  return { isValid: true, fileDir, fileBoundary };
}
