/**
 * Test utilities for boundaryRulesHelpers tests.
 * Exports the matchesBoundaryIdentifier function for use in tests.
 */

import type { Boundary } from '@shared';
import { getBoundaryIdentifier } from './boundaryRules';

/**
 * Check if a boundary identifier matches a target boundary.
 * Matches by the canonical identifier property (or falls back to alias/dir).
 */
export function matchesBoundaryIdentifier(
  identifier: string,
  targetBoundary: Boundary,
): boolean {
  const targetIdentifier = getBoundaryIdentifier(targetBoundary);
  return identifier === targetIdentifier;
}

