/**
 * Bare import subpath extraction.
 */

import type { Boundary } from '@shared';
import {
  extractExactMatchSubpath,
  extractPrefixMatchSubpath,
  extractSuffixMatchSubpath,
} from './bareImportSubpathExtractionHelpers';

/**
 * Extract subpath from bare import relative to matching boundary.
 */
export function extractBareImportSubpath(
  rawSpec: string,
  matchingBoundary: Boundary,
): string {
  const boundaryDir = matchingBoundary.dir;

  // Try exact match first
  const exactMatch = extractExactMatchSubpath(rawSpec, boundaryDir);
  if (exactMatch !== null) {
    return exactMatch;
  }

  // Try prefix match
  const prefixMatch = extractPrefixMatchSubpath(rawSpec, boundaryDir);
  if (prefixMatch !== null) {
    return prefixMatch;
  }

  // Try suffix match (fallback)
  return extractSuffixMatchSubpath(rawSpec, boundaryDir);
}
