/**
 * Helper functions for pathUtils.ts
 * Extracted to improve testability and reduce mutation opportunities.
 */

/**
 * Check if a relative path is empty (current directory).
 */
export function isEmptyRelativePath(rel: string): boolean {
  return rel === '';
}

import path from 'node:path';

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

