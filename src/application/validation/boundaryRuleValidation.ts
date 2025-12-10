/**
 * Boundary rule validation.
 *
 * Enforces architectural boundary rules (allow/deny lists) and reports violations.
 */

import type { Reporter } from '@ports';
import type { Boundary } from '@shared';
import { reportViolation } from '@application/reporting';
import { checkBoundaryRules, getBoundaryIdentifier } from '@domain';

export interface BoundaryRuleValidationOptions {
  fileBoundary: Boundary;
  targetBoundary: Boundary;
  boundaries: Boundary[];
  isTypeOnly: boolean;
  reporter: Reporter;
  defaultSeverity?: 'error' | 'warn';
}

/**
 * Validate and report boundary rule violations.
 *
 * Checks if an import from fileBoundary to targetBoundary is allowed according
 * to the boundary's allow/deny rules. Reports a violation if not allowed.
 *
 * @param options - Validation options
 * @returns true if a violation was reported, false otherwise
 */
export function validateBoundaryRules(
  options: BoundaryRuleValidationOptions,
): boolean {
  const {
    fileBoundary,
    targetBoundary,
    boundaries,
    isTypeOnly,
    reporter,
    defaultSeverity,
  } = options;

  // Check if this import violates boundary rules
  const violation = checkBoundaryRules(
    fileBoundary,
    targetBoundary,
    boundaries,
    isTypeOnly,
  );

  // No violation - import is allowed
  if (!violation) {
    return false;
  }

  // Report violation with boundary identifiers and reason
  reportViolation({
    reporter,
    messageId: 'boundaryViolation',
    data: {
      from: getBoundaryIdentifier(fileBoundary),
      to: getBoundaryIdentifier(targetBoundary),
      reason: violation.reason,
    },
    fileBoundary,
    defaultSeverity,
    // No fix - requires architectural decision
  });

  return true;
}
