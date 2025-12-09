/**
 * Main import handler for the boundary-alias-vs-relative ESLint rule.
 * Orchestrates all import checking logic: external package detection, boundary rules,
 * path format enforcement, and violation reporting.
 */

import type { Rule } from "eslint";
import type { Boundary } from "./types";
import { checkAliasSubpath, resolveToBoundary } from "./boundaryDetection";
import { checkBoundaryRules, getBoundaryIdentifier } from "./boundaryRules";
import { createFixer } from "./fixer";
import {
  calculateCorrectImportPath,
  resolveTargetPath,
} from "./relationshipDetection";

/**
 * Options for handleImport function.
 */
export interface HandleImportOptions {
  node: Rule.Node;
  rawSpec: string;
  fileDir: string;
  fileBoundary: Boundary | null;
  filename: string; // Actual file path for resolving to specified boundary
  boundaries: Boundary[];
  rootDir: string;
  cwd: string;
  context: Rule.RuleContext;
  crossBoundaryStyle?: "alias" | "absolute";
  defaultSeverity?: "error" | "warn";
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
  const {
    node,
    rawSpec,
    fileDir,
    fileBoundary,
    filename,
    boundaries,
    rootDir,
    cwd,
    context,
    crossBoundaryStyle = "alias",
    defaultSeverity,
    allowUnknownBoundaries = false,
    isTypeOnly = false,
    skipBoundaryRules = false,
    barrelFileName = "index",
    fileExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
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
    fileExtensions
  );

  // Skip checking for external packages (node_modules, etc.)
  // External packages don't resolve to any boundary (targetAbs is empty)
  if (!targetAbs) {
    return false; // Skip all checking for external packages
  }

  // Handle cross-boundary alias subpaths (e.g., '@entities/army' -> '@entities')
  // Only check this if using alias style
  if (crossBoundaryStyle === "alias") {
    const aliasSubpathCheck = checkAliasSubpath(rawSpec, boundaries);
    if (aliasSubpathCheck.isSubpath) {
      const targetBoundary = boundaries.find(
        (b) => b.alias === aliasSubpathCheck.baseAlias
      );
      if (
        targetBoundary &&
        targetBoundary.alias &&
        fileBoundary &&
        targetBoundary !== fileBoundary
      ) {
        const expectedPath = targetBoundary.alias;
        const severity = fileBoundary.severity || defaultSeverity;
        // Only set severity if explicitly configured (allows rule-level severity to be used)
        const reportOptions: Rule.ReportDescriptor = {
          node,
          messageId: "incorrectImportPath",
          data: {
            expectedPath,
            actualPath: rawSpec,
          },
          fix: createFixer(node, expectedPath),
          ...(severity && { severity: severity === "warn" ? 1 : 2 }),
        };
        context.report(reportOptions);
        return true;
      }
    }
  }

  // Resolve target to nearest boundary (even if it has no rules)
  // Target boundaries should be returned as-is, rules are checked separately
  const targetBoundary = resolveToBoundary(targetAbs, boundaries);

  // Check allow/deny rules if both boundaries exist and are different
  // Skip this check for test files if skipBoundaryRules is true (but still enforce path format)
  // Every boundary has rules (explicit or implicit "deny all"), so use the boundary itself
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
      isTypeOnly
    );
    if (violation) {
      const severity = fileBoundary.severity || defaultSeverity;
      const reportOptions: Rule.ReportDescriptor = {
        node,
        messageId: "boundaryViolation",
        data: {
          from: getBoundaryIdentifier(fileBoundary),
          to: getBoundaryIdentifier(targetBoundary),
          reason: violation.reason,
        },
        ...(severity && { severity: severity === "warn" ? 1 : 2 }),
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
    barrelFileName,
    fileExtensions
  );

  if (!correctPath) {
    // Check if it's ancestor barrel (not fixable)
    // calculateCorrectImportPath returns null only for ancestor barrels:
    // - rawSpec === fileBoundary.alias (when using alias style)
    // - rawSpec === absolute path to boundary root (when using absolute style)
    // - Target is boundary root index.ts (line 142)
    // - Same directory index.ts (line 164)
    // - Defensive: firstDifferingSegment is falsy (line 170, should be unreachable)
    if (fileBoundary) {
      const isAncestorBarrel =
        crossBoundaryStyle === "alias"
          ? fileBoundary.alias && rawSpec === fileBoundary.alias
          : rawSpec === `${rootDir}/${fileBoundary.dir}`.replace(/\\/g, "/") ||
            rawSpec === `${rootDir}/${fileBoundary.dir}/`.replace(/\\/g, "/");
      if (isAncestorBarrel) {
        const severity = fileBoundary.severity || defaultSeverity;
        const reportOptions: Rule.ReportDescriptor = {
          node,
          messageId: "ancestorBarrelImport",
          data: {
            alias: getBoundaryIdentifier(fileBoundary),
          },
          // No fix - requires knowing where exports actually live
          ...(severity && { severity: severity === "warn" ? 1 : 2 }),
        };
        context.report(reportOptions);
        return true;
      }
    }
    // Defensive: should never reach here in practice
    // calculateCorrectImportPath only returns null for ancestor barrels
    // which are all handled above. This branch exists for type safety.
    return false;
  }

  // Check for unknown boundary (target outside all boundaries)
  if (correctPath === "UNKNOWN_BOUNDARY") {
    if (!allowUnknownBoundaries) {
      const reportOptions: Rule.ReportDescriptor = {
        node,
        messageId: "unknownBoundaryImport",
        data: {
          path: rawSpec,
        },
        // No fix - don't know what the correct path should be
        ...(defaultSeverity && {
          severity: defaultSeverity === "warn" ? 1 : 2,
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
    messageId: "incorrectImportPath",
    data: {
      expectedPath: correctPath,
      actualPath: rawSpec,
    },
    fix: createFixer(node, correctPath),
    // Only set severity if explicitly configured (allows rule-level severity to be used)
    ...(severity && { severity: severity === "warn" ? 1 : 2 }),
  };
  context.report(reportOptions);

  return true;
}
