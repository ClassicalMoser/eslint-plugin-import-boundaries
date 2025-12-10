/**
 * Helper functions for pathUtils.ts
 * Extracted to improve testability and reduce mutation opportunities.
 */

import path from 'node:path';

/**
 * Check if a relative path is empty (current directory).
 */
export function isEmptyRelativePath(rel: string): boolean {
  return rel === '';
}

/**
 * Check if a relative path indicates the path is outside the directory.
 */
export function isOutsidePath(rel: string): boolean {
  return rel.startsWith('..') || path.isAbsolute(rel);
}

/**
 * Check if a string has a truthy value (non-empty, non-null, non-undefined).
 */
export function isTruthy(value: string | null | undefined): value is string {
  return Boolean(value);
}

/**
 * Check if a string is not the current directory marker.
 */
export function isNotCurrentDir(value: string): boolean {
  return value !== '.';
}

/**
 * Check if a path is empty or current directory marker.
 */
export function isEmptyOrCurrentDir(relativePath: string): boolean {
  return relativePath === '' || relativePath === '.';
}

/**
 * Check if a file extension exists.
 */
export function hasFileExtension(ext: string): boolean {
  return ext.length > 0;
}

/**
 * Check if extensions array is provided.
 */
export function hasExtensionsFilter(
  extensions: string[] | undefined,
): extensions is string[] {
  return extensions !== undefined;
}

/**
 * Check if extension is in the filter list.
 */
export function isExtensionInFilter(
  ext: string,
  extensions: string[],
): boolean {
  return extensions.includes(ext);
}
