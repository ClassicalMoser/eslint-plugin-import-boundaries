/**
 * Default values for import handler options.
 * Delegates to DEFAULTS from shared — single source of truth.
 */

import { DEFAULTS } from '@shared';

export const DEFAULT_IS_TYPE_ONLY = false;
export const DEFAULT_SKIP_BOUNDARY_RULES = false;

/**
 * Get default values for import handler options.
 * This function centralizes defaults to make them easily testable.
 */
export function getImportHandlerDefaults() {
  return {
    crossBoundaryStyle: DEFAULTS.crossBoundaryStyle,
    allowUnknownBoundaries: DEFAULTS.allowUnknownBoundaries,
    isTypeOnly: DEFAULT_IS_TYPE_ONLY,
    skipBoundaryRules: DEFAULT_SKIP_BOUNDARY_RULES,
    barrelFileName: DEFAULTS.barrelFileName,
    fileExtensions: [...DEFAULTS.fileExtensions],
  };
}
