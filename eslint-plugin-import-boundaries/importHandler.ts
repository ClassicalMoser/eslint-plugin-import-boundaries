/**
 * Main import handler for the boundary-alias-vs-relative ESLint rule.
 * Orchestrates all import checking logic: external package detection, boundary rules,
 * path format enforcement, and violation reporting.
 */

import type { Rule } from 'eslint';
import type { Boundary } from './types';
import { checkAliasSubpath } from './boundaryDetection';
import { checkBoundaryRules } from './boundaryRules';
import { createFixer } from './fixer';
import { isInsideDir } from './pathUtils';
import {
  calculateCorrectImportPath,
  resolveTargetPath,
} from './relationshipDetection';

/**
 * Options for handleImport function.
 */
export interface HandleImportOptions {
  node: Rule.Node;
  rawSpec: string;
  fileDir: string;
  fileBoundary: Boundary | null;
  boundaries: Boundary[];
  rootDir: string;
  cwd: string;
  context: Rule.RuleContext;
  crossBoundaryStyle?: 'alias' | 'absolute';
  defaultSeverity?: 'error' | 'warn';
  allowUnknownBoundaries?: boolean;
  isTypeOnly?: boolean;
  skipBoundaryRules?: boolean;
}

/**
 * Main handler for all import statements.
 * Validates import paths against boundary rules and enforces correct path format.
 *
 * @returns true if a violation was reported, false otherwise
 */
export function handleImport(options: HandleImportOptions): boolean {
  const {
    node,
    rawSpec,
    fileDir,
    fileBoundary,
    boundaries,
    rootDir,
    cwd,
    context,
    crossBoundaryStyle = 'alias',
    defaultSeverity,
    allowUnknownBoundaries = false,
    isTypeOnly = false,
    skipBoundaryRules = false,
  } = options;
  // Skip checking for external packages (node_modules, etc.)
  // External packages are:
  // - Not relative imports (don't start with .)
  // - Not matching any boundary alias (don't start with @boundary)
  // - Not absolute paths within rootDir
  const isRelative = rawSpec.startsWith('.');
  const matchesBoundaryAlias = boundaries.some(
    (b) => rawSpec === b.alias || rawSpec.startsWith(`${b.alias}/`),
  );
  const isAbsoluteInRoot =
    rawSpec.startsWith(rootDir) || rawSpec.startsWith(`/${rootDir}`);

  // If it's not relative, not a boundary alias, and not an absolute path in rootDir, it's external
  if (!isRelative && !matchesBoundaryAlias && !isAbsoluteInRoot) {
    return false; // Skip all checking for external packages
  }

  // Handle cross-boundary alias subpaths (e.g., '@entities/army' -> '@entities')
  // Only check this if using alias style
  if (crossBoundaryStyle === 'alias') {
    const aliasSubpathCheck = checkAliasSubpath(rawSpec, boundaries);
    if (aliasSubpathCheck.isSubpath) {
      const targetBoundary = boundaries.find(
        (b) => b.alias === aliasSubpathCheck.baseAlias,
      );
      if (targetBoundary && fileBoundary && targetBoundary !== fileBoundary) {
        const expectedPath = targetBoundary.alias;
        const severity = fileBoundary.severity || defaultSeverity;
        // Only set severity if explicitly configured (allows rule-level severity to be used)
        const reportOptions: Rule.ReportDescriptor = {
          node,
          messageId: 'incorrectImportPath',
          data: {
            expectedPath,
            actualPath: rawSpec,
          },
          fix: createFixer(node, expectedPath),
          ...(severity && { severity: severity === 'warn' ? 1 : 2 }),
        };
        context.report(reportOptions);
        return true;
      }
    }
  }

  // Resolve target path to find target boundary for allow/deny checking
  const { targetAbs } = resolveTargetPath(
    rawSpec,
    fileDir,
    boundaries,
    rootDir,
    cwd,
  );

  // Find target boundary
  const targetBoundary =
    boundaries.find((b) => isInsideDir(b.absDir, targetAbs)) ?? null;

  // Check allow/deny rules if both boundaries exist and are different
  // Skip this check for test files if skipBoundaryRules is true (but still enforce path format)
  if (
    !skipBoundaryRules &&
    fileBoundary &&
    targetBoundary &&
    fileBoundary !== targetBoundary
  ) {
    const violation = checkBoundaryRules(
      fileBoundary,
      targetBoundary,
      boundaries,
      isTypeOnly,
    );
    if (violation) {
      const severity = fileBoundary.severity || defaultSeverity;
      const reportOptions: Rule.ReportDescriptor = {
        node,
        messageId: 'boundaryViolation',
        data: {
          from: fileBoundary.alias,
          to: targetBoundary.alias,
          reason: violation.reason,
        },
        ...(severity && { severity: severity === 'warn' ? 1 : 2 }),
      };
      context.report(reportOptions);
      return true;
    }
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
  );

  if (!correctPath) {
    // Check if it's ancestor barrel (not fixable)
    // calculateCorrectImportPath returns null only for ancestor barrels:
    // - rawSpec === fileBoundary.alias (line 115)
    // - Target is boundary root index.ts (line 142)
    // - Same directory index.ts (line 164)
    // - Defensive: firstDifferingSegment is falsy (line 170, should be unreachable)
    if (fileBoundary && rawSpec === fileBoundary.alias) {
      const severity = fileBoundary.severity || defaultSeverity;
      const reportOptions: Rule.ReportDescriptor = {
        node,
        messageId: 'ancestorBarrelImport',
        data: {
          alias: fileBoundary.alias,
        },
        // No fix - requires knowing where exports actually live
        ...(severity && { severity: severity === 'warn' ? 1 : 2 }),
      };
      context.report(reportOptions);
      return true;
    }
    // Defensive: should never reach here in practice
    // calculateCorrectImportPath only returns null for ancestor barrels
    // which are all handled above. This branch exists for type safety.
    return false;
  }

  // Check for unknown boundary (target outside all boundaries)
  if (correctPath === 'UNKNOWN_BOUNDARY') {
    if (!allowUnknownBoundaries) {
      const reportOptions: Rule.ReportDescriptor = {
        node,
        messageId: 'unknownBoundaryImport',
        data: {
          path: rawSpec,
        },
        // No fix - don't know what the correct path should be
        ...(defaultSeverity && {
          severity: defaultSeverity === 'warn' ? 1 : 2,
        }),
      };
      context.report(reportOptions);
      return true;
    }
    return false; // Allowed, no violation
  }

  // Check if current path is correct
  if (rawSpec === correctPath) {
    return false; // No violation
  }

  // Determine severity for this boundary
  const severity = fileBoundary?.severity || defaultSeverity;

  // Show the expected path directly
  const reportOptions: Rule.ReportDescriptor = {
    node,
    messageId: 'incorrectImportPath',
    data: {
      expectedPath: correctPath,
      actualPath: rawSpec,
    },
    fix: createFixer(node, correctPath),
    // Only set severity if explicitly configured (allows rule-level severity to be used)
    ...(severity && { severity: severity === 'warn' ? 1 : 2 }),
  };
  context.report(reportOptions);

  return true;
}
