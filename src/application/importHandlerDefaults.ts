/**
 * Default values for import handler options.
 * Extracted to reduce mutation opportunities and improve testability.
 */

export const DEFAULT_CROSS_BOUNDARY_STYLE = 'alias' as const;
export const DEFAULT_ALLOW_UNKNOWN_BOUNDARIES = false;
export const DEFAULT_IS_TYPE_ONLY = false;
export const DEFAULT_SKIP_BOUNDARY_RULES = false;
export const DEFAULT_BARREL_FILE_NAME = 'index';
export const DEFAULT_FILE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
] as const;

/**
 * Get default values for import handler options.
 * This function centralizes defaults to make them easily testable.
 */
export function getImportHandlerDefaults() {
  return {
    crossBoundaryStyle: DEFAULT_CROSS_BOUNDARY_STYLE,
    allowUnknownBoundaries: DEFAULT_ALLOW_UNKNOWN_BOUNDARIES,
    isTypeOnly: DEFAULT_IS_TYPE_ONLY,
    skipBoundaryRules: DEFAULT_SKIP_BOUNDARY_RULES,
    barrelFileName: DEFAULT_BARREL_FILE_NAME,
    fileExtensions: [...DEFAULT_FILE_EXTENSIONS],
  };
}

