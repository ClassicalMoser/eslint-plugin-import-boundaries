/**
 * Boundary allow/deny rule checking logic.
 */

import type { Boundary } from './types';

/**
 * Check if an import from fileBoundary to targetBoundary is allowed.
 * Returns violation info if not allowed, null if allowed.
 *
 * Semantics:
 * - If both allowImportsFrom and denyImportsFrom are specified, they work as:
 *   - allowImportsFrom: explicit allow list (overrides deny for those items)
 *   - denyImportsFrom: explicit deny list (overrides default allow for those items)
 * - If only allowImportsFrom: only those boundaries are allowed (deny-all by default)
 * - If only denyImportsFrom: all boundaries allowed except those (allow-all by default)
 * - If neither: deny-all by default (strictest)
 * - allowTypeImportsFrom: For type-only imports, this overrides allowImportsFrom (allows types from more boundaries)
 */
export function checkBoundaryRules(
  fileBoundary: Boundary,
  targetBoundary: Boundary,
  allBoundaries: Boundary[],
  isTypeOnly: boolean = false,
): { reason: string } | null {
  // Same boundary - always allowed (path format is enforced separately)
  if (fileBoundary === targetBoundary) {
    return null;
  }

  // For type-only imports, check allowTypeImportsFrom first (if specified)
  if (
    isTypeOnly &&
    fileBoundary.allowTypeImportsFrom?.includes(targetBoundary.alias)
  ) {
    return null; // Type imports explicitly allowed
  }

  const hasAllowList =
    fileBoundary.allowImportsFrom && fileBoundary.allowImportsFrom.length > 0;
  const hasDenyList =
    fileBoundary.denyImportsFrom && fileBoundary.denyImportsFrom.length > 0;

  // If both lists exist, allow takes precedence (for nested boundaries where child can be more permissive)
  if (
    hasAllowList &&
    fileBoundary.allowImportsFrom!.includes(targetBoundary.alias)
  ) {
    return null; // Explicitly allowed, even if in deny list
  }

  if (
    hasDenyList &&
    fileBoundary.denyImportsFrom!.includes(targetBoundary.alias)
  ) {
    return {
      reason: `Boundary '${fileBoundary.alias}' explicitly denies imports from '${targetBoundary.alias}'`,
    };
  }

  // If only allow list exists: deny-all by default
  if (hasAllowList && !hasDenyList) {
    return {
      reason: `Cross-boundary import from '${targetBoundary.alias}' to '${fileBoundary.alias}' is not allowed. Add '${targetBoundary.alias}' to 'allowImportsFrom' if this import is intentional.`,
    };
  }

  // If only deny list exists: allow-all by default (except denied items)
  if (hasDenyList && !hasAllowList) {
    return null; // Allowed (not in deny list)
  }

  // If neither list exists: deny-all by default (strictest)
  return {
    reason: `Cross-boundary import from '${targetBoundary.alias}' to '${fileBoundary.alias}' is not allowed. Add '${targetBoundary.alias}' to 'allowImportsFrom' if this import is intentional.`,
  };
}
