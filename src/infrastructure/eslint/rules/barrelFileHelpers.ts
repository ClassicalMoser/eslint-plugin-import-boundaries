/**
 * Pure helper functions shared between barrel file rules.
 * Extracted for testability — no ESLint types involved.
 */

export const DEFAULT_BARREL_FILE_NAME = 'index';

/**
 * Returns true if the given filename is a barrel (index) file.
 * Checks by comparing the basename (without extension) to barrelFileName.
 *
 * @example
 * isBarrelFile('/project/src/domain/index.ts', 'index') // true
 * isBarrelFile('/project/src/domain/army.ts', 'index')  // false
 */
export function isBarrelFile(
  filename: string,
  barrelFileName: string,
): boolean {
  const basename = filename.split('/').pop() ?? '';
  const basenameWithoutExt = basename.replace(/\.[^.]+$/, '');
  return basenameWithoutExt === barrelFileName;
}

/**
 * Classify a raw import specifier for use in barrel files.
 *
 * Returns:
 * - 'valid'        ./file.ts — correct direct sibling with extension
 * - 'no-ext'       ./file — sibling but missing file extension
 * - 'not-sibling'  anything else (../x, ./sub/x, absolute, alias)
 */
export type ImportClassification = 'valid' | 'no-ext' | 'not-sibling';

export function classifyBarrelImport(spec: string): ImportClassification {
  if (!spec.startsWith('./')) {
    return 'not-sibling';
  }

  const rest = spec.slice(2); // strip './'

  // No subdirectory allowed: must not contain '/'
  if (rest.includes('/')) {
    return 'not-sibling';
  }

  // Must have an explicit file extension
  if (!rest.includes('.')) {
    return 'no-ext';
  }

  return 'valid';
}
