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
  if (!ext) return false;
  if (extensions) {
    return extensions.includes(ext);
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
