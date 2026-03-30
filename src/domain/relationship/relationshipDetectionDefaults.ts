/**
 * Default values for relationship detection.
 * Delegates to DEFAULTS from shared — single source of truth.
 */

import { DEFAULTS } from '@shared';

export const DEFAULT_BARREL_FILE_NAME = DEFAULTS.barrelFileName;

/**
 * Get default file extensions as a new array.
 * Returns a new array each time to avoid mutation issues.
 */
export function getDefaultFileExtensions(): string[] {
  return [...DEFAULTS.fileExtensions];
}
