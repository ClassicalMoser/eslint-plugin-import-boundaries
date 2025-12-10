/**
 * Path formatting utilities for import path calculation.
 */

import type { Boundary } from './types';
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

