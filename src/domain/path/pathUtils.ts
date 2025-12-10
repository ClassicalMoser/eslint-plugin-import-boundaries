/**
 * Path utility functions for the boundary-alias-vs-relative ESLint rule.
 * Pure path math - no file I/O.
 */

import path from 'node:path';
import {
  hasExtensionsFilter,
  hasFileExtension,
  isEmptyOrCurrentDir,
  isEmptyRelativePath,
  isExtensionInFilter,
  isNotCurrentDir,
  isOutsidePath,
  isTruthy,
} from './pathUtilsHelpers';

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
  if (isEmptyRelativePath(rel)) return true;
  // If relative path starts with '..', it's outside the directory
  // If it's absolute, it's definitely outside
  return !isOutsidePath(rel);
}

/**
 * Check if a path has a file extension.
 * Extension-agnostic - checks for any extension, not just specific ones.
 *
 * @param filePath - Path to check
 * @param extensions - Optional list of extensions to check for (if provided, only matches these)
 * @returns true if path has an extension
 *
 * Examples:
 * - hasExtension('file.ts') => true
 * - hasExtension('file.tsx') => true
 * - hasExtension('file.js') => true
 * - hasExtension('dir') => false
 * - hasExtension('dir/file') => false
 */
export function hasExtension(filePath: string, extensions?: string[]): boolean {
  const ext = path.extname(filePath);
  if (!hasFileExtension(ext)) return false;
  if (hasExtensionsFilter(extensions)) {
    return isExtensionInFilter(ext, extensions);
  }
  return true; // Any extension
}

/**
 * Get the basename without extension from a file path.
 * Extension-agnostic - strips any extension.
 *
 * @param filePath - File path
 * @returns Basename without extension
 *
 * Examples:
 * - getBasenameWithoutExt('/a/b/file.ts') => 'file'
 * - getBasenameWithoutExt('/a/b/file.tsx') => 'file'
 * - getBasenameWithoutExt('/a/b/file.js') => 'file'
 * - getBasenameWithoutExt('/a/b/index.ts') => 'index'
 */
export function getBasenameWithoutExt(filePath: string): string {
  const basename = path.basename(filePath);
  const ext = path.extname(basename);
  return ext ? basename.slice(0, -ext.length) : basename;
}

/**
 * Convert a relative path string to an array of path segments.
 * Filters out empty segments and current directory markers ('.').
 *
 * Used for comparing paths segment-by-segment to find where they diverge.
 *
 * @param relativePath - Relative path string (e.g., 'a/b/c' or '../utils')
 * @returns Array of path segments, or empty array if path is empty or '.'
 *
 * Examples:
 * - pathToParts('a/b/c') => ['a', 'b', 'c']
 * - pathToParts('../utils') => ['..', 'utils']
 * - pathToParts('') => []
 * - pathToParts('.') => []
 * - pathToParts('a/./b') => ['a', 'b'] (filters out '.')
 */
export function pathToParts(relativePath: string): string[] {
  // Empty string or '.' represents current directory (no segments)
  if (isEmptyOrCurrentDir(relativePath)) {
    return [];
  }
  // Split by path separator and filter out empty segments and current dir markers
  return relativePath
    .split(path.sep)
    .filter((p) => isTruthy(p) && isNotCurrentDir(p));
}
