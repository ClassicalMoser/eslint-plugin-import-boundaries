/**
 * Ancestor barrel detection and reporting.
 *
 * Detects imports from a boundary's own barrel file (e.g., importing '@domain'
 * from within the '@domain' boundary), which would create circular dependencies.
 */

import type { Reporter } from '@ports';
import type { Boundary } from '@shared';
import { reportViolation } from '@application/reporting';
import { getBoundaryIdentifier } from '@domain';
import { isAncestorBarrelImport } from './ancestorBarrelDetectionHelpers';

export interface AncestorBarrelDetectionOptions {
  rawSpec: string;
  fileBoundary: Boundary;
  rootDir: string;
  crossBoundaryStyle: 'alias' | 'absolute';
  reporter: Reporter;
  defaultSeverity?: 'error' | 'warn';
}

/**
 * Detect and report ancestor barrel imports (not fixable).
 *
 * An ancestor barrel import occurs when a file imports from its own boundary's
 * root barrel file. This creates a circular dependency and is forbidden.
 *
 * @param options - Detection options
 * @returns true if an ancestor barrel was detected and reported, false otherwise
 */
export function detectAndReportAncestorBarrel(
  options: AncestorBarrelDetectionOptions,
): boolean {
  const {
    rawSpec,
    fileBoundary,
    rootDir,
    crossBoundaryStyle,
    reporter,
    defaultSeverity,
  } = options;

  // Check if this is an ancestor barrel import
  // Alias style: rawSpec matches boundary alias (e.g., '@domain')
  // Absolute style: rawSpec matches boundary root path (e.g., 'src/domain')
  if (
    !isAncestorBarrelImport(rawSpec, fileBoundary, rootDir, crossBoundaryStyle)
  ) {
    return false;
  }

  // Report violation - not fixable (requires knowing actual export locations)
  reportViolation({
    reporter,
    messageId: 'ancestorBarrelImport',
    data: {
      boundaryIdentifier: getBoundaryIdentifier(fileBoundary),
    },
    fileBoundary,
    defaultSeverity,
    // No fix - requires knowing where exports actually live
  });

  return true;
}
