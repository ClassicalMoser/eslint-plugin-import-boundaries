/**
 * Default values for relationship detection.
 * Extracted to reduce mutation opportunities and improve testability.
 */

export const DEFAULT_CROSS_BOUNDARY_STYLE = 'alias' as const;
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
 * Get default file extensions as a new array.
 * Returns a new array each time to avoid mutation issues.
 */
export function getDefaultFileExtensions(): string[] {
  return [...DEFAULT_FILE_EXTENSIONS];
}
