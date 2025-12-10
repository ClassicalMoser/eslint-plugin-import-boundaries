/**
 * Application: Import Handler
 * Orchestrates import validation using domain logic and ports.
 * Depends on domain and ports, NOT on ESLint directly (Dependency Inversion).
 */

import type { Fixer, Reporter } from '@ports';
import type { Boundary } from '@shared';
import {
  calculateCorrectImportPath,
  resolveTargetPath,
  resolveToBoundary,
} from '@domain';
import { detectAndReportAncestorBarrel, isExternalPackage } from './detection';
import { handleUnknownBoundary } from './handling';
import { getImportHandlerDefaults } from './importHandlerDefaults';
import {
  isNullPath,
  isUnknownBoundary,
  isValidPath,
  shouldDetectAncestorBarrel,
  shouldValidateAliasSubpath,
  shouldValidateBoundaryRules,
} from './importHandlerHelpers';
import {
  validateAliasSubpath,
  validateBoundaryRules,
  validatePathFormat,
} from './validation';

/**
 * Options for handleImport function.
 */
export interface HandleImportOptions {
  rawSpec: string;
  fileDir: string;
  fileBoundary: Boundary | null;
  boundaries: Boundary[];
  rootDir: string;
  cwd: string;
  reporter: Reporter;
  createFixer: (newPath: string) => Fixer; // Factory function to create fixers
  crossBoundaryStyle?: 'alias' | 'absolute';
  defaultSeverity?: 'error' | 'warn';
  allowUnknownBoundaries?: boolean;
  isTypeOnly?: boolean;
  skipBoundaryRules?: boolean;
  barrelFileName?: string;
  fileExtensions?: string[];
}

/**
 * Main handler for all import statements.
 * Validates import paths against boundary rules and enforces correct path format.
 *
 * @returns true if a violation was reported, false otherwise
 */
export function handleImport(options: HandleImportOptions): boolean {
  const defaults = getImportHandlerDefaults();
  const {
    rawSpec,
    fileDir,
    fileBoundary,
    boundaries,
    rootDir,
    cwd,
    reporter,
    createFixer,
    crossBoundaryStyle = defaults.crossBoundaryStyle,
    defaultSeverity,
    allowUnknownBoundaries = defaults.allowUnknownBoundaries,
    isTypeOnly = defaults.isTypeOnly,
    skipBoundaryRules = defaults.skipBoundaryRules,
    barrelFileName = defaults.barrelFileName,
    fileExtensions = defaults.fileExtensions,
  } = options;

  // Resolve target path first to determine if it's internal or external
  // (this handles aliases, relative, absolute, and bare imports)
  const { targetAbs } = resolveTargetPath(
    rawSpec,
    fileDir,
    boundaries,
    rootDir,
    cwd,
    barrelFileName,
    fileExtensions,
  );

  // Skip checking for external packages (node_modules, etc.)
  // External packages don't resolve to any boundary (targetAbs is empty)
  if (isExternalPackage(targetAbs)) {
    return false; // Skip all checking for external packages
  }

  // Handle cross-boundary alias subpaths (e.g., '@entities/army' -> '@entities')
  // Only check this if using alias style
  if (
    shouldValidateAliasSubpath(crossBoundaryStyle) &&
    validateAliasSubpath({
      rawSpec,
      boundaries,
      fileBoundary,
      reporter,
      createFixer,
      defaultSeverity,
    })
  ) {
    return true;
  }

  // Resolve target to nearest boundary (even if it has no rules)
  // Target boundaries should be returned as-is, rules are checked separately
  const targetBoundary = resolveToBoundary(targetAbs, boundaries);

  // Check allow/deny rules if both boundaries exist and are different
  // Skip this check for test files if skipBoundaryRules is true (but still enforce path format)
  // Every boundary has rules (explicit or implicit "deny all"), so use the boundary itself
  if (
    shouldValidateBoundaryRules(
      skipBoundaryRules,
      fileBoundary,
      targetBoundary,
    ) &&
    validateBoundaryRules({
      fileBoundary: fileBoundary!,
      targetBoundary: targetBoundary!,
      boundaries,
      isTypeOnly,
      reporter,
      defaultSeverity,
    })
  ) {
    return true;
  }

  // Calculate correct path (for path format enforcement)
  const correctPath = calculateCorrectImportPath(
    rawSpec,
    fileDir,
    fileBoundary,
    boundaries,
    rootDir,
    cwd,
    crossBoundaryStyle,
    barrelFileName,
    fileExtensions,
  );

  if (isNullPath(correctPath)) {
    // Check if it's ancestor barrel (not fixable)
    // calculateCorrectImportPath returns null only for ancestor barrels
    if (
      shouldDetectAncestorBarrel(correctPath, fileBoundary) &&
      detectAndReportAncestorBarrel({
        rawSpec,
        fileBoundary: fileBoundary!,
        rootDir,
        crossBoundaryStyle,
        reporter,
        defaultSeverity,
      })
    ) {
      return true;
    }
    // Defensive: should never reach here in practice
    // calculateCorrectImportPath only returns null for ancestor barrels
    // which are all handled above. This branch exists for type safety.
    return false;
  }

  // Check for unknown boundary (target outside all boundaries)
  if (isUnknownBoundary(correctPath)) {
    return handleUnknownBoundary({
      rawSpec,
      allowUnknownBoundaries,
      reporter,
      defaultSeverity,
    });
  }

  // Ensure correctPath is a valid non-empty string before validation
  // This is a defensive check to prevent passing invalid paths to validatePathFormat
  if (!isValidPath(correctPath)) {
    // Defensive: should never reach here in practice
    // calculateCorrectImportPath should always return null, UNKNOWN_BOUNDARY, or a valid path
    // This branch exists for type safety and to handle edge cases gracefully
    return false;
  }

  // Check if current path is correct and report violations
  return validatePathFormat({
    rawSpec,
    correctPath,
    fileBoundary,
    reporter,
    createFixer,
    defaultSeverity,
  });
}
