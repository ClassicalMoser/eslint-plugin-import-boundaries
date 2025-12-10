/**
 * Severity calculation utilities.
 * Centralizes the logic for determining violation severity from boundary and default settings.
 */

import type { Boundary } from '@shared';

/**
 * Get the severity for a violation, respecting boundary-specific severity and default.
 *
 * Priority:
 * 1. Boundary-specific severity (if set)
 * 2. Default severity (if provided)
 * 3. Undefined (uses rule-level default)
 *
 * @param fileBoundary - The boundary containing the file, or null if file is outside boundaries
 * @param defaultSeverity - Default severity from rule options
 * @returns The severity to use, or undefined to use rule-level default
 *
 * @example
 * ```typescript
 * const severity = getSeverity(fileBoundary, 'error');
 * // If fileBoundary.severity is 'warn', returns 'warn'
 * // Otherwise returns 'error'
 * ```
 */
export function getSeverity(
  fileBoundary: Boundary | null,
  defaultSeverity?: 'error' | 'warn',
): 'error' | 'warn' | undefined {
  // Boundary-specific severity takes precedence over default
  return fileBoundary?.severity ?? defaultSeverity;
}

