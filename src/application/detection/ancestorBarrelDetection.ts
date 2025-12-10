/**
 * Ancestor barrel detection and reporting.
 */

import type { Reporter } from '@ports';
import type { Boundary } from '@shared';
import { getBoundaryIdentifier } from '@domain';

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

  const isAncestorBarrel =
    crossBoundaryStyle === 'alias'
      ? fileBoundary.alias && rawSpec === fileBoundary.alias
      : rawSpec === `${rootDir}/${fileBoundary.dir}`.replace(/\\/g, '/') ||
        rawSpec === `${rootDir}/${fileBoundary.dir}/`.replace(/\\/g, '/');

  if (!isAncestorBarrel) {
    return false;
  }

  const severity = fileBoundary.severity || defaultSeverity;
  reporter.report({
    messageId: 'ancestorBarrelImport',
    data: {
      alias: getBoundaryIdentifier(fileBoundary),
    },
    severity,
    // No fix - requires knowing where exports actually live
  });

  return true;
}
