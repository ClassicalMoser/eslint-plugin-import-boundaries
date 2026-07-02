/**
 * Ancestor directory violation reporting.
 *
 * Reports imports from a boundary's own directory interface (e.g., importing '@domain'
 * from within the '@domain' boundary), which would create circular dependencies.
 * Detection itself lives in the domain layer (checkAncestorBarrel).
 */

import type { Reporter } from '@ports';
import type { Boundary } from '@shared';
import { reportViolation } from '@application/reporting';
import { getBoundaryIdentifier } from '@domain';

export interface ReportAncestorDirectoryImportOptions {
  fileBoundary: Boundary;
  reporter: Reporter;
  defaultSeverity?: 'error' | 'warn';
}

/**
 * Report an ancestor directory import violation.
 * Not fixable — a correct fix would require knowing where exports actually live.
 */
export function reportAncestorDirectoryImport(
  options: ReportAncestorDirectoryImportOptions,
): void {
  const { fileBoundary, reporter, defaultSeverity } = options;

  reportViolation({
    reporter,
    messageId: 'ancestorBarrelImport',
    data: {
      boundaryIdentifier: getBoundaryIdentifier(fileBoundary),
    },
    fileBoundary,
    defaultSeverity,
  });
}
