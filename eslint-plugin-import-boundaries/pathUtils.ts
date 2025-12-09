/**
 * Path utility functions for the boundary-alias-vs-relative ESLint rule.
 * Pure path math - no file I/O.
 */

import path from 'node:path';

/**
 * Check if a path is inside a directory.
 * Uses path.relative() which is more reliable than string comparison.
 *
 * @param absDir - Absolute directory path
 * @param absPath - Absolute file or directory path to check
 * @returns true if absPath is inside absDir (or is absDir itself)
 *
 * Examples:
 * - isInsideDir('/a/b', '/a/b/file.ts') => true
 * - isInsideDir('/a/b', '/a/b/c/file.ts') => true
 * - isInsideDir('/a/b', '/a/file.ts') => false (../file.ts)
 * - isInsideDir('/a/b', '/a/b') => true (empty relative path)
 */
export function isInsideDir(absDir: string, absPath: string): boolean {
  const rel = path.relative(absDir, absPath);
  // Empty string means paths are the same
  if (rel === '') return true;
  // If relative path starts with '..', it's outside the directory
  // If it's absolute, it's definitely outside
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}
