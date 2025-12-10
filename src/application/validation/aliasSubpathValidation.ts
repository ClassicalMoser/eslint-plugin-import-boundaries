/**
 * Alias subpath validation for cross-boundary imports.
 */

import type { Fixer, Reporter } from '@ports';
import type { Boundary } from '@shared';
import { checkAliasSubpath } from '@domain';

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

  const aliasSubpathCheck = checkAliasSubpath(rawSpec, boundaries);
  if (!aliasSubpathCheck.isSubpath) {
    return false;
  }

  const targetBoundary = boundaries.find(
    (b) => b.alias === aliasSubpathCheck.baseAlias,
  );
  if (
    targetBoundary &&
    targetBoundary.alias &&
    fileBoundary &&
    targetBoundary !== fileBoundary
  ) {
    const expectedPath = targetBoundary.alias;
    const severity = fileBoundary.severity || defaultSeverity;
    reporter.report({
      messageId: 'incorrectImportPath',
      data: {
        expectedPath,
        actualPath: rawSpec,
      },
      severity,
      fix: createFixer(expectedPath),
    });
    return true;
  }

  return false;
}
