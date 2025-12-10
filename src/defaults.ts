/**
 * Default configurations for common architectural patterns.
 * These can be used as starting points and easily overridden.
 */

import type { RuleOptions } from '@shared';

/**
 * Default hexagonal architecture (ports and adapters) configuration.
 *
 * @param overrides - Partial configuration to override defaults
 * @returns Complete rule options with hexagonal defaults
 *
 * @example
 * ```javascript
 * // Use defaults as-is
 * const config = hexagonalDefaults();
 *
 * // Override specific values
 * const config = hexagonalDefaults({
 *   rootDir: 'lib',
 *   boundaries: [
 *     ...hexagonalDefaults().boundaries,
 *     { dir: 'shared', alias: '@shared' }
 *   ]
 * });
 * ```
 */
export function hexagonalDefaults(
  overrides: Partial<RuleOptions> = {},
): RuleOptions {
  const defaults: RuleOptions = {
    rootDir: 'src',
    crossBoundaryStyle: 'alias',
    boundaries: [
      {
        identifier: '@domain',
        dir: 'domain',
        alias: '@domain',
        // Domain is pure - no dependencies on other layers
        denyImportsFrom: ['@application', '@infrastructure', '@composition'],
      },
      {
        identifier: '@application',
        dir: 'application',
        alias: '@application',
        // Application can use domain, but not infrastructure
        allowImportsFrom: ['@domain'],
        denyImportsFrom: ['@infrastructure', '@composition'],
      },
      {
        identifier: '@ports',
        dir: 'application/ports',
        alias: '@ports',
        // Ports (nested in application) can import from infrastructure
        // This is the key hexagonal pattern - ports bridge application and infrastructure
        allowImportsFrom: ['@domain', '@infrastructure', '@application'],
        nestedPathFormat: 'relative', // Use ../... for @application imports
      },
      {
        identifier: '@infrastructure',
        dir: 'infrastructure',
        alias: '@infrastructure',
        // Infrastructure can use domain (values)
        // Infrastructure can use ports and domain (types only) - needs port interfaces to implement
        allowImportsFrom: ['@domain'],
        allowTypeImportsFrom: ['@domain', '@ports'],
        denyImportsFrom: ['@composition'],
      },
      {
        identifier: '@composition',
        dir: 'composition',
        alias: '@composition',
        // Composition (wiring) can import from everything
        allowImportsFrom: [
          '@domain',
          '@application',
          '@infrastructure',
          '@ports',
        ],
      },
    ],
  };

  // Merge overrides with defaults
  return {
    ...defaults,
    ...overrides,
    // Deep merge boundaries array
    boundaries: overrides.boundaries
      ? [...defaults.boundaries, ...overrides.boundaries]
      : defaults.boundaries,
  };
}

/**
 * Simple default configuration with no architectural restrictions.
 * Only enforces path format, not boundary rules.
 *
 * @param overrides - Partial configuration to override defaults
 * @returns Complete rule options with simple defaults
 */
export function simpleDefaults(
  overrides: Partial<RuleOptions> = {},
): RuleOptions {
  const defaults: RuleOptions = {
    rootDir: 'src',
    crossBoundaryStyle: 'alias',
    boundaries: [
      { identifier: '@domain', dir: 'domain', alias: '@domain' },
      { identifier: '@application', dir: 'application', alias: '@application' },
      {
        identifier: '@infrastructure',
        dir: 'infrastructure',
        alias: '@infrastructure',
      },
    ],
  };

  return {
    ...defaults,
    ...overrides,
    boundaries: overrides.boundaries
      ? [...defaults.boundaries, ...overrides.boundaries]
      : defaults.boundaries,
  };
}
