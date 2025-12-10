/**
 * Alias subpath validation for cross-boundary imports.
 *
 * Prevents cross-boundary imports from using subpaths (e.g., '@entities/army').
 * Cross-boundary imports must use the boundary root alias (e.g., '@entities').
 */

import type { Fixer, Reporter } from '@ports';
import type { Boundary } from '@shared';
import { reportViolation } from '@application/reporting';
import { checkAliasSubpath } from '@domain';
import { shouldReportAliasSubpathViolation } from './aliasSubpathValidationHelpers';

export interface AliasSubpathValidationOptions {
  rawSpec: string;
  boundaries: Boundary[];
  fileBoundary: Boundary | null;
  reporter: Reporter;
  createFixer: (newPath: string) => Fixer;
  defaultSeverity?: 'error' | 'warn';
}

/**
 * Validate and report cross-boundary alias subpaths (e.g., '@entities/army' -> '@entities').
 *
 * Cross-boundary imports must use the boundary root alias without subpaths.
 * This ensures all cross-boundary imports go through the boundary's barrel file.
 *
 * @param options - Validation options
 * @returns true if a violation was reported, false otherwise
 */
export function validateAliasSubpath(
  options: AliasSubpathValidationOptions,
): boolean {
  const {
    rawSpec,
    boundaries,
    fileBoundary,
    reporter,
    createFixer,
    defaultSeverity,
  } = options;

  // Check if this is an alias import with a subpath
  const aliasSubpathCheck = checkAliasSubpath(rawSpec, boundaries);
  if (!aliasSubpathCheck.isSubpath) {
    return false; // Not a subpath, no violation
  }

  // Find the target boundary for this alias
  const targetBoundary = boundaries.find(
    (b) => b.alias === aliasSubpathCheck.baseAlias,
  );

  // Only report if all conditions are met (cross-boundary alias subpath)
  if (shouldReportAliasSubpathViolation(targetBoundary, fileBoundary)) {
    const expectedPath = targetBoundary.alias;
    reportViolation({
      reporter,
      messageId: 'incorrectImportPath',
      data: {
        expectedPath,
        actualPath: rawSpec,
      },
      fileBoundary,
      defaultSeverity,
      fix: createFixer(expectedPath),
    });
    return true;
  }

  return false;
}
