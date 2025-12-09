/**
 * Boundary allow/deny rule checking logic.
 */

import type { Boundary } from "./types";

/**
 * Get the identifier for a boundary (alias if present, otherwise dir).
 * Used for allow/deny rules and error messages.
 */
export function getBoundaryIdentifier(boundary: Boundary): string {
  return boundary.alias ?? boundary.dir;
}

/**
 * Check if a boundary identifier matches a target boundary.
 * Matches by alias (if present) or by dir path.
 */
function matchesBoundaryIdentifier(
  identifier: string,
  targetBoundary: Boundary,
): boolean {
  // Try alias first if present
  if (targetBoundary.alias && identifier === targetBoundary.alias) {
    return true;
  }
  // Fall back to dir
  return identifier === targetBoundary.dir;
}

/**
 * Check if an import from fileBoundary to targetBoundary is allowed.
 * Returns violation info if not allowed, null if allowed.
 *
 * Semantics:
 * - If both allowImportsFrom and denyImportsFrom are specified, they work as:
 *   - Both lists apply independently (allow applies to items in allow list, deny applies to items in deny list)
 *   - If the same identifier appears in both lists (configuration error), denyImportsFrom takes precedence for safety
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

  const fileIdentifier = getBoundaryIdentifier(fileBoundary);
  const targetIdentifier = getBoundaryIdentifier(targetBoundary);

  // For type-only imports, check allowTypeImportsFrom first (if specified)
  if (
    isTypeOnly &&
    fileBoundary.allowTypeImportsFrom?.some((id) =>
      matchesBoundaryIdentifier(id, targetBoundary),
    )
  ) {
    return null; // Type imports explicitly allowed
  }

  const hasAllowList =
    fileBoundary.allowImportsFrom && fileBoundary.allowImportsFrom.length > 0;
  const hasDenyList =
    fileBoundary.denyImportsFrom && fileBoundary.denyImportsFrom.length > 0;

  // Check deny list first - deny takes precedence for safety
  // This handles the case where you allow a parent boundary but deny a specific sub-boundary
  if (
    hasDenyList &&
    fileBoundary.denyImportsFrom!.some((id) =>
      matchesBoundaryIdentifier(id, targetBoundary),
    )
  ) {
    // Check if it's also in allow list - if so, this is a configuration error
    // Deny still takes precedence for safety
    const alsoInAllowList =
      hasAllowList &&
      fileBoundary.allowImportsFrom!.some((id) =>
        matchesBoundaryIdentifier(id, targetBoundary),
      );
    return {
      reason: alsoInAllowList
        ? `Boundary '${fileIdentifier}' explicitly denies imports from '${targetIdentifier}' (deny takes precedence over allow)`
        : `Boundary '${fileIdentifier}' explicitly denies imports from '${targetIdentifier}'`,
    };
  }

  // Check allow list - only if not in deny list
  if (
    hasAllowList &&
    fileBoundary.allowImportsFrom!.some((id) =>
      matchesBoundaryIdentifier(id, targetBoundary),
    )
  ) {
    return null; // Explicitly allowed
  }

  // If only allow list exists: deny-all by default
  if (hasAllowList && !hasDenyList) {
    return {
      reason: `Cross-boundary import from '${targetIdentifier}' to '${fileIdentifier}' is not allowed. Add '${targetIdentifier}' to 'allowImportsFrom' if this import is intentional.`,
    };
  }

  // If only deny list exists: allow-all by default (except denied items)
  if (hasDenyList && !hasAllowList) {
    return null; // Allowed (not in deny list)
  }

  // If neither list exists: deny-all by default (strictest)
  return {
    reason: `Cross-boundary import from '${targetIdentifier}' to '${fileIdentifier}' is not allowed. Add '${targetIdentifier}' to 'allowImportsFrom' if this import is intentional.`,
  };
}
