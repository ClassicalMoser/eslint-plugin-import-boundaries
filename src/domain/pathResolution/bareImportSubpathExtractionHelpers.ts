/**
 * Helper functions for bare import subpath extraction.
 * Extracted to improve testability and reduce mutation opportunities.
 */

/**
 * Extract subpath when rawSpec matches boundary dir exactly.
 */
export function extractExactMatchSubpath(
  rawSpec: string,
  boundaryDir: string,
): string | null {
  if (rawSpec === boundaryDir) {
    return '';
  }
  return null;
}

/**
 * Extract subpath when rawSpec starts with boundary dir.
 */
export function extractPrefixMatchSubpath(
  rawSpec: string,
  boundaryDir: string,
): string | null {
  if (rawSpec.startsWith(`${boundaryDir}/`)) {
    return rawSpec.slice(boundaryDir.length + 1);
  }
  return null;
}

/**
 * Extract subpath when rawSpec matches a suffix of boundary dir.
 * Returns the subpath after the matching suffix.
 */
export function extractSuffixMatchSubpath(
  rawSpec: string,
  boundaryDir: string,
): string {
  const boundaryParts = boundaryDir.split('/');
  for (let i = boundaryParts.length - 1; i >= 0; i--) {
    const boundarySuffix = boundaryParts.slice(i).join('/');
    if (rawSpec.startsWith(`${boundarySuffix}/`)) {
      return rawSpec.slice(boundarySuffix.length + 1);
    }
    if (rawSpec === boundarySuffix) {
      return '';
    }
  }
  return '';
}

