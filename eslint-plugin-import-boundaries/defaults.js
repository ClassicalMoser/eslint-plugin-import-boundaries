/**
 * Default configurations for common architectural patterns.
 * These can be used as starting points and easily overridden.
 *
 * For use in ESLint flat config (JavaScript/CommonJS).
 */

/**
 * Default hexagonal architecture (ports and adapters) configuration.
 *
 * @param {Partial<import('./types.js').RuleOptions>} overrides - Partial configuration to override defaults
 * @returns {import('./types.js').RuleOptions} Complete rule options with hexagonal defaults
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
export function hexagonalDefaults(overrides = {}) {
  const defaults = {
    rootDir: 'src',
    crossBoundaryStyle: 'alias',
    boundaries: [
      {
        dir: 'domain',
        alias: '@domain',
        // Domain is pure - no dependencies on other layers
        denyImportsFrom: ['@application', '@infrastructure', '@composition'],
      },
      {
        dir: 'application',
        alias: '@application',
        // Application can use domain, but not infrastructure
        allowImportsFrom: ['@domain'],
        denyImportsFrom: ['@infrastructure', '@composition'],
      },
      {
        dir: 'application/ports',
        alias: '@ports',
        // Ports (nested in application) can import from infrastructure
        // This is the key hexagonal pattern - ports bridge application and infrastructure
        allowImportsFrom: ['@domain', '@infrastructure', '@application'],
        nestedPathFormat: 'relative', // Use ../... for @application imports
      },
      {
        dir: 'infrastructure',
        alias: '@infrastructure',
        // Infrastructure can use domain and application
        allowImportsFrom: ['@domain', '@application'],
        denyImportsFrom: ['@composition'],
      },
      {
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
 * @param {Partial<import('./types.js').RuleOptions>} overrides - Partial configuration to override defaults
 * @returns {import('./types.js').RuleOptions} Complete rule options with simple defaults
 */
export function simpleDefaults(overrides = {}) {
  const defaults = {
    rootDir: 'src',
    crossBoundaryStyle: 'alias',
    boundaries: [
      { dir: 'domain', alias: '@domain' },
      { dir: 'application', alias: '@application' },
      { dir: 'infrastructure', alias: '@infrastructure' },
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
