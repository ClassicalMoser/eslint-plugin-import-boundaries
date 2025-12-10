/**
 * Helper functions for creating Boundary objects in tests.
 * Provides smart defaults: identifier defaults to alias ?? dir (works for >95% of tests).
 */

import type { Boundary } from '@shared';
import path from 'node:path';

/**
 * Create a Boundary object with smart defaults.
 * - identifier defaults to alias ?? dir (works for most tests)
 * - absDir is computed from dir, rootDir, and cwd
 *
 * @param config - Boundary configuration object
 * @param config.identifier - Optional - defaults to alias ?? dir (smart default for >95% of tests)
 * @param config.dir - Required - relative directory path (e.g., 'domain/entities')
 * @param config.alias - Optional - import alias (e.g., '@entities')
 * @param config.allowImportsFrom - Optional - array of boundary identifiers that can be imported from
 * @param config.denyImportsFrom - Optional - array of boundary identifiers that cannot be imported from
 * @param config.allowTypeImportsFrom - Optional - array of boundary identifiers that can be imported as types
 * @param config.nestedPathFormat - Optional - path format for nested boundaries
 * @param config.severity - Optional - severity for violations in this boundary
 * @param options - Optional configuration
 * @param options.rootDir - Optional - root directory (default: 'src')
 * @param options.cwd - Optional - current working directory (default: '/project')
 * @returns Boundary with identifier as first property
 *
 * @example
 * ```typescript
 * // Most common case - identifier defaults to alias
 * createBoundary({ dir: 'domain', alias: '@domain' })
 * // identifier: '@domain'
 *
 * // Absolute mode - identifier defaults to dir
 * createBoundary({ dir: 'domain' })
 * // identifier: 'domain'
 *
 * // Override identifier when needed
 * createBoundary({ identifier: 'core', dir: 'domain', alias: '@domain' })
 * // identifier: 'core'
 * ```
 */
export function createBoundary(
  config: {
    identifier?: string; // Optional - defaults to alias ?? dir (smart default for >95% of tests)
    dir: string;
    alias?: string;
    allowImportsFrom?: string[];
    denyImportsFrom?: string[];
    allowTypeImportsFrom?: string[];
    nestedPathFormat?: 'alias' | 'relative' | 'inherit';
    severity?: 'error' | 'warn';
  },
  options?: {
    rootDir?: string;
    cwd?: string;
  },
): Boundary {
  const rootDir = options?.rootDir ?? 'src';
  const cwd = options?.cwd ?? '/project';
  return {
    identifier: config.identifier ?? config.alias ?? config.dir,
    dir: config.dir,
    alias: config.alias,
    absDir: path.resolve(cwd, rootDir, config.dir),
    allowImportsFrom: config.allowImportsFrom,
    denyImportsFrom: config.denyImportsFrom,
    allowTypeImportsFrom: config.allowTypeImportsFrom,
    nestedPathFormat: config.nestedPathFormat,
    severity: config.severity,
  };
}

/**
 * Create multiple boundaries at once.
 * Useful for test setup with multiple boundaries.
 * Same smart defaults as createBoundary.
 */
export function createBoundaries(
  configs: Array<{
    identifier?: string; // Optional - defaults to alias ?? dir
    dir: string;
    alias?: string;
    allowImportsFrom?: string[];
    denyImportsFrom?: string[];
    allowTypeImportsFrom?: string[];
    nestedPathFormat?: 'alias' | 'relative' | 'inherit';
    severity?: 'error' | 'warn';
  }>,
  options?: {
    rootDir?: string;
    cwd?: string;
  },
): Boundary[] {
  return configs.map((config) => createBoundary(config, options));
}
