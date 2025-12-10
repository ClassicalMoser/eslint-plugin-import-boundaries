/**
 * Boundary rule validation.
 */

import type { Reporter } from '@ports';
import type { Boundary } from '@shared';
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

  const violation = checkBoundaryRules(
    fileBoundary,
    targetBoundary,
    boundaries,
    isTypeOnly,
  );

  if (!violation) {
    return false;
  }

  const severity = fileBoundary.severity || defaultSeverity;
  reporter.report({
    messageId: 'boundaryViolation',
    data: {
      from: getBoundaryIdentifier(fileBoundary),
      to: getBoundaryIdentifier(targetBoundary),
      reason: violation.reason,
    },
    severity,
  });

  return true;
}
