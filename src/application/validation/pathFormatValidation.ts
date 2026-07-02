/**
 * Path format validation and reporting.
 */

import type { Fixer, Reporter } from '@ports';
import type { Boundary } from '@shared';
import { reportAncestorDirectoryImport } from '@application/detection';
import { reportViolation } from '@application/reporting';
import { checkAncestorBarrel } from '@domain';

export interface PathFormatValidationOptions {
  rawSpec: string;
  correctPath: string;
  fileBoundary: Boundary | null;
  rootDir: string;
  crossBoundaryStyle: 'alias' | 'absolute';
  reporter: Reporter;
  createFixer: (newPath: string) => Fixer;
  defaultSeverity?: 'error' | 'warn';
}

/**
 * Validate and report incorrect import path format.
 *
 * Compares the actual import path against the expected path and reports
 * a violation if they don't match. Provides an auto-fix to correct the path.
 *
 * @param options - Validation options
 * @returns true if a violation was reported, false otherwise
 */
export function validatePathFormat(
  options: PathFormatValidationOptions,
): boolean {
  const {
    rawSpec,
    correctPath,
    fileBoundary,
    rootDir,
    crossBoundaryStyle,
    reporter,
    createFixer,
    defaultSeverity,
  } = options;

  // Never auto-fix to an ancestor directory import — that form is forbidden
  if (
    fileBoundary &&
    checkAncestorBarrel(correctPath, fileBoundary, rootDir, crossBoundaryStyle)
  ) {
    reportAncestorDirectoryImport({
      fileBoundary,
      reporter,
      defaultSeverity,
    });
    return true;
  }

  // Check if current path is correct - no violation if it matches
  if (rawSpec === correctPath) {
    return false;
  }

  // Report violation with expected path and auto-fix
  reportViolation({
    reporter,
    messageId: 'incorrectImportPath',
    data: {
      expectedPath: correctPath,
      actualPath: rawSpec,
    },
    fileBoundary,
    defaultSeverity,
    fix: createFixer(correctPath),
  });

  return true;
}
